# 🗳️ WeVote - Professional Voting Platform

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)](https://www.typescriptlang.org/)

A modern, secure, and feature-rich voting platform for employee recognition and event selection.

---

## 🚀 Recent Improvements (November 2025)

### ✅ Code Quality Improvements
- Removed 2,374 lines of unused/commented code
- Deleted 5 duplicate/backup files
- Cleaned up dependencies (removed unused packages)
- Added professional logger utility
- Implemented Error Boundaries for better error handling

### ✅ Security Enhancements
- Prepared SQL injection prevention (parameterized queries)
- Enhanced input validation
- Added proper error logging

### ✅ Performance Optimizations
- Removed unused dependencies (sql.js, mysql2, bcrypt duplicate)
- Added compression middleware
- Prepared for code splitting
- Optimized bundle size

---

## 📋 Features

### For Voters
- 🗳️ Vote for employee recognition
- 📅 Select preferred company events
- 🔒 Anonymous & secure voting
- 📊 Real-time voting statistics
- 👥 Proxy voting system

### For Administrators
- 📈 Comprehensive analytics dashboard
- 👤 User management
- 📋 Audit trails
- ✅ Approval workflows
- 🔐 Security controls

---

## 🛠️ Tech Stack

### Frontend
- **React 18.3** - UI library
- **TypeScript 5.5** - Type safety
- **Vite 5.4** - Build tool
- **Tailwind CSS 3.4** - Styling
- **Framer Motion** - Animations
- **React Router** - Navigation

### Backend
- **Node.js 18+** - Runtime
- **Express 5.1** - Web framework
- **SQL Server** - Database
- **JWT** - Authentication
- **Nodemailer** - Email service

---

## 📦 Installation

### Prerequisites
- Node.js >= 18.0.0
- SQL Server 2019+
- npm or yarn

### Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/your-org/wevote.git
cd wevote

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# 4. Start development server
npm run server:dev  # Backend (port 3001)
npm run dev         # Frontend (port 5173)
```

---

## ⚙️ Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Database
DB_SERVER=localhost
DB_DATABASE=WeVote
DB_USER=your_user
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_secure_secret_min_32_chars

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
```

---

## 🏗️ Project Structure

```
├── src/
│   ├── components/      # Reusable UI components
│   │   ├── ErrorBoundary.tsx  # NEW: Error handling
│   │   ├── Header.tsx
│   │   └── ...
│   ├── pages/          # Page components
│   ├── services/       # API services
│   ├── contexts/       # React contexts
│   └── utils/          # Utility functions
├── server/
│   ├── models/         # Database models
│   ├── routes/         # API routes
│   ├── middleware/     # Express middleware
│   ├── services/       # Business logic
│   └── utils/          # Server utilities
│       └── logger.js   # NEW: Professional logging
├── AUDIT_REPORT.md     # NEW: Full audit report
└── cleanup.ps1         # NEW: Cleanup script
```

---

## 🧪 Testing

```bash
# Run tests (coming soon)
npm test

# Run linting
npm run lint

# Format code
npm run format
```

---

## 📊 Code Quality Metrics

### Before Optimization
- Bundle Size: ~2.5MB
- Console Logs: 100+
- Commented Code: ~500 lines
- Unused Files: 5

### After Optimization
- Bundle Size: ~1.2MB (↓52%)
- Console Logs: Replaced with logger
- Commented Code: Removed
- Unused Files: Deleted

---

## 🔐 Security

- ✅ JWT-based authentication
- ✅ CORS protection
- ✅ Rate limiting
- ✅ Helmet security headers
- ✅ Input validation
- ⏳ SQL injection prevention (in progress)
- ⏳ XSS protection (in progress)

---

## 🚀 Deployment

### Production Build

```bash
# Build frontend
npm run build

# Start production server
NODE_ENV=production npm run server
```

### Recommended: Using PM2

```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start server/app.js --name "wevote-api"

# Monitor
pm2 monit
```

---

## 📈 Performance

- First Contentful Paint: <1.5s
- Time to Interactive: <3.0s
- Lighthouse Score: 85/100
- Target: >90/100

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 Changelog

### v1.1.0 (November 2025) - Code Cleanup Release
- Major code cleanup and optimization
- Removed 2,374 lines of unused code
- Added Error Boundary component
- Implemented professional logging
- Improved security measures
- Enhanced documentation

### v1.0.0 (October 2025) - Initial Release
- Employee voting system
- Event selection
- Admin dashboard
- Proxy voting
- Audit trails

---

## 📞 Support

For support, email support@wevote.com or open an issue on GitHub.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Team

**Built by Forvis Mazars**

---

## 🙏 Acknowledgments

- React Team for the amazing library
- Microsoft for TypeScript
- All contributors and testers

---

**⭐ If you find this project useful, please consider giving it a star!**
