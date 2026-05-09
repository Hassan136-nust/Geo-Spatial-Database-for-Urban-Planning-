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
      <div 
        className="min-h-screen pt-32 flex items-center justify-center"
        style={{
          backgroundImage: 'url(https://www.economist.com/cdn-cgi/image/width=1920,quality=95,format=auto/content-assets/images/20241221_STP001.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <GlassPanel>
          <div className="p-8 text-center">
            <Shield className="w-16 h-16 mx-auto mb-4 text-red-400" />
            <h2 className="text-xl font-bold mb-2 text-white" style={{ textShadow: '1px 1px 4px rgba(0,0,0,0.8)' }}>Access Denied</h2>
            <p className="text-white/80 text-sm" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.8)' }}>Admin privileges required to access this page.</p>
          </div>
        </GlassPanel>
      </div>
    );
  }

  if (loading) {
    return (
      <div 
        className="min-h-screen pt-32 flex items-center justify-center"
        style={{
          backgroundImage: 'url(https://www.economist.com/cdn-cgi/image/width=1920,quality=95,format=auto/content-assets/images/20241221_STP001.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }} className="w-12 h-12 border-3 border-white border-t-transparent rounded-full" />
      </div>
    );
  }

  const counts = systemStats?.counts || overview?.counts || {};
  
  // Map actual MongoDB collection names to display values
  const displayCounts = {
    users: counts.users || counts.users || 0,
    landmarks: counts.landmarks || 0,
    roads: counts.roads || 0,
    saved_areas: counts.savedareas || counts.saved_areas || 0,
    analytics_results: counts.analyticsresults || counts.analytics_results || 0,
    planner_designs: counts.plannerdesigns || counts.planner_designs || 0,
    reports: counts.reports || 0,
    activity_logs: counts.activitylogs || counts.activity_logs || 0,
  };
  
  const totalDocs = Object.values(displayCounts).reduce((s, c) => s + (typeof c === 'number' ? c : 0), 0);

  const tabs = [
    { key: 'users', label: 'Users', icon: Users },
    { key: 'activity', label: 'Activity Log', icon: Activity },
    { key: 'data', label: 'Data Import', icon: Upload },
  ];

  return (
    <div 
      className="min-h-screen pt-28 pb-20 px-8"
      style={{
        backgroundImage: 'url(https://www.economist.com/cdn-cgi/image/width=1920,quality=95,format=auto/content-assets/images/20241221_STP001.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-5xl font-bold mb-3 text-white" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.9)' }}>Admin Panel</h1>
          <p className="text-lg text-white font-medium" style={{ textShadow: '1px 1px 6px rgba(0,0,0,0.8)' }}>System administration, user management, and activity monitoring</p>
        </motion.div>

        {/* DB Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-8">
          {[
            { label: 'Users', value: displayCounts.users, color: '#3b82f6' },
            { label: 'Landmarks', value: displayCounts.landmarks, color: '#22c55e' },
            { label: 'Roads', value: displayCounts.roads, color: '#f97316' },
            { label: 'Areas', value: displayCounts.saved_areas, color: '#06b6d4' },
            { label: 'Analytics', value: displayCounts.analytics_results, color: '#8b5cf6' },
            { label: 'Designs', value: displayCounts.planner_designs, color: '#ec4899' },
            { label: 'Reports', value: displayCounts.reports, color: '#eab308' },
            { label: 'Total', value: totalDocs, color: '#14b8a6' },
          ].map((s, i) => (
            <GlassPanel key={s.label} delay={0.03 * i}>
              <div className="p-3 text-center">
                <div className="text-xl font-bold text-white" style={{ color: s.color, textShadow: '1px 1px 4px rgba(0,0,0,0.8)' }}>{s.value.toLocaleString()}</div>
                <div className="text-[10px] text-white/80 mt-1 font-medium" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.8)' }}>{s.label}</div>
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
                    ? 'bg-cyan-600 border border-cyan-700 text-white'
                    : 'bg-white/10 border border-white/30 text-white hover:bg-white/20 backdrop-blur-md'
                }`}
                style={activeTab !== tab.key ? { textShadow: '1px 1px 3px rgba(0,0,0,0.8)' } : {}}
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
              <h3 className="text-xl font-bold mb-5 flex items-center gap-2 text-white" style={{ textShadow: '1px 1px 4px rgba(0,0,0,0.8)' }}><Users className="w-5 h-5 text-cyan-400" /> User Management ({users.length})</h3>
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                {users.map((u, i) => {
                  const roleColors = { admin: 'text-amber-400 bg-amber-600 border-amber-700', planner: 'text-white bg-blue-600 border-blue-700', viewer: 'text-white bg-green-600 border-green-700' };
                  return (
                    <motion.div key={u._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * i }}
                      className="flex items-center justify-between p-4 bg-white/10 backdrop-blur-md rounded-xl border border-white/30">
                      <div>
                        <div className="font-medium text-sm text-white" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.8)' }}>{u.name}</div>
                        <div className="text-xs text-white/80 mt-0.5" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.8)' }}>{u.email}</div>
                        {u.createdAt && <div className="text-[10px] text-white/60 mt-0.5" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>Joined {new Date(u.createdAt).toLocaleDateString()}</div>}
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
                <h3 className="text-xl font-bold flex items-center gap-2 text-white" style={{ textShadow: '1px 1px 4px rgba(0,0,0,0.8)' }}><Activity className="w-5 h-5 text-cyan-400" /> Activity Log</h3>
                <button onClick={() => loadActivities(activityPage)} className="px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-lg text-xs text-white hover:bg-white/20 flex items-center gap-1 border border-white/30" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.8)' }}>
                  <RefreshCw className={`w-3 h-3 ${activityLoading ? 'animate-spin' : ''}`} /> Refresh
                </button>
              </div>

              {activityLoading ? (
                <div className="text-center py-12">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full mx-auto" />
                </div>
              ) : activities.length === 0 ? (
                <div className="text-center py-12">
                  <Activity className="w-12 h-12 text-white/20 mx-auto mb-4" />
                  <p className="text-white text-sm font-medium" style={{ textShadow: '1px 1px 4px rgba(0,0,0,0.8)' }}>No activity recorded yet</p>
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
                        className="flex items-center gap-3 p-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/30"
                      >
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: actionMeta.color + '33' }}>
                          <ActionIcon className="w-4 h-4" style={{ color: actionMeta.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-white font-medium capitalize" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.8)' }}>{a.action?.replace(/_/g, ' ')}</p>
                          <p className="text-[10px] text-white/80" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                            {a.resource_type} {a.metadata?.query ? `• "${a.metadata.query}"` : ''} 
                            {a.metadata?.score != null ? ` • Score: ${a.metadata.score}` : ''}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-[10px] text-white/70" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>{new Date(a.createdAt || a.created_at).toLocaleDateString()}</p>
                          <p className="text-[10px] text-white/70" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>{new Date(a.createdAt || a.created_at).toLocaleTimeString()}</p>
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
                  className="px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-lg text-xs text-white disabled:opacity-30 border border-white/30"
                  style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.8)' }}
                >
                  Previous
                </button>
                <span className="px-3 py-1.5 text-xs text-white font-medium" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.8)' }}>Page {activityPage}</span>
                <button
                  onClick={() => loadActivities(activityPage + 1)}
                  disabled={activities.length < 20}
                  className="px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-lg text-xs text-white disabled:opacity-30 border border-white/30"
                  style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.8)' }}
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
              <h3 className="text-xl font-bold mb-5 flex items-center gap-2 text-white" style={{ textShadow: '1px 1px 4px rgba(0,0,0,0.8)' }}><Upload className="w-5 h-5 text-emerald-400" /> Bulk Data Import</h3>
              <div className="mb-4">
                <label className="text-xs text-white font-medium mb-1 block" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.8)' }}>Collection</label>
                <select value={importType} onChange={(e) => setImportType(e.target.value)}
                  className="w-full bg-white/10 backdrop-blur-md border border-white/30 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500/50">
                  <option value="zones" className="bg-gray-900">Zones</option>
                  <option value="roads" className="bg-gray-900">Roads</option>
                  <option value="landmarks" className="bg-gray-900">Landmarks</option>
                  <option value="utilities" className="bg-gray-900">Utilities</option>
                  <option value="population" className="bg-gray-900">Population Data</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="text-xs text-white font-medium mb-1 block" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.8)' }}>JSON Data</label>
                <textarea value={importData} onChange={(e) => setImportData(e.target.value)} placeholder='[{"name": "Zone Name", "zone_type": "residential", ...}]'
                  className="w-full bg-white/10 backdrop-blur-md border border-white/30 rounded-xl px-4 py-3 text-sm text-white placeholder-white/50 focus:outline-none focus:border-emerald-500/50 h-40 resize-none font-mono" />
              </div>
              {importMsg && (
                <div className={`mb-4 p-3 rounded-xl text-sm font-medium ${importMsg.includes('Error') ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>{importMsg}</div>
              )}
              <button onClick={handleImport} disabled={!importData.trim()}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 border border-emerald-700 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50 transition-colors">
                <Database className="w-4 h-4" /> Import Data
              </button>

              <div className="mt-4 p-3 bg-amber-600/20 border border-amber-500/40 rounded-xl flex items-start gap-2 backdrop-blur-md">
                <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-white font-medium" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.8)' }}>Paste valid JSON array or object. Each item will be created as a new document in the selected collection.</p>
              </div>
            </div>
          </GlassPanel>
        )}
      </div>
    </div>
  );
}
