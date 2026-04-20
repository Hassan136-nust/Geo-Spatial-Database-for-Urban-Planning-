import { Link, useLocation } from 'react-router';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Globe2, BarChart3, Map, LogIn, LayoutDashboard, Building2, UserCircle, Shield, PenTool, Bell, Bookmark, FolderOpen, GitCompare, FileText, MapPin, AlertTriangle, ChevronDown, Activity, Server } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import mapsApi from '../services/mapsApi';

const primaryNavItems = [
  { path: '/', label: 'Home', icon: Globe2 },
  { path: '/dashboard', label: 'Map', icon: LayoutDashboard },
  { path: '/planner', label: 'Planner', icon: PenTool },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
];

const moreNavItems = [
  { path: '/saved-areas', label: 'Saved Areas', icon: MapPin },
  { path: '/my-designs', label: 'My Designs', icon: PenTool },
  { path: '/saved-reports', label: 'Reports', icon: FileText },
  { path: '/landmarks', label: 'Landmarks', icon: MapPin },
  { path: '/projects', label: 'Projects', icon: FolderOpen },
  { path: '/compare', label: 'Compare', icon: GitCompare },
  { path: '/system-status', label: 'System Status', icon: Activity },
  { path: '/zones', label: 'Zones', icon: Map },
  { path: '/infrastructure', label: 'Infra', icon: Building2 },
];

export function Navigation() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [showMore, setShowMore] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotif, setShowNotif] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const moreRef = useRef(null);

  useEffect(() => {
    if (user) fetchUnreadCount();
    const interval = user ? setInterval(fetchUnreadCount, 30000) : null;
    return () => interval && clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const handleClick = (e) => {
      if (moreRef.current && !moreRef.current.contains(e.target)) setShowMore(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const res = await mapsApi.getUnreadCount();
      setUnreadCount(res.count || 0);
    } catch (err) { /* silent */ }
  };

  const toggleNotifications = async () => {
    setShowNotif(!showNotif);
    if (!showNotif) {
      try {
        const res = await mapsApi.getNotifications();
        setNotifications(res.data || []);
      } catch (err) { console.error(err); }
    }
  };

  const markAllRead = async () => {
    try {
      await mapsApi.markAllNotificationsRead();
      setUnreadCount(0);
      setNotifications(notifications.map((n) => ({ ...n, is_read: true })));
    } catch (err) { console.error(err); }
  };

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="fixed top-6 left-1/2 -translate-x-1/2 z-50"
    >
      <div className="backdrop-blur-xl bg-sidebar/80 border border-border rounded-full px-4 py-2.5 shadow-2xl">
        <div className="flex items-center gap-1">
          {/* Logo */}
          <Link to="/">
            <div className="flex items-center gap-2 px-3 py-1.5 mr-2">
              <Globe2 className="w-5 h-5 text-primary" />
              <span className="text-sm font-bold text-foreground hidden sm:inline">
                UrbanPulse
              </span>
            </div>
          </Link>

          {/* Primary Nav Items */}
          {primaryNavItems.map((item) => {
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

          {/* More Dropdown */}
          {user && (
            <div className="relative" ref={moreRef}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowMore(!showMore)}
                className="relative px-3 py-1.5 rounded-full transition-colors hover:bg-white/10"
              >
                <div className="flex items-center gap-1">
                  <span className="text-xs font-medium">More</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${showMore ? 'rotate-180' : ''}`} />
                </div>
              </motion.button>

              <AnimatePresence>
                {showMore && (
                  <motion.div
                    initial={{ opacity: 0, y: -5, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -5, scale: 0.95 }}
                    className="absolute top-full mt-2 right-0 bg-sidebar/95 backdrop-blur-xl border border-border rounded-2xl py-2 w-48 shadow-2xl"
                  >
                    {moreNavItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.path;
                      return (
                        <Link key={item.path} to={item.path} onClick={() => setShowMore(false)}>
                          <div className={`flex items-center gap-2.5 px-4 py-2 text-xs transition-colors ${isActive ? 'bg-white/10 text-cyan-400' : 'text-white/60 hover:bg-white/5 hover:text-white/90'}`}>
                            <Icon className="w-3.5 h-3.5" />
                            {item.label}
                          </div>
                        </Link>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Divider */}
          <div className="w-px h-6 bg-white/10 mx-1" />

          {/* Notification Bell */}
          {user && (
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleNotifications}
                className="relative px-2 py-1.5 rounded-full transition-colors hover:bg-white/10"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold flex items-center justify-center">{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
              </motion.button>

              <AnimatePresence>
                {showNotif && (
                  <motion.div
                    initial={{ opacity: 0, y: -5, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -5, scale: 0.95 }}
                    className="absolute top-full mt-2 right-0 bg-sidebar/95 backdrop-blur-xl border border-border rounded-2xl w-72 shadow-2xl overflow-hidden"
                  >
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                      <span className="text-xs font-bold text-white/60">Notifications</span>
                      {unreadCount > 0 && (
                        <button onClick={markAllRead} className="text-[10px] text-cyan-400 hover:text-cyan-300">Mark all read</button>
                      )}
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="text-xs text-white/30 text-center py-6">No notifications</p>
                      ) : (
                        notifications.slice(0, 8).map((n) => (
                          <div key={n._id} className={`px-4 py-2.5 border-b border-white/5 ${n.is_read ? '' : 'bg-cyan-500/5'}`}>
                            <p className="text-xs font-medium text-white/80">{n.title}</p>
                            <p className="text-[10px] text-white/40 mt-0.5 line-clamp-1">{n.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

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

