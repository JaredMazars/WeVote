// =====================================================
// Marlon AI Assistant - Chat Route
// =====================================================

const express = require('express');
const router = express.Router();
const { AzureOpenAI } = require('openai');

// In-memory chat history keyed by userId (cleared on server restart)
// Structure: { [userId]: { messages: [{role, content}], updatedAt } }
const chatHistories = {};

// Max messages to keep per user in history
const MAX_HISTORY = 40;

// Lazy-initialise the OpenAI client so the route loads even if env vars are missing at startup
let _openaiClient = null;
function getClient() {
  if (!_openaiClient) {
    _openaiClient = new AzureOpenAI({
      apiKey: process.env.AZURE_OPENAI_API_KEY,
      endpoint: process.env.AZURE_OPENAI_ENDPOINT,
      deployment: process.env.AZURE_OPENAI_DEPLOYMENT,
      apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2025-04-01-preview',
    });
  }
  return _openaiClient;
}

const OFF_TOPIC_REPLY = 'That question is outside the scope of the WeVote AGM voting platform. Please ask a question related to voting, proxies, resolutions, or the platform itself.';

// Keywords that must appear for a message to be considered on-topic.
// Deliberately strict — only clear voting/platform terms qualify.
const ON_TOPIC_KEYWORDS = [
  'vote', 'voting', 'voted', 'votes', 'voter',
  'ballot',
  'agm', 'annual general meeting',
  'candidate', 'candidates',
  'resolution', 'resolutions',
  'proxy', 'proxies',
  'split voting', 'split vote',
  'vote result', 'voting result',
  'verify', 'verification', 'vote receipt',
  'login', 'log in', 'log out', 'logout', 'register on', 'sign in',
  'wevote', 'we vote',
  'abstain',
  'quorum', 'agenda item', 'motion',
  'cast my vote', 'cast a vote',
  'proxy form', 'proxy appointment',
  'voting session', 'voting platform',
  'forvis mazars',
];

function isOnTopic(message) {
  const lower = message.toLowerCase();
  return ON_TOPIC_KEYWORDS.some((kw) => lower.includes(kw));
}

const SYSTEM_PROMPT = `You are Marlon, the official AI assistant for the WeVote AGM voting platform at Forvis Mazars.

CRITICAL RULE — READ FIRST:
You are NOT a general-purpose assistant. You have one job only: helping users with the WeVote AGM voting platform.

If a message is not directly about WeVote, AGM voting, or this platform, respond with ONLY this sentence and nothing else:
"That question is outside the scope of the WeVote AGM voting platform. Please ask a question related to voting, proxies, resolutions, or the platform itself."

Do NOT attempt to answer. Do NOT be helpful. Do NOT relate the question back to WeVote to justify answering it. Do NOT explain what you cannot do. Output that one sentence only and stop.

This applies to ALL off-topic questions without exception, including:
- People's names or identities ("who is X", "who is Bilal", "who is the CEO")
- Feelings, relationships, personal advice
- General knowledge, history, science, news, or trivia
- Coding, writing, creative tasks
- Anything not directly about this voting platform

NEVER try to connect an off-topic question to WeVote to justify answering it. If someone asks "who is Bilal" the only correct response is the refusal sentence above.

---

ALLOWED TOPICS (only these):
- How to log in or register on WeVote
- How to cast a candidate vote or resolution vote (Yes/No/Abstain)
- How proxy voting works (discretionary or instructional)
- How split voting works
- How to view results or verify a vote
- Navigating the WeVote platform
- AGM procedures and agenda items
- Contacting an administrator

When answering allowed topics:
- Be concise and professional
- Use bullet points for step-by-step instructions
- Do not speculate on vote outcomes or user-specific data
- If unsure about organisation-specific details, direct the user to their administrator`;


