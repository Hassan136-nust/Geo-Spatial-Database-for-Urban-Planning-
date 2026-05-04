import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { GlassPanel } from '../components/GlassPanel';
import { useAuth } from '../context/AuthContext';
import { LogIn, UserPlus, Mail, Lock, User, Globe2 } from 'lucide-react';
import api from '../services/api';

export function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'viewer' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let result;
      if (isLogin) {
        result = await login(formData.email, formData.password);
      } else {
        result = await register(formData.name, formData.email, formData.password, formData.role);
      }

      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.message || 'Authentication failed');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async (response) => {
    setError('');
    setLoading(true);
    
    try {
      const res = await api.post('/auth/google', { credential: response.credential });
      
      if (res.data.success) {
        localStorage.setItem('urbanpulse_token', res.data.token);
        window.location.href = '/dashboard';
      } else {
        setError(res.data.message || 'Google login failed');
      }
    } catch (err) {
      setError('Google login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load Google Sign-In script
  useState(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '1234567890-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com',
          callback: handleGoogleLogin,
        });
        
        window.google.accounts.id.renderButton(
          document.getElementById('googleSignInButton'),
          { 
            theme: 'filled_black', 
            size: 'large',
            width: '100%',
            text: 'continue_with',
          }
        );
      }
    };

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div 
      className="min-h-screen pt-28 pb-20 px-8 flex items-center justify-center relative"
      style={{
        backgroundImage: 'url(https://www.economist.com/cdn-cgi/image/width=1920,quality=95,format=auto/content-assets/images/20241221_STP001.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative z-10"
      >
        <GlassPanel>
          <div className="p-8 bg-primary/95 backdrop-blur-sm rounded-2xl border border-white/30 shadow-2xl">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-white/20 to-white/10 border border-white/30 flex items-center justify-center">
                <Globe2 className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white" style={{ color: '#FFFFFF', textShadow: '2px 2px 8px rgba(0,0,0,0.9)' }}>
                {isLogin ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p className="text-sm text-white mt-2 font-medium" style={{ color: '#FFFFFF', textShadow: '1px 1px 6px rgba(0,0,0,0.8)' }}>
                {isLogin ? 'Sign in to UrbanPulse Intelligence' : 'Join the UrbanPulse platform'}
              </p>
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-red-500/20 border border-red-400/40 rounded-xl text-white text-sm text-center font-semibold"
              >
                {error}
              </motion.div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div>
                  <label className="text-xs font-semibold mb-1.5 block" style={{ color: '#FFFFFF' }}>Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#FFFFFF' }} />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-white/10 border border-white/30 rounded-xl px-10 py-3 text-sm focus:outline-none focus:border-white/60 transition-colors"
                      style={{ color: '#FFFFFF' }}
                      placeholder="Enter your name"
                      required={!isLogin}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: '#FFFFFF' }}>Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#FFFFFF' }} />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-white/10 border border-white/30 rounded-xl px-10 py-3 text-sm focus:outline-none focus:border-white/60 transition-colors"
                    style={{ color: '#FFFFFF' }}
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: '#FFFFFF' }}>Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#FFFFFF' }} />
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-white/10 border border-white/30 rounded-xl px-10 py-3 text-sm focus:outline-none focus:border-white/60 transition-colors"
                    style={{ color: '#FFFFFF' }}
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              {!isLogin && (
                <div>
                  <label className="text-xs font-semibold mb-1.5 block" style={{ color: '#FFFFFF' }}>Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full bg-white/10 border border-white/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/60 transition-colors"
                    style={{ color: '#FFFFFF' }}
                  >
                    <option value="viewer" className="bg-primary" style={{ color: '#FFFFFF' }}>Viewer</option>
                    <option value="planner" className="bg-primary" style={{ color: '#FFFFFF' }}>Planner</option>
                    <option value="admin" className="bg-primary" style={{ color: '#FFFFFF' }}>Admin</option>
                  </select>
                </div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-white/20 hover:bg-white/30 border border-white/40 rounded-xl text-white font-bold flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <>
                    {isLogin ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                    {isLogin ? 'Sign In' : 'Create Account'}
                  </>
                )}
              </motion.button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/30"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-primary px-2 font-medium" style={{ color: '#FFFFFF' }}>Or continue with</span>
              </div>
            </div>

            {/* Google Sign-In Button */}
            <div id="googleSignInButton" className="w-full flex justify-center"></div>

            {/* Toggle */}
            <div className="mt-6 text-center">
              <button
                onClick={() => { setIsLogin(!isLogin); setError(''); }}
                className="text-sm hover:opacity-80 transition-colors font-semibold"
                style={{ color: '#FFFFFF' }}
              >
                {isLogin ? "Don't have an account? Register" : 'Already have an account? Sign In'}
              </button>
            </div>

            {/* Demo credentials */}
            
          </div>
        </GlassPanel>
      </motion.div>
    </div>
  );
}
