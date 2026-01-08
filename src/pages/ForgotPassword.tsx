import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, Sparkles, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../lib/firebase';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setIsLoading(true);

    try {
      // Basic validation
      if (!email) {
        setError('Please enter your email address');
        setIsLoading(false);
        return;
      }

      // Simple email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setError('Please enter a valid email address');
        setIsLoading(false);
        return;
      }

      // Validate Firebase auth is initialized
      if (!auth) {
        setError('Authentication service is not available. Please refresh the page.');
        setIsLoading(false);
        return;
      }

      // Send password reset email
      await sendPasswordResetEmail(auth, email);
      setSuccess(true);
    } catch (err: any) {
      console.error('Password reset error:', err);

      // Handle Firebase authentication errors
      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email address.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many requests. Please try again later.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Network error. Please check your internet connection.');
      } else {
        setError('Failed to send reset email. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        background: 'radial-gradient(circle at 50% 50%, #0c1e7f 0%, #060c3a 85%)'
      }}
    >
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            rotate: 360,
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-10 left-10 w-8 h-8 text-warm-brown/20"
        >
          <Sparkles className="w-full h-full" />
        </motion.div>
        <motion.div
          animate={{
            rotate: -360,
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-20 right-20 w-6 h-6 text-secondary-accent/20"
        >
          <Sparkles className="w-full h-full" />
        </motion.div>
        <motion.div
          animate={{
            rotate: 360,
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute bottom-20 left-20 w-10 h-10 text-warning/20"
        >
          <Sparkles className="w-full h-full" />
        </motion.div>
      </div>

      {/* Forgot Password Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div
          className="rounded-card relative"
          style={{
            background: '#fdfdfd',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25), 0 10px 10px -5px rgba(0, 0, 0, 0.15)',
            border: '1px solid rgba(12, 30, 127, 0.10)',
            padding: '2rem'
          }}
        >
          {/* Back to Login Link */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <Link to="/login">
              <motion.button
                whileHover={{ scale: 1.02, x: -4 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </motion.button>
            </Link>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold text-gray-800 mb-2"
          >
            Forgot Password?
          </motion.h1>
          <p className="text-sm text-gray-600">
            Enter your email address and we'll send you a link to reset your password.
          </p>

          {/* Success Message */}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2"
            >
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800">
                  Password reset email sent!
                </p>
                <p className="text-xs text-green-700 mt-1">
                  Please check your inbox and follow the instructions to reset your password.
                </p>
              </div>
            </motion.div>
          )}

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-error/10 border border-error/20 rounded-lg flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 text-error flex-shrink-0" />
              <span className="text-sm text-error">{error}</span>
            </motion.div>
          )}

          {/* Form */}
          {!success && (
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              {/* Email Field */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-800 mb-2">
                  <Mail className="w-4 h-4" style={{ color: '#0c1e7f' }} />
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    style={{
                      border: '1px solid rgba(12, 30, 127, 0.25)'
                    }}
                    className="w-full pl-10 pr-4 py-2 rounded-button text-gray-800 placeholder-[#9aa3c8] focus:outline-none focus:ring-2 focus:shadow-inner focus:border-2 transition-all bg-white"
                    onFocus={(e) => {
                      e.target.style.borderColor = 'rgba(12, 30, 127, 0.7)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(12, 30, 127, 0.25)';
                    }}
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <motion.button
                whileHover={!isLoading ? { scale: 1.02 } : {}}
                whileTap={!isLoading ? { scale: 0.98 } : {}}
                type="submit"
                disabled={isLoading}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.backgroundColor = '#0a196c';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.backgroundColor = '#0c1e7f';
                  }
                }}
                style={!isLoading ? {
                  backgroundColor: '#0c1e7f'
                } : {}}
                className={`w-full font-medium py-2.5 px-4 rounded-button flex items-center justify-center gap-2 shadow-card transition-all duration-300 ${isLoading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'text-white hover:shadow-hover'
                  }`}
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    Send Reset Link
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </motion.button>
            </motion.form>
          )}

          {/* Back to Login Link (Bottom) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center mt-6"
          >
            <p className="text-gray-600 text-sm">
              Remember your password?{' '}
              <Link
                to="/login"
                className="font-medium transition-colors"
                style={{ color: '#0c1e7f' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'rgba(12, 30, 127, 0.8)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#0c1e7f';
                }}
              >
                Sign in here
              </Link>
            </p>
          </motion.div>
        </div>
      </motion.div >
    </div >
  );
}

