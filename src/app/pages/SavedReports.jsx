import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileDown, Trash2, Loader2, Calendar, HardDrive, FileText,
  Star, TrendingUp, TrendingDown, Minus, Search, RefreshCw,
  MapPin, Shield, AlertTriangle, CheckCircle2, Clock, BarChart3
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import mapsApi from '../services/mapsApi';

// ── Helpers ───────────────────────────────────────────────
function formatSize(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function ScoreBadge({ score }) {
  if (score == null) return null;
  const s = Number(score);
  if (s >= 70) return (
    <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
      <CheckCircle2 className="w-3 h-3" /> {s}
    </span>
  );
  if (s >= 50) return (
    <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-500/15 text-yellow-400 border border-yellow-500/20">
      <Minus className="w-3 h-3" /> {s}
    </span>
  );
  return (
    <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/15 text-red-400 border border-red-500/20">
      <AlertTriangle className="w-3 h-3" /> {s}
    </span>
  );
}

function ScoreBar({ score }) {
  const s = Number(score || 0);
  const color = s >= 70 ? '#10b981' : s >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${s}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="h-full rounded-full"
        style={{ background: color }}
      />
    </div>
  );
}

// ── Stats Card ────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="rounded-2xl border border-gray-300/8 bg-white/3 p-4 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-gray-500 text-xs">{label}</p>
        <p className="text-gray-900 font-bold text-lg leading-none mt-0.5">{value}</p>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────
export function SavedReports() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [downloading, setDownloading] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const loadReports = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await mapsApi.getUserReports();
      setReports(res.data || []);
    } catch (err) {
      console.error('Load reports error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (user) loadReports();
    else setLoading(false);
  }, [user, loadReports]);

  const handleDownload = async (report) => {
    setDownloading(report._id);
    try {
      const blob = await mapsApi.downloadReport(report._id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `UrbanPulse_${report.area_name.replace(/\s+/g, '_')}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setDownloading(null);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this report permanently?')) return;
    setDeleting(id);
    try {
      await mapsApi.deleteReport(id);
      setReports((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setDeleting(null);
    }
  };

  // Filter + sort
  const filtered = reports
    .filter((r) => r.area_name?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.generated_at) - new Date(a.generated_at);
      if (sortBy === 'oldest') return new Date(a.generated_at) - new Date(b.generated_at);
      if (sortBy === 'score_high') return (b.score || 0) - (a.score || 0);
      if (sortBy === 'score_low') return (a.score || 0) - (b.score || 0);
      return 0;
    });

  // Stats
  const avgScore = reports.length
    ? Math.round(reports.reduce((s, r) => s + (r.score || 0), 0) / reports.length)
    : 0;
  const bestReport = reports.reduce((best, r) => (!best || r.score > best.score) ? r : best, null);

  if (!user) {
    return (
      <div className="min-h-screen pt-28 pb-20 px-8 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-900/50 text-lg">Please log in to view your saved reports</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-20 px-6" style={{ background: '#f4f7f6' }}>
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-300 via-orange-400 to-rose-400 bg-clip-text text-transparent">
                Reports History
              </h1>
              <p className="text-gray-500 mt-2 text-sm">
                All PDF reports generated from area analysis
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => loadReports(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-gray-200 text-gray-600 hover:text-gray-900 text-xs transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </motion.button>
          </div>
        </motion.div>

        {/* Stats Row */}
        {reports.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8"
          >
            <StatCard icon={FileText} label="Total Reports" value={reports.length} color="bg-amber-500/15 text-amber-400" />
            <StatCard icon={BarChart3} label="Average Score" value={`${avgScore}/100`} color="bg-blue-500/15 text-blue-400" />
            <StatCard
              icon={Star}
              label="Best Area"
              value={bestReport ? bestReport.area_name.split(',')[0].slice(0, 14) : '—'}
              color="bg-emerald-500/15 text-emerald-400"
            />
            <StatCard
              icon={Clock}
              label="Latest Report"
              value={reports.length ? formatDate(reports.slice().sort((a, b) => new Date(b.generated_at) - new Date(a.generated_at))[0]?.generated_at) : '—'}
              color="bg-purple-500/15 text-purple-400"
            />
          </motion.div>
        )}

        {/* Search + Sort Controls */}
        {reports.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="flex flex-col sm:flex-row gap-3 mb-6"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by area name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-gray-200 text-gray-800 text-sm placeholder-white/20 focus:outline-none focus:border-amber-500/50 focus:bg-white/8 transition-all"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-white/5 border border-gray-200 text-gray-600 text-sm focus:outline-none focus:border-amber-500/50 transition-all appearance-none cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="score_high">Highest Score</option>
              <option value="score_low">Lowest Score</option>
            </select>
          </motion.div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <Loader2 className="w-10 h-10 text-amber-400 animate-spin mb-4" />
            <p className="text-gray-500 text-sm">Loading your reports...</p>
          </div>
        ) : reports.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="rounded-3xl border border-gray-300/8 bg-white/3 p-16 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-6">
              <FileText className="w-10 h-10 text-amber-500/50" />
            </div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No reports yet</h3>
            <p className="text-gray-400 text-sm max-w-xs mx-auto">
              Go to the <span className="text-amber-400">Analytics</span> page, search for an area, and download a PDF report. It will appear here automatically.
            </p>
          </motion.div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Search className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No reports found matching "{search}"</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-gray-400 text-xs mb-4">Showing {filtered.length} of {reports.length} reports</p>
            <AnimatePresence>
              {filtered.map((report, i) => (
                <motion.div
                  key={report._id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, x: -20 }}
                  transition={{ delay: i * 0.04, duration: 0.3 }}
                  className="group rounded-2xl border border-gray-300/8 bg-white/3 hover:bg-white/5 hover:border-amber-500/20 transition-all duration-200 overflow-hidden"
                >
                  <div className="p-5 flex items-center gap-5">
                    {/* Icon */}
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-6 h-6 text-amber-400" />
                    </div>

                    {/* Main Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <h3 className="font-semibold text-gray-900/90 truncate max-w-xs flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                          {report.area_name}
                        </h3>
                        <ScoreBadge score={report.score} />
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-gray-900/35 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(report.generated_at)} at {formatTime(report.generated_at)}
                        </span>
                        <span className="flex items-center gap-1">
                          <HardDrive className="w-3 h-3" />
                          {formatSize(report.file_size)}
                        </span>
                        {report.rating && (
                          <span className="flex items-center gap-1 text-amber-400/60">
                            <Star className="w-3 h-3" />
                            {report.rating}
                          </span>
                        )}
                        {report.radius && (
                          <span>{(report.radius / 1000).toFixed(1)} km radius</span>
                        )}
                      </div>

                      {/* Score bar */}
                      {report.score != null && (
                        <div className="mt-2.5 max-w-xs">
                          <ScoreBar score={report.score} />
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDownload(report)}
                        disabled={downloading === report._id}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/20 text-amber-300 transition-all disabled:opacity-50"
                      >
                        {downloading === report._id
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <FileDown className="w-3.5 h-3.5" />}
                        {downloading === report._id ? 'Downloading...' : 'Download'}
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDelete(report._id)}
                        disabled={deleting === report._id}
                        className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/15 text-red-400 transition-all disabled:opacity-50"
                        title="Delete report"
                      >
                        {deleting === report._id
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <Trash2 className="w-3.5 h-3.5" />}
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
