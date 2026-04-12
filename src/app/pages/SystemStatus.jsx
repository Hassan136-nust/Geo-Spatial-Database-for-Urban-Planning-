import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { GlassPanel } from '../components/GlassPanel';
import { Database, Activity, Server, HardDrive, RefreshCw, CheckCircle, AlertTriangle, Clock, Users, MapPin, FileText, Compass, PenTool, Bell, Bookmark, FolderOpen, Layers, GitCompare, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import mapsApi from '../services/mapsApi';

const COLLECTION_META = {
  users:                    { icon: Users, color: '#3b82f6', label: 'Users' },
  landmarks:                { icon: MapPin, color: '#22c55e', label: 'Landmarks' },
  roads:                    { icon: Compass, color: '#f97316', label: 'Roads' },
  saved_areas:              { icon: MapPin, color: '#06b6d4', label: 'Saved Areas' },
  analytics_results:        { icon: Activity, color: '#8b5cf6', label: 'Analytics' },
  planner_designs:          { icon: PenTool, color: '#ec4899', label: 'Designs' },
  reports:                  { icon: FileText, color: '#eab308', label: 'Reports' },
  city_profiles:            { icon: HardDrive, color: '#14b8a6', label: 'City Profiles' },
  activity_logs:            { icon: Clock, color: '#6366f1', label: 'Activity Logs' },
  notifications:            { icon: Bell, color: '#ef4444', label: 'Notifications' },
  project_workspaces:       { icon: FolderOpen, color: '#a855f7', label: 'Projects' },
  area_comparisons:         { icon: GitCompare, color: '#0ea5e9', label: 'Comparisons' },
  infrastructure_requests:  { icon: AlertTriangle, color: '#f59e0b', label: 'Infra Requests' },
  bookmarks:                { icon: Bookmark, color: '#10b981', label: 'Bookmarks' },
  map_layers:               { icon: Layers, color: '#6b7280', label: 'Map Layers' },
  zones:                    { icon: Shield, color: '#78716c', label: 'Zones' },
  utilities:                { icon: Server, color: '#64748b', label: 'Utilities' },
  populationdatas:          { icon: Users, color: '#94a3b8', label: 'Population' },
};

export function SystemStatus() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activityFeed, setActivityFeed] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, healthRes] = await Promise.all([
        fetch('/api/admin/stats').then((r) => r.json()),
        fetch('/api/health').then((r) => r.json()),
      ]);
      setStats(statsRes.data || null);
      setHealth(healthRes);

      // Try to load activity feed
      if (user) {
        try {
          const actRes = await mapsApi.getActivityFeed(1);
          setActivityFeed(actRes.data || []);
        } catch (e) { /* silent */ }
      }
    } catch (err) {
      console.error('Stats load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const totalDocs = stats?.counts ? Object.values(stats.counts).reduce((s, c) => s + c, 0) : 0;

  if (loading) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }} className="w-12 h-12 border-3 border-cyan-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 pb-20 px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">
              System Status
            </h1>
            <p className="text-white/50 mt-2">Database collections, server health, and activity monitoring</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl text-sm text-white/70 flex items-center gap-2 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </motion.button>
        </motion.div>

        {/* Server Health */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <GlassPanel>
            <div className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-xs text-white/40">Server Status</p>
                <p className="text-lg font-bold text-green-400">{health?.success ? 'Online' : 'Offline'}</p>
              </div>
            </div>
          </GlassPanel>

          <GlassPanel>
            <div className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center">
                <Database className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <p className="text-xs text-white/40">Database</p>
                <p className="text-lg font-bold">{stats?.dbName || 'urbanpulse'}</p>
              </div>
            </div>
          </GlassPanel>

          <GlassPanel>
            <div className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center">
                <Layers className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-white/40">Collections</p>
                <p className="text-lg font-bold">{stats?.totalCollections || 0}</p>
              </div>
            </div>
          </GlassPanel>

          <GlassPanel>
            <div className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                <HardDrive className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-white/40">Total Documents</p>
                <p className="text-lg font-bold">{totalDocs.toLocaleString()}</p>
              </div>
            </div>
          </GlassPanel>
        </div>

        {/* Collection Grid */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <h2 className="text-lg font-bold mb-4 text-white/70">Collection Details</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 mb-8">
            {stats?.counts && Object.entries(stats.counts).sort((a, b) => b[1] - a[1]).map(([name, count], i) => {
              const meta = COLLECTION_META[name] || { icon: Database, color: '#6b7280', label: name };
              const Icon = meta.icon;
              return (
                <motion.div
                  key={name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i }}
                >
                  <GlassPanel>
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: meta.color + '15' }}>
                          <Icon className="w-4 h-4" style={{ color: meta.color }} />
                        </div>
                        <span className="text-xs text-white/50 truncate">{meta.label}</span>
                      </div>
                      <div className="text-2xl font-bold">{count.toLocaleString()}</div>
                      <div className="mt-2 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${totalDocs > 0 ? Math.max(2, (count / totalDocs) * 100) : 0}%`,
                            background: meta.color,
                          }}
                        />
                      </div>
                    </div>
                  </GlassPanel>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Recent Activity */}
        {activityFeed.length > 0 && (
          <GlassPanel>
            <div className="p-5">
              <h3 className="text-sm font-bold text-white/60 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" /> Recent Activity
              </h3>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {activityFeed.slice(0, 20).map((a, i) => (
                  <div key={a._id || i} className="flex items-center gap-3 p-2.5 bg-white/5 rounded-xl text-xs">
                    <div className="w-8 h-8 rounded-full bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                      <Activity className="w-3.5 h-3.5 text-cyan-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white/70 truncate">{a.action?.replace(/_/g, ' ')}</p>
                      <p className="text-white/30">{a.resource_type} • {new Date(a.createdAt || a.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </GlassPanel>
        )}

        {/* API Version Info */}
        <div className="mt-6 text-center">
          <p className="text-xs text-white/20">
            UrbanPulse API v{health?.version || '2.0'} • {stats?.totalCollections || 18} collections • Last refreshed {new Date().toLocaleTimeString()}
          </p>
        </div>
      </div>
    </div>
  );
}
