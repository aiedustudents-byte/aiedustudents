import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, AlertCircle, Briefcase } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithPopup, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, googleProvider, db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useUser } from '../contexts/UserContext';
import { verifyCollegeId } from '../lib/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [collegeId, setCollegeId] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { refreshUserData } = useUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsEmailLoading(true);

    try {
      // 1. Verify College ID via API (Skip for special admin email)
      const isAdminEmail = email === 'aiedustudents@gmail.com';
      let collegeVerification = { valid: true, collegeId: 'ADMIN', collegeName: '' };

      if (!isAdminEmail) {
        if (!collegeId) {
          setError('Please fill in all fields including College ID');
          setIsEmailLoading(false);
          return;
        }
        collegeVerification = await verifyCollegeId(collegeId);
        if (!collegeVerification.valid) {
          setError(collegeVerification.message || 'Invalid or inactive college code');
          setIsEmailLoading(false);
          return;
        }
      }

      // Simple email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setError('Please enter a valid email address');
        setIsEmailLoading(false);
        return;
      }

      // Validate Firebase auth is initialized
      if (!auth) {
        setError('Authentication service is not available. Please refresh the page.');
        setIsEmailLoading(false);
        return;
      }

      // Attempt email/password sign-in
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Determine user role based on email
      const userRole = (email === 'admin@example.com' || email === 'aiedustudents@gmail.com') ? 'admin' : 'student';
      const userName = (email === 'admin@example.com' || email === 'aiedustudents@gmail.com') ? 'Admin User' : 'Graduate Student';

      // Store user data in localStorage
      const userDataString = localStorage.getItem('userData');
      const existingData = userDataString ? JSON.parse(userDataString) : {};

      localStorage.setItem('authToken', await user.getIdToken() || 'firebase-token');
      localStorage.setItem('userData', JSON.stringify({
        email: user.email,
        name: existingData.name || userName,
        role: userRole,
        domain: existingData.domain || '',
        collegeId: collegeVerification.collegeId,
        collegeName: collegeVerification.collegeName,
        rememberMe: rememberMe,
        uid: user.uid
      }));

      // Update Firestore user profile with college information
      await setDoc(doc(db, 'user_profiles', user.uid), {
        collegeId: collegeVerification.collegeId,
        collegeName: collegeVerification.collegeName,
        updated_at: new Date().toISOString()
      }, { merge: true });

      // Refresh user context state
      refreshUserData();

      // Navigate based on role
      if (userRole === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      console.error('Login error:', err);

      // Handle Firebase authentication errors
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Invalid email or password. Please check your credentials and try again.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed login attempts. Please try again later.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Network error. Please check your internet connection.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Email/password authentication is not enabled. Please contact support.');
      } else if (err.code === 'auth/user-disabled') {
        setError('This account has been disabled. Please contact support.');
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setIsEmailLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setIsGoogleLoading(true);

    try {
      // Use Firebase Google Auth
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Determine user role (you can customize this logic)
      const userRole = user.email === 'admin@example.com' || user.email === 'aiedustudents@gmail.com' ? 'admin' : 'student';
      const userName = user.displayName || user.email?.split('@')[0] || 'User';

      // Check if user profile already exists in Firestore
      const profileDoc = await getDoc(doc(db, 'user_profiles', user.uid));

      if (!profileDoc.exists()) {
        // Create a new profile for first-time Google sign-in
        await setDoc(doc(db, 'user_profiles', user.uid), {
          uid: user.uid,
          email: user.email,
          name: userName,
          role: userRole,
          domain: '', // Default empty, user can set later or we can prompt
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          learning_goal: 'Master AI and Machine Learning'
        });
      } else {
        // Update existing profile with latest sign-in time
        await setDoc(doc(db, 'user_profiles', user.uid), {
          updated_at: new Date().toISOString()
        }, { merge: true });
      }

      // Store user data in localStorage
      const userDataString = localStorage.getItem('userData');
      const existingData = userDataString ? JSON.parse(userDataString) : {};

      localStorage.setItem('authToken', await user.getIdToken() || 'firebase-google-token');
      localStorage.setItem('userData', JSON.stringify({
        email: user.email,
        name: userName,
        role: userRole,
        domain: existingData.domain || '',
        rememberMe: rememberMe,
        uid: user.uid
      }));

      // Refresh user context state
      refreshUserData();

      // Navigate based on role
      if (userRole === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in was cancelled');
      } else if (err.code === 'auth/popup-blocked') {
        setError('Popup was blocked. Please allow popups for this site.');
      } else {
        setError('Google sign-in failed. Please try again.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fdfdfd] p-4 font-sans">
      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center">

        {/* Left Side: Illustration */}
        <div className="hidden md:flex flex-col items-center justify-center space-y-8">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-md relative"
          >
            {/* Using the generated illustration */}
            <img
              src="/login-illustration.png"
              alt="Login Illustration"
              className="w-full h-auto object-contain"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Link
              to="/signup"
              className="text-gray-600 hover:text-gray-900 border-b border-gray-600 pb-0.5 transition-colors font-medium"
            >
              Create an account
            </Link>
          </motion.div>
        </div>

        {/* Right Side: Login Form */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md mx-auto"
        >
          <div className="bg-white p-8 md:p-12">
            {/* Branding Section */}
            <div className="mb-12 flex justify-center">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="flex items-center"
              >
                <span className="text-[42px] font-extrabold text-black leading-none tracking-tight">AI-</span>
                <span className="text-[42px] font-black text-[#1e3a8a] leading-none tracking-tight flex items-center">
                  T
                  <div className="relative mx-1 w-10 h-10 flex items-center justify-center">
                    {/* Circuit-style O */}
                    <div className="absolute inset-0 rounded-full border-[3px] border-[#1e3a8a]"></div>
                    <div className="absolute w-5 h-[3px] bg-[#1e3a8a] left-0 top-1/2 -translate-y-1/2 -translate-x-1"></div>
                    <div className="absolute w-[3px] h-5 bg-[#1e3a8a] left-1/2 -translate-x-1/2 top-0 -translate-y-1"></div>
                    <div className="w-4 h-4 rounded-full border-2 border-[#1e3a8a] flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#1e3a8a] shadow-[0_0_8px_#1e3a8a]"></div>
                    </div>
                  </div>
                  DAY
                </span>
              </motion.div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.6 }}
                className="text-center text-sm font-medium text-[#1e3a8a]/60 tracking-[0.2em] uppercase mt-2 w-full"
              >
                for students
              </motion.p>
            </div>

            <h1 className="text-4xl font-bold text-gray-900 mb-10">Log in</h1>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4" />
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Email Input */}
              <div className="group">
                <div className="relative flex items-center">
                  <Mail className="w-5 h-5 text-gray-400 absolute left-0" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your Email"
                    className="w-full py-3 pl-8 pr-4 bg-transparent border-b border-gray-300 focus:border-gray-800 outline-none transition-colors placeholder-gray-300 text-gray-700"
                    required
                    disabled={isEmailLoading || isGoogleLoading}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="group">
                <div className="relative flex items-center">
                  <Lock className="w-5 h-5 text-gray-400 absolute left-0" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full py-3 pl-8 pr-12 bg-transparent border-b border-gray-300 focus:border-gray-800 outline-none transition-colors placeholder-gray-300 text-gray-700"
                    required
                    disabled={isEmailLoading || isGoogleLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* College ID Input - Hidden for special admin email */}
              {email !== 'aiedustudents@gmail.com' && (
                <div className="group">
                  <div className="relative flex items-center">
                    <Briefcase className="w-5 h-5 text-gray-400 absolute left-0" />
                    <input
                      type="text"
                      value={collegeId}
                      onChange={(e) => setCollegeId(e.target.value)}
                      placeholder="College ID"
                      className="w-full py-3 pl-8 pr-4 bg-transparent border-b border-gray-300 focus:border-gray-800 outline-none transition-colors placeholder-gray-300 text-gray-700"
                      required
                      disabled={isEmailLoading || isGoogleLoading}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="peer sr-only"
                      disabled={isEmailLoading || isGoogleLoading}
                    />
                    <div className="w-5 h-5 border-2 border-gray-300 rounded peer-checked:bg-blue-500 peer-checked:border-blue-500 transition-colors"></div>
                    <svg
                      className="absolute top-1 left-1 w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                  <span className="text-gray-500 group-hover:text-gray-700 transition-colors">Remember me</span>
                </label>

                {/* Forgot Password Link - Not in reference but keeping for UX */}
                {/*  <Link to="/forgot-password" className="text-sm text-gray-400 hover:text-gray-600">Forgot?</Link> */}
              </div>

              <button
                type="submit"
                disabled={isEmailLoading || isGoogleLoading}
                className="w-40 py-3 bg-[#6C9EE9] hover:bg-[#5b8bd6] text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isEmailLoading ? 'Logging in...' : 'Log in'}
              </button>
            </form>

            {/* Social Login */}
            <div className="mt-12 flex items-center gap-4">
              <span className="text-gray-500 text-sm">Or login with</span>
              <div className="flex gap-2">
                {/* Google Login (Functional) */}
                <button
                  onClick={handleGoogleSignIn}
                  disabled={isGoogleLoading || isEmailLoading}
                  className="w-10 h-10 rounded bg-[#DB4437] text-white flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGoogleLoading ? (
                    <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <span className="font-bold text-lg">G</span>
                  )}
                </button>
              </div>
            </div>

            {/* Mobile only Create Account (since left side is hidden on mobile) */}
            <div className="mt-8 md:hidden text-center">
              <Link to="/signup" className="text-gray-600 hover:text-gray-900 border-b border-gray-600 pb-0.5">Create an account</Link>
            </div>

          </div>
        </motion.div>
      </div >
    </div >
  );
}