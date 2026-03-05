import { Home, BookOpen, Brain, Newspaper, MessageCircle, User, LayoutDashboard, Users, ArrowLeft, ArrowRight, Zap, Code, Target, Sparkles, FileText, Layers } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useUser } from '../contexts/UserContext';

interface SidebarProps {
  isAdmin?: boolean;
}

const studentMenuItems = [
  { icon: Home, label: 'Home Dashboard', path: '/' },
  { icon: FileText, label: 'Prompt Engineering Guide', path: '/prompt-engineering-guide' },
  { icon: Zap, label: 'Prompt Engineering', path: '/prompt-engineering' },
  { icon: Code, label: 'Vibe Coding', path: '/vibe-coding' },
  { icon: BookOpen, label: 'Courses Hub', path: '/courses' },
  { icon: Brain, label: 'AI Learning Tools', path: '/ai-tools' },
  { icon: Newspaper, label: 'AI Digest Feed', path: '/digest' },
  { icon: MessageCircle, label: 'Ask AI Mentor', path: '/mentor' },
  { icon: Brain, label: 'Emotional Wellness Corner', path: '/wellness' },
  { icon: Sparkles, label: 'AI Artist Corner', path: '/ai-artist-corner' },
  { icon: User, label: 'Profile & Progress', path: '/profile' },
];

const adminMenuItems = [
  { icon: LayoutDashboard, label: 'Dashboard Overview', path: '/admin' },
  { icon: BookOpen, label: 'Manage Courses', path: '/admin/courses' },
  { icon: Layers, label: 'Manage Streams', path: '/admin/streams' },
  { icon: Target, label: 'Simulator Tasks', path: '/admin/simulator-tasks' },
  { icon: Code, label: 'Manage Vibe Coding', path: '/admin/vibe-coding' },
  { icon: Newspaper, label: 'Post AI News', path: '/admin/news' },
  { icon: Brain, label: 'Manage AI Tools', path: '/admin/ai-tools' },
  { icon: Brain, label: 'Manage Wellness Corner', path: '/admin/wellness' },
  { icon: Sparkles, label: 'Manage Artist Corner', path: '/admin/ai-artist-corner' },
  { icon: Users, label: 'View Student Progress', path: '/admin/students' },
];

export default function Sidebar({ isAdmin = false }: SidebarProps) {
  const location = useLocation();
  const { user, isAdmin: userIsAdmin, collegeName } = useUser();
  const menuItems = isAdmin ? adminMenuItems : studentMenuItems;

  return (
    <motion.div
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`fixed left-0 top-0 h-screen w-72 border-r shadow-xl flex flex-col ${isAdmin
        ? 'bg-cream-bg'
        : 'bg-cream-bg border-light-accent'
        }`}
      style={isAdmin ? {
        borderRight: '1px solid rgba(0,0,0,0.1)'
      } : {}}
    >
      {/* Top branding section */}
      <div className="px-6 py-10 pb-6 flex-none">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex items-center justify-center"
        >
          <span className="text-[38px] font-extrabold text-black leading-none tracking-tight">AI-</span>
          <span className="text-[38px] font-black text-[#1e3a8a] leading-none tracking-tight flex items-center">
            T
            <div className="relative mx-1 w-8 h-8 flex items-center justify-center">
              {/* Circuit-style O */}
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
        {collegeName && user?.email !== 'aiedustudents@gmail.com' && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-[14px] font-bold text-[#1e3a8a] text-center mt-2 px-2 leading-tight uppercase tracking-wider"
          >
            {collegeName}
          </motion.p>
        )}
      </div>

      <div className="px-6 pb-0 flex-none">
        {isAdmin ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4"
          >
            <Link
              to="/"
              className="flex items-center justify-center gap-2 w-full py-3 bg-white border border-light-accent text-text-primary rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="font-medium">Student View</span>
            </Link>
          </motion.div>
        ) : (
          userIsAdmin && user?.email === 'aiedustudents@gmail.com' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4"
            >
              <Link
                to="/admin"
                className="flex items-center justify-center gap-2 w-full py-3 bg-admin-accent text-white rounded-xl hover:bg-admin-accent/90 transition-all shadow-md"
              >
                <ArrowRight className="w-4 h-4" />
                <span className="font-medium">Admin Panel</span>
              </Link>
            </motion.div>
          )
        )}
      </div>

      {/* Menu Items */}
      <nav className="flex-1 px-4 overflow-y-auto mt-4 custom-scrollbar">
        <ul className="space-y-1.5 pb-8">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            const isGuide = item.label.startsWith('Guide -');

            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all group relative ${isActive
                    ? 'bg-admin-accent text-white shadow-lg shadow-admin-accent/20'
                    : 'text-text-secondary hover:bg-white hover:text-admin-accent hover:shadow-md'
                    }`}
                >
                  <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-admin-accent'}`} />
                  <span className={`font-medium text-sm ${isGuide ? 'text-xs italic' : ''}`}>{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute left-0 w-1 h-6 bg-white rounded-r-full"
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>


    </motion.div>
  );
}
