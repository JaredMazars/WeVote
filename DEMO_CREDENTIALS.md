# 🔐 Demo Login Credentials

## WeVote Platform - Test Without Backend!

Your WeVote app now includes **demo credentials** that work without needing a backend server running!

---

## 🎯 Demo Accounts

### 👤 Regular Employee User
```
Email:    demo@wevote.com
Password: demo123
```
**Features:**
- Access to voting dashboard
- Can vote on candidates and resolutions
- Can appoint proxies
- View home page and features

---

### 👨‍💼 Admin User
```
Email:    admin@wevote.com
Password: admin123
```
**Features:**
- All regular user features
- Admin role assigned
- Can manage votes (when backend is connected)
- Access to admin features

---

## 📝 How It Works

The demo credentials are built into the `src/services/api.ts` file:

1. When you login with demo credentials, it bypasses the backend API
2. Returns a mock user object with all required fields
3. Stores the session in localStorage just like a real login
4. Works with all existing app features

---

## 🚀 Using the Demo

1. **Open the app** at http://localhost:5173
2. **You'll see the demo credentials displayed** on the login page
3. **Click on the email/password** in the info box to copy (or type them)
4. **Click "Sign In"** - you'll be logged in instantly!
5. **Explore the app** - navigate through home, voting pages, etc.

---

## 🔄 When You Connect a Real Backend

When you have your backend API running at `http://localhost:3001`, the app will:

1. First try the demo credentials (if they match)
2. If not, it will try the real API
3. You can remove the demo code from `api.ts` once your backend is ready

To remove demo mode, simply delete the demo credential check in `src/services/api.ts` lines 34-60.

---

## 🎨 What You'll See

After logging in with demo credentials:
- ✅ Redirected to beautiful Home page
- ✅ Access to voting selection
- ✅ Can navigate to proxy appointment
- ✅ Employee registration available
- ✅ All UI features functional

---

## 💡 Tips

- **Demo credentials are shown on the login page** - no need to remember them!
- The demo box has a **gradient blue/blue background** - hard to miss!
- **Quick copy**: The credentials are in code boxes for easy copying
- **Two accounts**: Try both regular and admin to see different experiences

---

## 🎯 What's Next?

1. **Test the app** with demo credentials
2. **Explore all features** without backend dependency
3. **Develop your backend API** at your own pace
4. **Replace demo logic** when backend is ready

---

**Enjoy testing WeVote!** 🚀

*Built with care for Forvis Mazars by Jared Moodley and Bilal Cassim*
