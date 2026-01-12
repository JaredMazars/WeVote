import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle, Vote, Zap, Shield, User, ArrowRight } from 'lucide-react';
import api from '../services/api';
import CheckInModal from '../components/CheckInModal';

const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [nameError, setNameError] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPasswordUpdate, setShowPasswordUpdate] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isMicrosoftLoading, setIsMicrosoftLoading] = useState(false);
  const [loggedInUserId, setLoggedInUserId] = useState<string | null>(null);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [isAuditorLogin, setIsAuditorLogin] = useState(false);
  const { login, loginWithMicrosoft, isLoading, getCurrentUserId } = useAuth();
  const navigate = useNavigate();

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const clearErrors = () => {
    setError('');
    setEmailError('');
    setPasswordError('');
    setNameError('');
  };

  useEffect(() => {
    if (localStorage.getItem('passwordChange') === 'true') {
      setShowPasswordUpdate(true);
      localStorage.removeItem('passwordChange');
    } else {
      setShowPasswordUpdate(false);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();

    if (!email) {
      setEmailError('Email is required');
      return;
    }
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    if (isLogin) {
      if (!password) {
        setPasswordError('Password is required');
        return;
      }
      if (password.length < 6) {
        setPasswordError('Password must be at least 6 characters');
        return;
      }

      try {
        const user = await login(email, password);

        if (!user || !user.id) {
          setError('Invalid email or password. Please check your credentials and try again.');
          return;
        }

        setLoggedInUserId(user.id);

        // Check if user needs to update their password (temp password from email)
        const needsPasswordUpdate = user.needs_password_change === 1 || user.is_temp_password === 1;
        
        if (needsPasswordUpdate) {
          setShowPasswordUpdate(true);
          return;
        }

        await proceedAfterLogin(user.id, email);

      } catch (error: any) {
        console.error('Login error:', error);
        setError(error?.message || 'Login failed. Please try again.');
      }

    } else {
      console.log('Registration logic not implemented yet.');
    }
  };

  const proceedAfterLogin = async (userId: string, userEmail: string) => {
    // Skip employee status check - not critical for login
    
    // Check user role and redirect accordingly
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      
      // Redirect super admins to super admin panel
      if (userData.role === 'super_admin') {
        navigate('/superadmin');
        return;
      }
      
      // Redirect regular admins to admin dashboard
      if (userData.role === 'admin') {
        navigate('/admin');
        return;
      }
      
      // Redirect auditors to auditor portal
      if (userData.role === 'auditor' || isAuditorLogin) {
        navigate('/auditor');
        return;
      }
    }

    // Check if AGM is active - show check-in modal for regular users
    const timerStart = localStorage.getItem('agmTimerStart');
    const timerEnd = localStorage.getItem('agmTimerEnd');
    
    if (timerStart && !timerEnd) {
      // AGM is active, show check-in modal
      setShowCheckInModal(true);
      return;
    }

    const proxyChoice = localStorage.getItem('proxyChoice');
    if (proxyChoice === 'digital') {
      navigate('/proxy-form', { state: { userEmail } });
    } else {
      navigate('/home');
    }
  };

  const handlePasswordUpdate = async () => {
    clearErrors();

    if (!newPassword || newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }

    if (!loggedInUserId) {
      setError('Session expired. Please login again.');
      setShowPasswordUpdate(false);
      return;
    }

    try {
      const result = await api.updatePassword(loggedInUserId, newPassword);

      if (result.success) {
        setError('');
        setShowPasswordUpdate(false);
        
        const successDiv = document.createElement('div');
        successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        successDiv.textContent = '✅ Password updated successfully!';
        document.body.appendChild(successDiv);
        
        setTimeout(() => {
          successDiv.remove();
        }, 3000);

        await proceedAfterLogin(loggedInUserId, email);

      } else {
        setError(result.message || 'Failed to update password');
      }
    } catch (err: any) {
      console.error('Password update error:', err);
      setError(err.message || 'Failed to update password');
    }
  };

  const handleMicrosoftLogin = async () => {
    setIsMicrosoftLoading(true);
    setError('');

    try {
      const success = await loginWithMicrosoft();
      if (success) {
        const userId = getCurrentUserId();
        // Skip employee status check - just proceed to home
        navigate('/home');
      } else {
        setError('Microsoft authentication failed. Please try again.');
      }
    } catch (error: any) {
      setError(error.message || 'Microsoft authentication failed');
    } finally {
      setIsMicrosoftLoading(false);
    }
  };

  const handleClick = () => {
    navigate('/employee-login-register');
  };

  const handleForgotPassword = () => {
    navigate('/forgot-password');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F4F4F4] via-white to-[#F4F4F4] flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Branding */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="hidden lg:block"
        >
          <div className="text-center lg:text-left">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-[#0072CE] to-[#171C8F] rounded-2xl mb-8"
            >
              <Vote className="h-10 w-10 text-white" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-5xl font-bold text-[#464B4B] mb-4"
            >
              Welcome to
              <span className="bg-gradient-to-r from-[#0072CE] to-[#171C8F] bg-clip-text text-transparent"> WeVote</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xl text-[#464B4B]/70 mb-8 leading-relaxed"
            >
              built by Forvis Mazars.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-4"
            >
              {[
                { icon: Zap, text: "Lightning-fast voting experience" },
                { icon: Shield, text: "Enterprise-grade security" },
                { icon: Vote, text: "Real-time results & analytics" }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="flex items-center space-x-3"
                >
                  <div className="w-8 h-8 bg-[#0072CE]/10 rounded-lg flex items-center justify-center">
                    <feature.icon className="h-4 w-4 text-[#0072CE]" />
                  </div>
                  <span className="text-[#464B4B]/80">{feature.text}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.div>

        {/* Right Side - Login/Register Form */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-md mx-auto"
        >
          <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="lg:hidden inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-[#0072CE] to-[#171C8F] rounded-2xl mb-4"
              >
                <Vote className="h-8 w-8 text-white" />
              </motion.div>
              
              {/* Login Type Toggle */}
              {isLogin && (
                <div className="flex gap-2 justify-center mb-4">
                  <button
                    type="button"
                    onClick={() => setIsAuditorLogin(false)}
                    className={`px-6 py-2 rounded-xl font-semibold transition-all ${
                      !isAuditorLogin
                        ? 'bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white shadow-lg'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <User className="inline w-4 h-4 mr-2" />
                    User Login
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAuditorLogin(true)}
                    className={`px-6 py-2 rounded-xl font-semibold transition-all ${
                      isAuditorLogin
                        ? 'bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white shadow-lg'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Shield className="inline w-4 h-4 mr-2" />
                    Auditor Login
                  </button>
                </div>
              )}
              
              <h2 className="text-3xl font-bold text-[#464B4B] mb-2">
                {showPasswordUpdate ? 'Update Password' : (isLogin ? (isAuditorLogin ? 'Auditor Sign In' : 'Sign In') : 'Create Account')}
              </h2>
              <p className="text-[#464B4B]/60">
                {showPasswordUpdate 
                  ? 'Please create a new secure password' 
                  : (isLogin 
                      ? (isAuditorLogin 
                          ? 'Access the audit portal' 
                          : 'Access your voting dashboard') 
                      : 'Join the voting platform - we\'ll email you your password')}
              </p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6"
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-red-800 mb-1">
                      Authentication Failed
                    </h3>
                    <p className="text-sm text-red-700">
                      {error}
                    </p>
                  </div>
                  <button
                    onClick={() => setError('')}
                    className="flex-shrink-0 text-red-400 hover:text-red-600 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </motion.div>
            )}

            {!showPasswordUpdate ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Demo Credentials Info */}
                {/* {isLogin && (
                  <div className="bg-gradient-to-r from-blue-50 to-blue-50 border-2 border-blue-200 rounded-xl p-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-blue-900 mb-2">🎯 Demo Credentials (No Backend Required)</h4>
                        <div className="space-y-2 text-xs">
                          {!isAuditorLogin ? (
                            <>
                              <div className="bg-white rounded-lg p-2 border border-blue-200">
                                <p className="font-semibold text-blue-800">Regular User:</p>
                                <p className="text-gray-700">Email: <code className="bg-blue-100 px-1 py-0.5 rounded">demo@wevote.com</code></p>
                                <p className="text-gray-700">Password: <code className="bg-blue-100 px-1 py-0.5 rounded">demo123</code></p>
                              </div>
                              <div className="bg-white rounded-lg p-2 border border-blue-200">
                                <p className="font-semibold text-blue-800">Admin User:</p>
                                <p className="text-gray-700">Email: <code className="bg-blue-100 px-1 py-0.5 rounded">admin@wevote.com</code></p>
                                <p className="text-gray-700">Password: <code className="bg-blue-100 px-1 py-0.5 rounded">admin123</code></p>
                              </div>
                              <div className="bg-white rounded-lg p-2 border border-yellow-200">
                                <p className="font-semibold text-yellow-800">Super Admin:</p>
                                <p className="text-gray-700">Email: <code className="bg-yellow-100 px-1 py-0.5 rounded">superadmin@wevote.com</code></p>
                                <p className="text-gray-700">Password: <code className="bg-yellow-100 px-1 py-0.5 rounded">super123</code></p>
                                <p className="text-xs text-yellow-600 mt-1">👑 Full platform control & multi-AGM management</p>
                              </div>
                            </>
                          ) : (
                            <div className="bg-white rounded-lg p-2 border border-green-200">
                              <p className="font-semibold text-green-800">Auditor User:</p>
                              <p className="text-gray-700">Email: <code className="bg-green-100 px-1 py-0.5 rounded">auditor@wevote.com</code></p>
                              <p className="text-gray-700">Password: <code className="bg-green-100 px-1 py-0.5 rounded">audit123</code></p>
                              <p className="text-xs text-green-600 mt-1">🔒 Read-only access to audit portal</p>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-blue-600 mt-2 italic">💡 These work without a backend server!</p>
                      </div>
                    </div>
                  </div>
                )} */}

                {!isLogin && (
                  <div>
                    <label className="block text-sm font-medium text-[#464B4B] mb-2">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#464B4B]/40" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          if (nameError) setNameError('');
                          if (error) setError('');
                        }}
                        className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl transition-all duration-200 focus:outline-none ${
                          nameError
                            ? 'border-red-300 focus:border-red-500'
                            : 'border-gray-200 focus:border-[#0072CE]'
                        }`}
                        placeholder="Enter your full name"
                        autoComplete="name"
                      />
                    </div>
                    {nameError && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-500 text-sm mt-1 flex items-center space-x-1"
                      >
                        <AlertCircle className="h-4 w-4" />
                        <span>{nameError}</span>
                      </motion.p>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-[#464B4B] mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#464B4B]/40" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (emailError) setEmailError('');
                        if (error) setError('');
                      }}
                      className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl transition-all duration-200 focus:outline-none ${
                        emailError
                          ? 'border-red-300 focus:border-red-500'
                          : 'border-gray-200 focus:border-[#0072CE]'
                      }`}
                      placeholder="Enter your email"
                      autoComplete="email"
                    />
                  </div>
                  {emailError && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-500 text-sm mt-1 flex items-center space-x-1"
                    >
                      <AlertCircle className="h-4 w-4" />
                      <span>{emailError}</span>
                    </motion.p>
                  )}
                </div>

                {isLogin && (
                  <div>
                    <label className="block text-sm font-medium text-[#464B4B] mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#464B4B]/40" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (passwordError) setPasswordError('');
                          if (error) setError('');
                        }}
                        className={`w-full pl-12 pr-12 py-3 border-2 rounded-xl transition-all duration-200 focus:outline-none ${
                          passwordError
                            ? 'border-red-300 focus:border-red-500'
                            : 'border-gray-200 focus:border-[#0072CE]'
                        }`}
                        placeholder="Enter your password"
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#464B4B]/40 hover:text-[#464B4B]"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {passwordError && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-500 text-sm mt-1 flex items-center space-x-1"
                      >
                        <AlertCircle className="h-4 w-4" />
                        <span>{passwordError}</span>
                      </motion.p>
                    )}
                  </div>
                )}

                {!isLogin && (
                  <div>
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                      <div className="flex items-center space-x-2">
                        <Mail className="h-5 w-5 text-blue-500" />
                        <p className="text-blue-700 text-sm font-medium">
                          We'll generate a secure password and email it to you!
                        </p>
                      </div>
                      <p className="text-blue-600 text-xs mt-1 ml-7">
                        Check your inbox after registration for login credentials.
                      </p>
                    </div>
                  </div>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoading || isMicrosoftLoading}
                  className="w-full relative bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-200 disabled:opacity-70"
                >
                  {isLoading || isMicrosoftLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>{isLogin ? 'Signing in...' : 'Creating account...'}</span>
                    </div>
                  ) : (
                    isLogin ? 'Sign In' : 'Create Account'
                  )}
                </motion.button>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-5 w-5 text-blue-500" />
                    <p className="text-blue-700 text-sm font-medium">
                      You're using a temporary password. Please create a new secure password to continue.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#464B4B] mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#464B4B]/40" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        if (passwordError) setPasswordError('');
                        if (error) setError('');
                      }}
                      className={`w-full pl-12 pr-12 py-3 border-2 rounded-xl transition-all duration-200 focus:outline-none ${
                        passwordError
                          ? 'border-red-300 focus:border-red-500'
                          : 'border-gray-200 focus:border-[#0072CE]'
                      }`}
                      placeholder="Enter your new password (min 6 characters)"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#464B4B]/40 hover:text-[#464B4B]"
                    >
                      {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {passwordError && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-500 text-sm mt-1 flex items-center space-x-1"
                    >
                      <AlertCircle className="h-4 w-4" />
                      <span>{passwordError}</span>
                    </motion.p>
                  )}
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={handlePasswordUpdate}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-200 disabled:opacity-70"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Updating...</span>
                    </div>
                  ) : (
                    'Update Password & Continue'
                  )}
                </motion.button>
              </div>
            )}

            {!showPasswordUpdate && isLogin && (
              <>
                <div className="my-6 flex items-center">
                  <div className="flex-1 border-t border-gray-200"></div>
                  <span className="px-4 text-sm text-[#464B4B]/60 bg-white">or</span>
                  <div className="flex-1 border-t border-gray-200"></div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleMicrosoftLogin}
                  disabled={isLoading || isMicrosoftLoading}
                  className="w-full bg-white border-2 border-gray-200 text-[#464B4B] py-3 rounded-xl font-medium hover:border-gray-300 hover:shadow-md transition-all duration-200 disabled:opacity-70 flex items-center justify-center space-x-3"
                >
                  {isMicrosoftLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 border-2 border-[#464B4B]/30 border-t-[#464B4B] rounded-full animate-spin" />
                      <span>Connecting to Microsoft...</span>
                    </div>
                  ) : (
                    <>
                      <svg className="w-5 h-5" viewBox="0 0 23 23">
                        <path fill="#f35325" d="M1 1h10v10H1z"/>
                        <path fill="#81bc06" d="M12 1h10v10H12z"/>
                        <path fill="#05a6f0" d="M1 12h10v10H1z"/>
                        <path fill="#ffba08" d="M12 12h10v10H12z"/>
                      </svg>
                      <span>Continue with Microsoft</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </motion.button>
              </>
            )}

            {!showPasswordUpdate && (
              <>
                <div className="mt-6 text-center">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-[#0072CE] hover:text-[#171C8F] font-medium transition-colors"
                  >
                    {isLogin ? "Forgot Password?" : "Already have an account? Sign in"}
                  </button>
                </div>

                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={handleClick}
                    className="text-[#0072CE] hover:text-[#171C8F] font-medium transition-colors"
                  >
                    {isLogin ? "Register Member" : "Already have an account? Sign in"}
                  </button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>

      {/* Check-In Modal */}
      <CheckInModal 
        isOpen={showCheckInModal} 
        onClose={() => {
          setShowCheckInModal(false);
          navigate('/home');
        }}
        onCheckIn={(meetingId) => {
          console.log('User checked in to meeting:', meetingId);
        }}
      />
    </div>
  );
}

export default Login;
