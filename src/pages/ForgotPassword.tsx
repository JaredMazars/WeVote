import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, AlertCircle, CheckCircle, Vote } from 'lucide-react';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email) {
      setError('Email is required');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(data.message || 'A temporary password has been sent to your email address. Please check your inbox.');
        setEmail('');
        
        // Redirect to login after 5 seconds
        setTimeout(() => {
          navigate('/login');
        }, 5000);
      } else {
        setError(data.message || 'Failed to process your request. Please try again.');
      }
    } catch (error: any) {
      console.error('Forgot password error:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
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
              Reset Your
              <span className="bg-gradient-to-r from-[#0072CE] to-[#171C8F] bg-clip-text text-transparent"> Password</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xl text-[#464B4B]/70 mb-8 leading-relaxed"
            >
              Don't worry! We'll send you a temporary password to get back into your account.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-4"
            >
              {[
                { step: "1", text: "Enter your email address" },
                { step: "2", text: "Check your inbox for temporary password" },
                { step: "3", text: "Login and create a new password" }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="flex items-center space-x-3"
                >
                  <div className="w-8 h-8 bg-[#0072CE]/10 rounded-lg flex items-center justify-center">
                    <span className="text-[#0072CE] font-bold">{item.step}</span>
                  </div>
                  <span className="text-[#464B4B]/80">{item.text}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.div>

        {/* Right Side - Forgot Password Form */}
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
                Forgot Password?
              </h2>
              <p className="text-[#464B4B]/60">
                Enter your email and we'll send you a temporary password
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
                      Error
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

            {success && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-6"
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-green-800 mb-1">
                      Success!
                    </h3>
                    <p className="text-sm text-green-700">
                      {success}
                    </p>
                    <p className="text-xs text-green-600 mt-2">
                      Redirecting to login page in 5 seconds...
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
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
                      if (error) setError('');
                    }}
                    className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl transition-all duration-200 focus:outline-none ${
                      error
                        ? 'border-red-300 focus:border-red-500'
                        : 'border-gray-200 focus:border-[#0072CE]'
                    }`}
                    placeholder="Enter your email"
                    autoComplete="email"
                    disabled={isLoading || success !== ''}
                  />
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading || success !== ''}
                className="w-full relative bg-gradient-to-r from-[#0072CE] to-[#171C8F] text-white py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-200 disabled:opacity-70"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Sending...</span>
                  </div>
                ) : (
                  'Send Temporary Password'
                )}
              </motion.button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => navigate('/login')}
                disabled={isLoading}
                className="inline-flex items-center space-x-2 text-[#0072CE] hover:text-[#171C8F] font-medium transition-colors disabled:opacity-50"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Login</span>
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200 text-center">
              <p className="text-sm text-[#464B4B]/60">
                Need help? Contact{' '}
                <a href="mailto:support@wevote.com" className="text-[#0072CE] hover:underline">
                  support@wevote.com
                </a>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ForgotPassword;