// GET /api/chat/history - Get chat history for the current user
router.get('/history', (req, res) => {
  const userId = req.user?.userId?.toString();
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const history = chatHistories[userId];
  if (!history) return res.json({ messages: [] });

  // Return only user/assistant messages (not system), formatted for the frontend
  const formatted = history.messages.map((m, i) => ({
    id: `${userId}-${i}`,
    role: m.role,
    content: m.content,
    createdAt: m.createdAt || new Date().toISOString(),
  }));

  res.json({ messages: formatted });
});

// POST /api/chat - Send a message and receive AI response
router.post('/', async (req, res) => {
  const userId = req.user?.userId?.toString();
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { message } = req.body;
  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'message is required' });
  }

  // ── Topic guard: reject clearly off-topic messages before hitting the AI ──
  if (!isOnTopic(message)) {
    // Still save user message and the canned reply to history so the chat UI shows it
    if (!chatHistories[userId]) chatHistories[userId] = { messages: [] };
    chatHistories[userId].messages.push({ role: 'user', content: message.trim(), createdAt: new Date().toISOString() });
    const refusalMsg = { role: 'assistant', content: OFF_TOPIC_REPLY, createdAt: new Date().toISOString() };
    chatHistories[userId].messages.push(refusalMsg);
    return res.json({
      message: { id: `${userId}-guard-${Date.now()}`, ...refusalMsg },
    });
  }

  // Check Azure OpenAI is configured
  if (!process.env.AZURE_OPENAI_API_KEY || process.env.AZURE_OPENAI_API_KEY === 'placeholder') {
    return res.status(503).json({
      error: 'Marlon AI is not yet configured. Please set AZURE_OPENAI_API_KEY in the backend .env file.',
    });
  }

  // Initialise history for this user if needed
  if (!chatHistories[userId]) {
    chatHistories[userId] = { messages: [] };
  }

  const userHistory = chatHistories[userId];

  // Add user message
  userHistory.messages.push({
    role: 'user',
    content: message.trim(),
    createdAt: new Date().toISOString(),
  });

  // Trim history to MAX_HISTORY (keep most recent)
  if (userHistory.messages.length > MAX_HISTORY) {
    userHistory.messages = userHistory.messages.slice(userHistory.messages.length - MAX_HISTORY);
  }

  // Build conversation for OpenAI (without createdAt metadata)
  const conversation = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...userHistory.messages.map(({ role, content }) => ({ role, content })),
  ];

  try {
    const client = getClient();
    const completion = await client.chat.completions.create({
      model: process.env.AZURE_OPENAI_MODEL || 'gpt-5.3-chat',
      messages: conversation,
      max_completion_tokens: 2000,
    });

    const aiContent =
      completion.choices[0]?.message?.content ||
      'I apologise, but I was unable to generate a response. Please try again.';

    // Save assistant reply to history
    const assistantMessage = {
      role: 'assistant',
      content: aiContent,
      createdAt: new Date().toISOString(),
    };
    userHistory.messages.push(assistantMessage);
    userHistory.updatedAt = new Date().toISOString();

    res.json({
      message: {
        id: `${userId}-${userHistory.messages.length - 1}`,
        role: 'assistant',
        content: aiContent,
        createdAt: assistantMessage.createdAt,
      },
    });
  } catch (err) {
    console.error('Marlon chat error:', err);

    if (err?.status === 401 || err?.code === 'invalid_api_key') {
      return res.status(503).json({
        error: 'Azure OpenAI API key is invalid. Please check AZURE_OPENAI_API_KEY in backend/.env.',
      });
    }
    if (err?.status === 429) {
      return res.status(429).json({ error: 'Marlon is receiving too many requests. Please wait a moment and try again.' });
    }

    res.status(500).json({ error: 'Failed to process your message. Please try again.' });
  }
});

// DELETE /api/chat/history - Clear chat history for the current user
router.delete('/history', (req, res) => {
  const userId = req.user?.userId?.toString();
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  delete chatHistories[userId];
  res.json({ success: true });
});

module.exports = router;
