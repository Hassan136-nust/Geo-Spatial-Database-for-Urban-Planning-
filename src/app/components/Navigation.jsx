import { Link, useLocation } from 'react-router';
import { motion } from 'motion/react';
import { Globe2, BarChart3, Map, LogIn, LayoutDashboard, Building2, UserCircle, Shield, PenTool } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const publicNavItems = [
  { path: '/', label: 'Home', icon: Globe2 },
  { path: '/dashboard', label: 'Map', icon: LayoutDashboard },
  { path: '/planner', label: 'Planner', icon: PenTool },
  { path: '/zones', label: 'Zones', icon: Map },
  { path: '/infrastructure', label: 'Infra', icon: Building2 },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
];

export function Navigation() {
  const location = useLocation();
  const { user, logout } = useAuth();

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="fixed top-6 left-1/2 -translate-x-1/2 z-50"
    >
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-full px-4 py-2.5 shadow-2xl">
        <div className="flex items-center gap-1">
          {/* Logo */}
          <Link to="/">
            <div className="flex items-center gap-2 px-3 py-1.5 mr-2">
              <Globe2 className="w-5 h-5 text-cyan-400" />
              <span className="text-sm font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent hidden sm:inline">
                UrbanPulse
              </span>
            </div>
          </Link>

          {/* Nav Items */}
          {publicNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link key={item.path} to={item.path}>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative px-3 py-1.5 rounded-full transition-colors"
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute inset-0 bg-white/20 rounded-full"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <div className="relative flex items-center gap-1.5">
                    <Icon className="w-4 h-4" />
                    <span className="text-xs font-medium hidden md:inline">{item.label}</span>
                  </div>
                </motion.div>
              </Link>
            );
          })}

          {/* Divider */}
          <div className="w-px h-6 bg-white/10 mx-1" />

          {/* Auth */}
          {user ? (
            <div className="flex items-center gap-1">
              {user.role === 'admin' && (
                <Link to="/admin">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="relative px-3 py-1.5 rounded-full transition-colors">
                    {location.pathname === '/admin' && (
                      <motion.div layoutId="activeNav" className="absolute inset-0 bg-white/20 rounded-full" transition={{ type: 'spring', stiffness: 380, damping: 30 }} />
                    )}
                    <div className="relative flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-medium hidden md:inline">Admin</span>
                    </div>
                  </motion.div>
                </Link>
              )}
              <Link to="/profile">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="relative px-3 py-1.5 rounded-full transition-colors">
                  {location.pathname === '/profile' && (
                    <motion.div layoutId="activeNav" className="absolute inset-0 bg-white/20 rounded-full" transition={{ type: 'spring', stiffness: 380, damping: 30 }} />
                  )}
                  <div className="relative flex items-center gap-1.5">
                    <UserCircle className="w-4 h-4 text-green-400" />
                    <span className="text-xs font-medium hidden md:inline">{user.name.split(' ')[0]}</span>
                  </div>
                </motion.div>
              </Link>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={logout}
                className="px-3 py-1.5 rounded-full text-xs font-medium text-red-400 hover:bg-red-400/10 transition-colors"
              >
                Logout
              </motion.button>
            </div>
          ) : (
            <Link to="/login">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="relative px-3 py-1.5 rounded-full transition-colors">
                {location.pathname === '/login' && (
                  <motion.div layoutId="activeNav" className="absolute inset-0 bg-white/20 rounded-full" transition={{ type: 'spring', stiffness: 380, damping: 30 }} />
                )}
                <div className="relative flex items-center gap-1.5">
                  <LogIn className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-medium">Login</span>
                </div>
              </motion.div>
            </Link>
          )}
        </div>
      </div>
    </motion.nav>
  );
}
