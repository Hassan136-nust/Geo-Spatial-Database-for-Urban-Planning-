import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { GlassPanel } from '../components/GlassPanel';
import { Shield, Users, Trash2, Upload, Database, AlertTriangle, Activity, Clock, MapPin, PenTool, FileText, Search, RefreshCw, Eye } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import mapsApi from '../services/mapsApi';

export function Admin() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [importData, setImportData] = useState('');
  const [importType, setImportType] = useState('zones');
  const [importMsg, setImportMsg] = useState('');
  const [activeTab, setActiveTab] = useState('users');

  // Activity log state
  const [activities, setActivities] = useState([]);
  const [activityPage, setActivityPage] = useState(1);
  const [activityLoading, setActivityLoading] = useState(false);

  // Admin data views
  const [allAreas, setAllAreas] = useState([]);
  const [allDesigns, setAllDesigns] = useState([]);
  const [systemStats, setSystemStats] = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [usersRes, overviewRes] = await Promise.all([
        api.get('/auth/users'),
        api.get('/analytics/overview'),
      ]);
      setUsers(usersRes.data.data || []);
      setOverview(overviewRes.data.data || null);

      // Load system stats
      try {
        const statsRes = await fetch('/api/admin/stats').then((r) => r.json());
        setSystemStats(statsRes.data || null);
      } catch (e) { /* silent */ }

      // Load activity logs
      loadActivities(1);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const loadActivities = async (page = 1) => {
    setActivityLoading(true);
    try {
      const res = await mapsApi.getActivityFeed(page);
      setActivities(res.data || []);
      setActivityPage(page);
    } catch (err) { console.error('Activity load error:', err); }
    finally { setActivityLoading(false); }
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

  const counts = systemStats?.counts || overview?.counts || {};
  const totalDocs = Object.values(counts).reduce((s, c) => s + (typeof c === 'number' ? c : 0), 0);

  const tabs = [
    { key: 'users', label: 'Users', icon: Users },
    { key: 'activity', label: 'Activity Log', icon: Activity },
    { key: 'data', label: 'Data Import', icon: Upload },
  ];

  return (
    <div className="min-h-screen pt-28 pb-20 px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-white via-amber-100 to-orange-200 bg-clip-text text-transparent">Admin Panel</h1>
          <p className="text-lg text-white/50">System administration, user management, and activity monitoring</p>
        </motion.div>

        {/* DB Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-8">
          {[
            { label: 'Users', value: counts.users || 0, color: '#3b82f6' },
            { label: 'Landmarks', value: counts.landmarks || 0, color: '#22c55e' },
            { label: 'Roads', value: counts.roads || 0, color: '#f97316' },
            { label: 'Areas', value: counts.saved_areas || 0, color: '#06b6d4' },
            { label: 'Analytics', value: counts.analytics_results || 0, color: '#8b5cf6' },
            { label: 'Designs', value: counts.planner_designs || 0, color: '#ec4899' },
            { label: 'Reports', value: counts.reports || 0, color: '#eab308' },
            { label: 'Total', value: totalDocs, color: '#14b8a6' },
          ].map((s, i) => (
            <GlassPanel key={s.label} delay={0.03 * i}>
              <div className="p-3 text-center">
                <div className="text-xl font-bold" style={{ color: s.color }}>{s.value.toLocaleString()}</div>
                <div className="text-[10px] text-white/40 mt-1">{s.label}</div>
              </div>
            </GlassPanel>
          ))}
        </div>

        {/* Tab Buttons */}
        <div className="flex gap-2 mb-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-all ${
                  activeTab === tab.key
                    ? 'bg-cyan-500/20 border border-cyan-500/30 text-cyan-400'
                    : 'bg-white/5 border border-white/10 text-white/50 hover:bg-white/10'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* User Management Tab */}
        {activeTab === 'users' && (
          <GlassPanel delay={0.1}>
            <div className="p-6">
              <h3 className="text-xl font-bold mb-5 flex items-center gap-2"><Users className="w-5 h-5 text-cyan-400" /> User Management ({users.length})</h3>
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                {users.map((u, i) => {
                  const roleColors = { admin: 'text-amber-400 bg-amber-400/10 border-amber-400/20', planner: 'text-blue-400 bg-blue-400/10 border-blue-400/20', viewer: 'text-green-400 bg-green-400/10 border-green-400/20' };
                  return (
                    <motion.div key={u._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * i }}
                      className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                      <div>
                        <div className="font-medium text-sm">{u.name}</div>
                        <div className="text-xs text-white/40 mt-0.5">{u.email}</div>
                        {u.createdAt && <div className="text-[10px] text-white/25 mt-0.5">Joined {new Date(u.createdAt).toLocaleDateString()}</div>}
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
        )}

        {/* Activity Log Tab */}
        {activeTab === 'activity' && (
          <GlassPanel delay={0.1}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xl font-bold flex items-center gap-2"><Activity className="w-5 h-5 text-cyan-400" /> Activity Log</h3>
                <button onClick={() => loadActivities(activityPage)} className="px-3 py-1.5 bg-white/10 rounded-lg text-xs text-white/60 hover:bg-white/15 flex items-center gap-1">
                  <RefreshCw className={`w-3 h-3 ${activityLoading ? 'animate-spin' : ''}`} /> Refresh
                </button>
              </div>

              {activityLoading ? (
                <div className="text-center py-12">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full mx-auto" />
                </div>
              ) : activities.length === 0 ? (
                <div className="text-center py-12">
                  <Activity className="w-12 h-12 text-white/10 mx-auto mb-4" />
                  <p className="text-white/40 text-sm">No activity recorded yet</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                  {activities.map((a, i) => {
                    const actionIcons = {
                      search_area: { icon: Search, color: '#06b6d4' },
                      save_design: { icon: PenTool, color: '#ec4899' },
                      update_design: { icon: PenTool, color: '#8b5cf6' },
                      delete_design: { icon: Trash2, color: '#ef4444' },
                      delete_area: { icon: Trash2, color: '#ef4444' },
                      add_landmark: { icon: MapPin, color: '#22c55e' },
                      generate_report: { icon: FileText, color: '#eab308' },
                    };
                    const actionMeta = actionIcons[a.action] || { icon: Activity, color: '#6b7280' };
                    const ActionIcon = actionMeta.icon;

                    return (
                      <motion.div
                        key={a._id || i}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(i * 0.03, 0.5) }}
                        className="flex items-center gap-3 p-3 bg-white/5 rounded-xl"
                      >
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: actionMeta.color + '15' }}>
                          <ActionIcon className="w-4 h-4" style={{ color: actionMeta.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-white/80 font-medium capitalize">{a.action?.replace(/_/g, ' ')}</p>
                          <p className="text-[10px] text-white/40">
                            {a.resource_type} {a.metadata?.query ? `• "${a.metadata.query}"` : ''} 
                            {a.metadata?.score != null ? ` • Score: ${a.metadata.score}` : ''}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-[10px] text-white/30">{new Date(a.createdAt || a.created_at).toLocaleDateString()}</p>
                          <p className="text-[10px] text-white/20">{new Date(a.createdAt || a.created_at).toLocaleTimeString()}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* Pagination */}
              <div className="flex justify-center gap-2 mt-4">
                <button
                  onClick={() => loadActivities(Math.max(1, activityPage - 1))}
                  disabled={activityPage <= 1}
                  className="px-3 py-1.5 bg-white/5 rounded-lg text-xs text-white/50 disabled:opacity-30"
                >
                  Previous
                </button>
                <span className="px-3 py-1.5 text-xs text-white/30">Page {activityPage}</span>
                <button
                  onClick={() => loadActivities(activityPage + 1)}
                  disabled={activities.length < 20}
                  className="px-3 py-1.5 bg-white/5 rounded-lg text-xs text-white/50 disabled:opacity-30"
                >
                  Next
                </button>
              </div>
            </div>
          </GlassPanel>
        )}

        {/* Data Import Tab */}
        {activeTab === 'data' && (
          <GlassPanel delay={0.1}>
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
        )}
      </div>
    </div>
  );
}
