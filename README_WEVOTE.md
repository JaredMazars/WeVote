# WeVote - Modern Voting Platform

A secure and intuitive voting platform built for **Forvis Mazars** to empower employee engagement and transparent decision-making.

![WeVote Platform](https://img.shields.io/badge/Built%20with-React%20%2B%20TypeScript-blue)
![Vite](https://img.shields.io/badge/Vite-5.0-646CFF)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.3-38B2AC)

## 🌟 Features

### Authentication & User Management
- ✅ **Email/Password Authentication** - Secure login system
- ✅ **Microsoft OAuth Integration** - Single sign-on with Microsoft accounts
- ✅ **Password Management** - Reset and update functionality
- ✅ **Email Verification** - Ensure valid user accounts

### Employee Profiles
- 📝 **Complete Registration** - Multi-step employee profile creation
- 🎯 **Skills Tracking** - Document skills, proficiency levels, and certifications
- 🏆 **Achievements** - Showcase accomplishments and awards
- 👥 **Department Management** - Organize by departments and managers

### Voting System
- 🗳️ **Candidate Voting** - Vote for outstanding team members
- 📋 **Resolution Voting** - Cast votes on company resolutions (Yes/No/Abstain)
- 📊 **Real-time Results** - Live voting progress and analytics
- 🔒 **Secure & Anonymous** - Enterprise-grade security and privacy

### Proxy Voting
- 🤝 **Discretionary Proxy** - Trust someone to vote on your behalf
- 📝 **Instructional Proxy** - Provide specific voting instructions
- ⚖️ **Split Voting** - Divide votes based on different preferences
- ⏰ **Time-Limited** - Set start and end dates for proxy appointments

### Additional Features
- 📱 **WhatsApp Integration** - Send voting notifications via WhatsApp
- 🎨 **Beautiful UI** - Modern design with smooth animations
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile
- ⚡ **Fast Performance** - Built with Vite for lightning-fast load times

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Backend API server running on `http://localhost:3001`

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd WeVote
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   ```
   http://localhost:5173
   ```

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **React 19** | UI framework |
| **TypeScript** | Type safety |
| **Vite** | Build tool & dev server |
| **Tailwind CSS** | Utility-first styling |
| **Framer Motion** | Smooth animations |
| **React Router** | Client-side routing |
| **Lucide React** | Beautiful icons |

## 📁 Project Structure

```
WeVote/
├── src/
│   ├── components/          # Reusable UI components
│   │   └── ProxyAppointmentForm.tsx
│   ├── contexts/            # React Context providers
│   │   └── AuthContext.tsx
│   ├── pages/               # Page components
│   │   ├── Home.tsx
│   │   ├── Login.tsx
│   │   ├── EmployeeRegister.tsx
│   │   └── VotingSelection.tsx
│   ├── services/            # API services
│   │   └── api.ts
│   ├── types/               # TypeScript types
│   │   └── index.ts
│   ├── App.tsx              # Main app component
│   ├── main.tsx             # Entry point
│   └── index.css            # Global styles
├── public/                  # Static assets
├── .github/                 # GitHub config
│   └── copilot-instructions.md
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

## 🎨 Design System

### Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| Primary Blue | `#0072CE` | Primary actions, links |
| Primary Navy | `#171C8F` | Gradients, accents |
| Neutral Gray | `#464B4B` | Text, headings |
| Light Gray | `#F4F4F4` | Backgrounds |

### Key UI Patterns

- **Gradients**: `from-[#0072CE] to-[#171C8F]`
- **Rounded Corners**: `rounded-2xl` or `rounded-3xl`
- **Shadows**: `shadow-xl` or `shadow-2xl`
- **Animations**: Framer Motion with spring physics

## 🔌 API Integration

The frontend expects a REST API backend at `http://localhost:3001/api` with the following endpoints:

### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `PUT /auth/update-password/:userId` - Update password

### Employees
- `GET /employees` - List all employees
- `POST /employees/register` - Register employee profile
- `GET /employees/status/:userId` - Check employee status
- `POST /employees/send-whatsapp` - Send WhatsApp notifications

### Voting
- `GET /candidates` - List candidates
- `GET /resolutions` - List resolutions
- `POST /votes/cast` - Cast a vote
- `GET /votes/results` - Get voting results

### Proxy
- `POST /proxy/appoint` - Appoint a proxy
- `GET /proxy/appointments/:userId` - Get proxy appointments
- `GET /proxy/for-user/:userId` - Get proxies for user

## 🧪 Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

## 📝 Usage

### For Voters

1. **Login** - Use your email and password or Microsoft account
2. **Choose Category** - Select Candidate or Resolution voting
3. **Cast Vote** - Review options and make your selection
4. **View Results** - See real-time voting results

### For Proxy Voters

1. **Receive Appointment** - Get proxy authorization from another member
2. **Review Instructions** - Check if discretionary or instructional
3. **Cast Proxy Votes** - Vote on behalf of appointing members
4. **Confirm Submission** - Ensure all proxy votes are recorded

## 👥 Credits

**Designed and Developed by:**
- Jared Moodley
- Bilal Cassim

**For:**
- Forvis Mazars

---

**© 2025 Forvis Mazars. All rights reserved.**
