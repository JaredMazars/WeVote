import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle, Vote, Zap, Shield, User, ArrowRight } from 'lucide-react';

const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [nameError, setNameError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [isMicrosoftLoading, setIsMicrosoftLoading] = useState(false);
  const { login, register, loginWithMicrosoft, isLoading } = useAuth();
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
    setConfirmPasswordError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();

    // Common validation
    if (!email) {
      setEmailError('Email is required');
      return;
    }
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }
    if (!password) {
      setPasswordError('Password is required');
      return;
    }
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    if (isLogin) {
      // Login logic
      try {
        const success = await login(email, password);
        if (success) {
          navigate('/home');
        } else {
          setError('Invalid email or password. Please check your credentials and try again.');
        }
      } catch (error: any) {
        console.error('Login error:', error);
        setError(error.message || 'Login failed. Please try again.');
      }
    } else {
      // Registration logic
      if (!name) {
        setNameError('Name is required');
        return;
      }
      if (name.length < 2) {
        setNameError('Name must be at least 2 characters');
        return;
      }
      if (!confirmPassword) {
        setConfirmPasswordError('Please confirm your password');
        return;
      }
      if (password !== confirmPassword) {
        setConfirmPasswordError('Passwords do not match');
        return;
      }

      try {
        const userData = {
          email,
          password,
          name,
          avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0072CE&color=fff`
        };
        
        const success = await register(userData);
        if (success) {
          navigate('/home');
        } else {
          setError('Registration failed. Please try again.');
        }
      } catch (error: any) {
        console.error('Registration error:', error);
        setError(error.message || 'Registration failed. Please try again.');
      }
    }
  };

  const handleMicrosoftLogin = async () => {
    setIsMicrosoftLoading(true);
    setError('');
    
    try {
      const success = await loginWithMicrosoft();
      if (success) {
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

  const handleDemoFill = (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    clearErrors();
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setEmail('');
    setPassword('');
    setName('');
    setConfirmPassword('');
    clearErrors();
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
              <h2 className="text-3xl font-bold text-[#464B4B] mb-2">
                {isLogin ? 'Sign In' : 'Create Account'}
              </h2>
              <p className="text-[#464B4B]/60">
                {isLogin ? 'Access your voting dashboard' : 'Join the voting platform'}
              </p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center space-x-3"
              >
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                <p className="text-red-700 text-sm">{error}</p>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
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
                    autoComplete={isLogin ? "current-password" : "new-password"}
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

              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-[#464B4B] mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#464B4B]/40" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (confirmPasswordError) setConfirmPasswordError('');
                        if (error) setError('');
                      }}
                      className={`w-full pl-12 pr-12 py-3 border-2 rounded-xl transition-all duration-200 focus:outline-none ${
                        confirmPasswordError 
                          ? 'border-red-300 focus:border-red-500' 
                          : 'border-gray-200 focus:border-[#0072CE]'
                      }`}
                      placeholder="Confirm your password"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#464B4B]/40 hover:text-[#464B4B]"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {confirmPasswordError && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-500 text-sm mt-1 flex items-center space-x-1"
                    >
                      <AlertCircle className="h-4 w-4" />
                      <span>{confirmPasswordError}</span>
                    </motion.p>
                  )}
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

            {isLogin && (
              <>
                {/* Divider */}
                <div className="my-6 flex items-center">
                  <div className="flex-1 border-t border-gray-200"></div>
                  <span className="px-4 text-sm text-[#464B4B]/60 bg-white">or</span>
                  <div className="flex-1 border-t border-gray-200"></div>
                </div>

                {/* Microsoft OAuth Button */}
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

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={toggleMode}
                className="text-[#0072CE] hover:text-[#171C8F] font-medium transition-colors"
              >
                {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </button>
            </div>

            {isLogin && (
              <div className="mt-8 p-4 bg-[#F4F4F4] rounded-xl">
                <p className="text-sm text-[#464B4B]/70 mb-3 font-medium">Test Credentials:</p>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => handleDemoFill('test@example.com', 'password123')}
                    className="w-full text-left p-2 rounded-lg hover:bg-white transition-colors text-xs"
                  >
                    <span className="font-medium text-[#464B4B]">Test User:</span> test@example.com
                  </button>
                  <p className="text-xs text-[#464B4B]/60 px-2">
                    Click to fill form, then click Sign In to authenticate
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;