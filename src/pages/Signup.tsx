import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles, AlertCircle, User, ArrowLeft, Briefcase, ChevronDown } from 'lucide-react';
import { verifyCollegeId, syncStudentCount, incrementStudentCount } from '../lib/api';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useUser } from '../contexts/UserContext';

export default function Signup() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        domain: '',
        collegeId: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { refreshUserData } = useUser();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword || !formData.collegeId) {
                setError('Please fill in all fields including College ID');
                setIsLoading(false);
                return;
            }

            // 1. Verify College ID (Step 1 from user snippet)
            const verification = await verifyCollegeId(formData.collegeId);
            if (!verification.valid) {
                let errorMessage = 'Invalid College ID.';
                switch (verification.reason) {
                    case 'NOT_FOUND':
                        errorMessage = 'College ID not found. Please check and try again.';
                        break;
                    case 'INACTIVE':
                        errorMessage = 'This college is currently inactive. Please contact your college admin.';
                        break;
                    case 'PLAN_EXPIRED':
                        errorMessage = 'This college\'s plan has expired. Please contact your college admin.';
                        break;
                    default:
                        errorMessage = verification.message || 'Unable to verify college at the moment. Please try again.';
                }
                setError(errorMessage);
                setIsLoading(false);
                return;
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.email)) {
                setError('Please enter a valid email address');
                setIsLoading(false);
                return;
            }

            if (formData.password.length < 6) {
                setError('Password must be at least 6 characters long');
                setIsLoading(false);
                return;
            }

            if (formData.password !== formData.confirmPassword) {
                setError('Passwords do not match');
                setIsLoading(false);
                return;
            }

            // 2. Create Firebase Auth user (Step 2)
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            const user = userCredential.user;
            const userRole = (formData.email === 'admin@example.com' || formData.email === 'aiedustudents@gmail.com') ? 'admin' : 'student';

            // Store in localStorage
            localStorage.setItem('authToken', await user.getIdToken() || 'firebase-token');
            localStorage.setItem('userData', JSON.stringify({
                email: user.email,
                name: formData.name,
                role: userRole,
                domain: formData.domain,
                collegeId: verification.collegeId,
                collegeName: verification.collegeName,
                rememberMe: false,
                uid: user.uid
            }));

            // 3. Create student profile in Firestore (Step 3) - sync with correct collection 'user_profiles'
            await setDoc(doc(db, 'user_profiles', user.uid), {
                uid: user.uid,
                email: user.email,
                name: formData.name,
                role: userRole,
                domain: formData.domain,
                collegeId: verification.collegeId,
                collegeName: verification.collegeName,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                learning_goal: 'Master AI and Machine Learning',
                active: true
            });

            // 4. Sync and increment student count to College App (Step 4)
            if (verification.collegeId) {
                // Existing non-blocking sync (if other systems rely on this)
                syncStudentCount(verification.collegeId, 'created');

                // NEW: Inform College App that a student has been created so it
                // can increment totalStudents for dashboards.
                incrementStudentCount(verification.collegeId);
            }

            refreshUserData();

            if (userRole === 'admin') {
                navigate('/admin');
            } else {
                navigate('/');
            }
        } catch (err: any) {
            console.error('Signup error:', err);
            if (err.code === 'auth/email-already-in-use') {
                setError('An account with this email already exists.');
            } else {
                setError('Account creation failed. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e: any) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    return (
        <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
            <div className="hidden md:flex flex-col bg-white p-12 relative">
                <div className="absolute top-12 left-12">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="flex items-center"
                    >
                        <span className="text-[32px] font-extrabold text-black leading-none tracking-tight">AI-</span>
                        <span className="text-[32px] font-black text-[#1e3a8a] leading-none tracking-tight flex items-center">
                            T
                            <div className="relative mx-1 w-8 h-8 flex items-center justify-center">
                                <div className="absolute inset-0 rounded-full border-[2.5px] border-[#1e3a8a]"></div>
                                <div className="absolute w-4 h-[2.5px] bg-[#1e3a8a] left-0 top-1/2 -translate-y-1/2 -translate-x-[2px]"></div>
                                <div className="absolute w-[2.5px] h-4 bg-[#1e3a8a] left-1/2 -translate-x-1/2 top-0 -translate-y-[2px]"></div>
                                <div className="w-3 h-3 rounded-full border-[1.5px] border-[#1e3a8a] flex items-center justify-center">
                                    <div className="w-1 h-1 rounded-full bg-[#1e3a8a] shadow-[0_0_6px_#1e3a8a]"></div>
                                </div>
                            </div>
                            DAY
                        </span>
                    </motion.div>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8, duration: 0.6 }}
                        className="text-center text-xs font-semibold text-[#1e3a8a]/70 tracking-[0.2em] uppercase mt-1.5 w-full"
                    >
                        for students
                    </motion.p>
                </div>

                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                    className="w-full max-w-lg mt-auto mb-auto"
                >
                    <img src="/signup-illustration.png" alt="Signup Illustration" className="w-full h-auto object-contain" />
                </motion.div>
            </div>

            <div className="relative bg-[#3f2b96] flex flex-col justify-center p-8 md:p-16 overflow-hidden">
                <div className="absolute inset-0 pointer-events-none opacity-10">
                    {[...Array(24)].map((_, i) => (
                        <Sparkles key={i} className="absolute text-white" style={{ top: `${(i * 17) % 100}%`, left: `${(i * 31) % 100}%`, transform: `rotate(${(i * 45) % 360}deg)`, width: '32px', height: '32px' }} />
                    ))}
                </div>

                <div className="relative z-10 w-full max-w-md mx-auto">
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-8">
                        <Link to="/login" className="flex items-center gap-2 text-white/80 hover:text-white transition-colors text-sm font-medium">
                            <ArrowLeft className="w-4 h-4" />
                            Back to Login
                        </Link>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
                        <h1 className="text-white text-2xl font-semibold">Create your account</h1>
                    </motion.div>

                    {error && (
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center gap-3 text-white">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <span className="text-sm">{error}</span>
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-white text-sm font-medium ml-1">
                                <User className="w-4 h-4" /> Full Name
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <User className="w-5 h-5 text-[#3f2b96]/40 group-focus-within:text-[#3f2b96] transition-colors" />
                                </div>
                                <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="Enter your full name" className="w-full pl-12 pr-4 py-3.5 bg-white border-0 rounded-xl text-[#3f2b96] placeholder-[#3f2b96]/30 focus:ring-2 focus:ring-white/50 transition-all shadow-lg" required disabled={isLoading} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-white text-sm font-medium ml-1">
                                <Mail className="w-4 h-4" /> Email Address
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Mail className="w-5 h-5 text-[#3f2b96]/40 group-focus-within:text-[#3f2b96] transition-colors" />
                                </div>
                                <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="Enter your email" className="w-full pl-12 pr-4 py-3.5 bg-white border-0 rounded-xl text-[#3f2b96] placeholder-[#3f2b96]/30 focus:ring-2 focus:ring-white/50 transition-all shadow-lg" required disabled={isLoading} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-white text-sm font-medium ml-1">
                                <Briefcase className="w-4 h-4" /> College ID
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Briefcase className="w-5 h-5 text-[#3f2b96]/40 group-focus-within:text-[#3f2b96] transition-colors" />
                                </div>
                                <input type="text" name="collegeId" value={formData.collegeId} onChange={handleInputChange} placeholder="Enter your college ID" className="w-full pl-12 pr-4 py-3.5 bg-white border-0 rounded-xl text-[#3f2b96] placeholder-[#3f2b96]/30 focus:ring-2 focus:ring-white/50 transition-all shadow-lg" required disabled={isLoading} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-white text-sm font-medium ml-1">
                                <Briefcase className="w-4 h-4" /> Select Your Domain
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Briefcase className="w-5 h-5 text-[#3f2b96]/40 group-focus-within:text-[#3f2b96] transition-colors" />
                                </div>
                                <select name="domain" value={formData.domain} onChange={handleInputChange} className="w-full pl-12 pr-10 py-3.5 bg-white border-0 rounded-xl text-[#3f2b96] appearance-none focus:ring-2 focus:ring-white/50 transition-all shadow-lg cursor-pointer" required disabled={isLoading}>
                                    <option value="" disabled>Select your domain</option>
                                    <option value="B.Com">B.Com</option>
                                    <option value="BBA">BBA</option>
                                    <option value="Civil Engineer">Civil Engineer</option>
                                </select>
                                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                    <ChevronDown className="w-5 h-5 text-[#3f2b96]/40" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-white text-sm font-medium ml-1">
                                <Lock className="w-4 h-4" /> Password
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="w-5 h-5 text-[#3f2b96]/40 group-focus-within:text-[#3f2b96] transition-colors" />
                                </div>
                                <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleInputChange} placeholder="Create a password" className="w-full pl-12 pr-12 py-3.5 bg-white border-0 rounded-xl text-[#3f2b96] placeholder-[#3f2b96]/30 focus:ring-2 focus:ring-white/50 transition-all shadow-lg" required disabled={isLoading} />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#3f2b96]/40 hover:text-[#3f2b96] transition-colors outline-none" disabled={isLoading}>
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-white text-sm font-medium ml-1">
                                <Lock className="w-4 h-4" /> Confirm Password
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="w-5 h-5 text-[#3f2b96]/40 group-focus-within:text-[#3f2b96] transition-colors" />
                                </div>
                                <input type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} placeholder="Confirm your password" className="w-full pl-12 pr-12 py-3.5 bg-white border-0 rounded-xl text-[#3f2b96] placeholder-[#3f2b96]/30 focus:ring-2 focus:ring-white/50 transition-all shadow-lg" required disabled={isLoading} />
                                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#3f2b96]/40 hover:text-[#3f2b96] transition-colors outline-none" disabled={isLoading}>
                                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <motion.button whileHover={{ scale: 1.02, translateY: -2 }} whileTap={{ scale: 0.98 }} type="submit" disabled={isLoading || !formData.domain} className="w-full mt-4 bg-white text-[#3f2b96] font-bold py-4 rounded-xl shadow-xl hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed group">
                            {isLoading ? (
                                <div className="flex items-center justify-center gap-3">
                                    <div className="w-5 h-5 border-3 border-[#3f2b96]/20 border-t-[#3f2b96] rounded-full animate-spin"></div>
                                    <span>Creating Account...</span>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center gap-2">
                                    Create Account <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </div>
                            )}
                        </motion.button>
                    </form>

                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mt-10 space-y-5 text-center">
                        <p className="text-white/60 text-[12px] leading-relaxed max-w-[280px] mx-auto">
                            By signing up, you agree to our <span className="underline cursor-pointer hover:text-white transition-colors">Terms of Service</span> & <span className="underline cursor-pointer hover:text-white transition-colors">Privacy policy</span>.
                        </p>
                        <p className="text-white text-sm font-medium">
                            Already have an account? <Link to="/login" className="font-bold hover:underline ml-1">Sign in.</Link>
                        </p>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
