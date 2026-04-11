import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { GlassPanel } from '../components/GlassPanel';
import { Shield, Users, Trash2, ChevronDown, Upload, Database, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export function Admin() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [importData, setImportData] = useState('');
  const [importType, setImportType] = useState('zones');
  const [importMsg, setImportMsg] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [usersRes, overviewRes] = await Promise.all([api.get('/auth/users'), api.get('/analytics/overview')]);
      setUsers(usersRes.data.data);
      setOverview(overviewRes.data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.put(`/auth/users/${userId}/role`, { role: newRole });
      setUsers(users.map((u) => u._id === userId ? { ...u, role: newRole } : u));
    } catch (err) { alert(err.message); }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Delete this user permanently?')) return;
    try {
      await api.delete(`/auth/users/${userId}`);
      setUsers(users.filter((u) => u._id !== userId));
    } catch (err) { alert(err.message); }
  };

  const handleImport = async () => {
    setImportMsg('');
    try {
      const parsed = JSON.parse(importData);
      const items = Array.isArray(parsed) ? parsed : [parsed];
      let count = 0;
      for (const item of items) {
        await api.post(`/${importType}`, item);
        count++;
      }
      setImportMsg(`Successfully imported ${count} ${importType}`);
      setImportData('');
    } catch (err) {
      setImportMsg(`Error: ${err.message}`);
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center">
        <GlassPanel>
          <div className="p-8 text-center">
            <Shield className="w-16 h-16 mx-auto mb-4 text-red-400/30" />
            <h2 className="text-xl font-bold mb-2">Access Denied</h2>
            <p className="text-white/50 text-sm">Admin privileges required to access this page.</p>
          </div>
        </GlassPanel>
      </div>
    );
  }

  if (loading) {
    return <div className="min-h-screen pt-32 flex items-center justify-center"><motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }} className="w-12 h-12 border-3 border-cyan-400 border-t-transparent rounded-full" /></div>;
  }

  const counts = overview?.counts || {};

  return (
    <div className="min-h-screen pt-28 pb-20 px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-white via-amber-100 to-orange-200 bg-clip-text text-transparent">Admin Panel</h1>
          <p className="text-lg text-white/50">System administration and data management</p>
        </motion.div>

        {/* DB Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {[
            { label: 'Users', value: counts.users || 0 },
            { label: 'Zones', value: counts.zones || 0 },
            { label: 'Roads', value: counts.roads || 0 },
            { label: 'Landmarks', value: counts.landmarks || 0 },
            { label: 'Utilities', value: counts.utilities || 0 },
            { label: 'Population', value: (counts.totalPopulation || 0).toLocaleString() },
          ].map((s, i) => (
            <GlassPanel key={s.label} delay={0.03 * i}>
              <div className="p-4 text-center">
                <div className="text-2xl font-bold">{s.value}</div>
                <div className="text-xs text-white/40 mt-1">{s.label}</div>
              </div>
            </GlassPanel>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Management */}
          <GlassPanel delay={0.2}>
            <div className="p-6">
              <h3 className="text-xl font-bold mb-5 flex items-center gap-2"><Users className="w-5 h-5 text-cyan-400" /> User Management</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {users.map((u, i) => {
                  const roleColors = { admin: 'text-amber-400 bg-amber-400/10 border-amber-400/20', planner: 'text-blue-400 bg-blue-400/10 border-blue-400/20', viewer: 'text-green-400 bg-green-400/10 border-green-400/20' };
                  return (
                    <motion.div key={u._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.05 }}
                      className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                      <div>
                        <div className="font-medium text-sm">{u.name}</div>
                        <div className="text-xs text-white/40">{u.email}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <select value={u.role} onChange={(e) => handleRoleChange(u._id, e.target.value)}
                          className={`px-2 py-1 rounded-lg text-xs font-medium border ${roleColors[u.role] || roleColors.viewer} bg-transparent cursor-pointer focus:outline-none`}>
                          <option value="viewer" className="bg-gray-900">Viewer</option>
                          <option value="planner" className="bg-gray-900">Planner</option>
                          <option value="admin" className="bg-gray-900">Admin</option>
                        </select>
                        {u._id !== user.id && (
                          <button onClick={() => handleDeleteUser(u._id)} className="p-1.5 hover:bg-red-500/10 rounded-lg transition-colors">
                            <Trash2 className="w-3.5 h-3.5 text-red-400/50" />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </GlassPanel>

          {/* Data Import */}
          <GlassPanel delay={0.3}>
            <div className="p-6">
              <h3 className="text-xl font-bold mb-5 flex items-center gap-2"><Upload className="w-5 h-5 text-emerald-400" /> Bulk Data Import</h3>
              <div className="mb-4">
                <label className="text-xs text-white/60 mb-1 block">Collection</label>
                <select value={importType} onChange={(e) => setImportType(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500/50">
                  <option value="zones" className="bg-gray-900">Zones</option>
                  <option value="roads" className="bg-gray-900">Roads</option>
                  <option value="landmarks" className="bg-gray-900">Landmarks</option>
                  <option value="utilities" className="bg-gray-900">Utilities</option>
                  <option value="population" className="bg-gray-900">Population Data</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="text-xs text-white/60 mb-1 block">JSON Data</label>
                <textarea value={importData} onChange={(e) => setImportData(e.target.value)} placeholder='[{"name": "Zone Name", "zone_type": "residential", ...}]'
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500/50 h-40 resize-none font-mono" />
              </div>
              {importMsg && (
                <div className={`mb-4 p-3 rounded-xl text-sm ${importMsg.includes('Error') ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>{importMsg}</div>
              )}
              <button onClick={handleImport} disabled={!importData.trim()}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
                <Database className="w-4 h-4" /> Import Data
              </button>

              <div className="mt-4 p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-400/80">Paste valid JSON array or object. Each item will be created as a new document in the selected collection.</p>
              </div>
            </div>
          </GlassPanel>
        </div>
      </div>
    </div>
  );
}
