import { useState } from 'react';
import { motion } from 'motion/react';
import { GlassPanel } from '../components/GlassPanel';
import { UserCircle, Mail, Shield, Clock, Save, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export function Profile() {
  const { user, updateProfile, logout } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordMsg, setPasswordMsg] = useState('');

  if (!user) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center">
        <GlassPanel>
          <div className="p-8 text-center">
            <UserCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-bold mb-2">Not Logged In</h2>
            <p className="text-gray-900/50 text-sm">Please sign in to view your profile.</p>
          </div>
        </GlassPanel>
      </div>
    );
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const result = await updateProfile({ name, email });
      setMessage(result.success ? 'Profile updated!' : 'Failed to update');
    } catch (err) { setMessage('Error updating profile'); }
    finally { setSaving(false); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMsg('');
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMsg('Passwords do not match');
      return;
    }
    try {
      await api.put('/auth/password', { currentPassword: passwordData.currentPassword, newPassword: passwordData.newPassword });
      setPasswordMsg('Password changed successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) { setPasswordMsg(err.message || 'Failed to change password'); }
  };

  const roleColors = { admin: 'text-amber-400 bg-amber-400/10', planner: 'text-blue-400 bg-blue-400/10', viewer: 'text-green-400 bg-green-400/10' };

  return (
    <div className="min-h-screen pt-28 pb-20 px-8">
      <div className="max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-white via-green-100 to-emerald-200 bg-clip-text text-transparent">Profile</h1>
          <p className="text-lg text-gray-900/50">Manage your account settings</p>
        </motion.div>

        {/* User Info */}
        <GlassPanel delay={0.1}>
          <div className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/20 flex items-center justify-center">
                <UserCircle className="w-8 h-8 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{user.name}</h2>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-sm text-gray-900/50">{user.email}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${roleColors[user.role] || roleColors.viewer}`}>{user.role}</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Name</label>
                <div className="relative"><UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-white/5 border border-gray-200 rounded-xl px-10 py-3 text-sm focus:outline-none focus:border-cyan-500/50" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Email</label>
                <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-white/5 border border-gray-200 rounded-xl px-10 py-3 text-sm focus:outline-none focus:border-cyan-500/50" />
                </div>
              </div>
              {message && <p className={`text-sm ${message.includes('updated') ? 'text-green-400' : 'text-red-400'}`}>{message}</p>}
              <button type="submit" disabled={saving} className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl text-sm font-semibold flex items-center gap-2 disabled:opacity-50">
                <Save className="w-4 h-4" />{saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </GlassPanel>

        {/* Change Password */}
        <div className="mt-6">
          <GlassPanel delay={0.2}>
            <div className="p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Lock className="w-5 h-5 text-amber-400" /> Change Password</h3>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <input type="password" placeholder="Current Password" value={passwordData.currentPassword} onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })} className="w-full bg-white/5 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500/50" required />
                <div className="grid grid-cols-2 gap-3">
                  <input type="password" placeholder="New Password" value={passwordData.newPassword} onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })} className="bg-white/5 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500/50" required />
                  <input type="password" placeholder="Confirm Password" value={passwordData.confirmPassword} onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} className="bg-white/5 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500/50" required />
                </div>
                {passwordMsg && <p className={`text-sm ${passwordMsg.includes('success') ? 'text-green-400' : 'text-red-400'}`}>{passwordMsg}</p>}
                <button type="submit" className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl text-sm font-semibold flex items-center gap-2">
                  <Lock className="w-4 h-4" /> Change Password
                </button>
              </form>
            </div>
          </GlassPanel>
        </div>

        {/* Logout */}
        <div className="mt-6">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={logout}
            className="w-full py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 font-semibold text-sm hover:bg-red-500/20 transition-colors">
            Sign Out
          </motion.button>
        </div>
      </div>
    </div>
  );
}
