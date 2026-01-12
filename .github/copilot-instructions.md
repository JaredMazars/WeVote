# WeVote - Voting Platform

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Overview

WeVote is a modern voting platform built for Forvis Mazars to facilitate employee engagement and transparent decision-making through secure voting on candidate recognitions and company resolutions.

## Tech Stack

- **Frontend Framework**: React 18+ with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Routing**: React Router DOM v6
- **Icons**: Lucide React
- **Backend API**: REST API (Node.js/Express expected at http://localhost:3001)

## Key Features

1. **Authentication System**
   - Email/Password login
   - Microsoft OAuth integration
   - Password reset functionality
   - Email verification

2. **Employee Management**
   - Employee registration with profiles
   - Skills and achievements tracking
   - Department and manager assignment

3. **Voting System**
   - Candidate voting
   - Resolution voting (Yes/No/Abstain)
   - Real-time results

4. **Proxy Voting**
   - Discretionary proxy (proxy votes at their discretion)
   - Instructional proxy (specific voting instructions)
   - Split voting support

## Code Style Guidelines

- Use TypeScript for all components
- Follow functional component patterns with hooks
- Use Tailwind CSS utility classes for styling
- Implement Framer Motion for animations
- Keep components modular and reusable
- Use async/await for API calls
- Handle errors gracefully with user-friendly messages

## Brand Colors

- Primary Blue: #0072CE
- Primary Navy: #171C8F
- Neutral Gray: #464B4B
- Light Gray: #F4F4F4

## Component Patterns

- All pages should use the same gradient background: `bg-gradient-to-br from-[#F4F4F4] via-white to-[#F4F4F4]`
- Buttons should use the gradient: `bg-gradient-to-r from-[#0072CE] to-[#171C8F]`
- Use rounded-3xl or rounded-2xl for cards and containers
- Implement shadow-2xl or shadow-xl for elevated elements
- Add hover effects with scale transformations using Framer Motion

## API Integration

- All API calls go through the `src/services/api.ts` service
- API base URL: `http://localhost:3001/api`
- Handle loading states with spinners
- Show success/error messages with animated alerts

## File Structure

```
src/
├── components/     # Reusable UI components
├── contexts/       # React context providers (Auth, etc.)
├── pages/          # Page components
├── services/       # API services and utilities
├── types/          # TypeScript type definitions
└── App.tsx         # Main app with routing
```

## Development Notes

- The backend server should be running on port 3001
- WhatsApp integration is available for sending voting notifications
- Employee records are linked to user accounts
- Proxy appointments can be time-limited
