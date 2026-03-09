import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AzureOpenAI } from 'openai';

const openai = new AzureOpenAI({
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  endpoint: process.env.AZURE_OPENAI_ENDPOINT,
  apiVersion: '2024-12-01-preview',
});

// GET: Fetch chat history for a note section
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const entityId = searchParams.get('entityId');
    const noteSection = searchParams.get('noteSection');

    if (!entityId || !noteSection) {
      return NextResponse.json({ error: 'entityId and noteSection are required' }, { status: 400 });
    }

    const messages = await prisma.chatMessage.findMany({
      where: {
        userId: session.user.id,
        entityId,
        noteSection,
      },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        role: true,
        content: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Send a message and get AI response
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { entityId, noteSection, message, sectionTitle, sectionDescription } = body;

    if (!entityId || !noteSection || !message) {
      return NextResponse.json({ error: 'entityId, noteSection, and message are required' }, { status: 400 });
    }

    // Save the user message
    await prisma.chatMessage.create({
      data: {
        userId: session.user.id,
        entityId,
        noteSection,
        role: 'user',
        content: message,
      },
    });

    // Fetch recent conversation history for context (last 20 messages)
    const recentMessages = await prisma.chatMessage.findMany({
      where: {
        userId: session.user.id,
        entityId,
        noteSection,
      },
      orderBy: { createdAt: 'asc' },
      take: 20,
      select: {
        role: true,
        content: true,
      },
    });

    // Build the system prompt with note section context
    const systemPrompt = `You are Merlyn, a friendly and knowledgeable AI assistant specializing in Annual Financial Statements (AFS) and auditing. You help auditors draft note disclosures for financial statements.

You are currently assisting with the "${sectionTitle || noteSection}" note section.
${sectionDescription ? `This section covers: ${sectionDescription}` : ''}

Your expertise includes:
- IFRS for SMEs and full IFRS standards
- South African financial reporting requirements
- Note disclosure requirements and best practices
- Accounting policies and treatments
- Common audit findings and how to address them
- Financial statement presentation requirements

Guidelines:
- Be concise but thorough in your responses
- Reference specific IFRS standards when relevant (e.g., IAS 16, IFRS 9, etc.)
- Provide practical examples when helpful
- If you're unsure about something, say so rather than guessing
- Use professional but approachable language
- When suggesting disclosure wording, format it clearly so it can be easily used
- You may use markdown formatting in your responses`;

    // Build conversation messages for OpenAI
    const conversationMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
      ...recentMessages.map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
    ];

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-5-mini',
      messages: conversationMessages,
      max_completion_tokens: 2000,
    });

    const aiResponse = completion.choices[0]?.message?.content || 'I apologize, but I was unable to generate a response. Please try again.';

    // Save the assistant message
    const savedMessage = await prisma.chatMessage.create({
      data: {
        userId: session.user.id,
        entityId,
        noteSection,
        role: 'assistant',
        content: aiResponse,
      },
    });

    return NextResponse.json({
      message: {
        id: savedMessage.id,
        role: 'assistant',
        content: aiResponse,
        createdAt: savedMessage.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Error in chat API:', error);

    if (error?.status === 401 || error?.code === 'invalid_api_key') {
      return NextResponse.json({ error: 'Azure OpenAI API key is not configured or invalid. Please check AZURE_OPENAI_API_KEY and AZURE_OPENAI_ENDPOINT in your environment variables.' }, { status: 503 });
    }

    return NextResponse.json({ error: 'Failed to process message' }, { status: 500 });
  }
}

// DELETE: Clear chat history for a note section
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const entityId = searchParams.get('entityId');
    const noteSection = searchParams.get('noteSection');

    if (!entityId || !noteSection) {
      return NextResponse.json({ error: 'entityId and noteSection are required' }, { status: 400 });
    }

    await prisma.chatMessage.deleteMany({
      where: {
        userId: session.user.id,
        entityId,
        noteSection,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error clearing chat history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

