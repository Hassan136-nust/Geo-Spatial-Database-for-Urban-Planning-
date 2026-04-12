import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GlassPanel } from '../components/GlassPanel';
import { FileDown, Trash2, Loader2, Calendar, HardDrive, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import mapsApi from '../services/mapsApi';

export function SavedReports() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(null);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    if (user) loadReports();
  }, [user]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const res = await mapsApi.getUserReports();
      setReports(res.data || []);
    } catch (err) {
      console.error('Load reports error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (report) => {
    setDownloading(report._id);
    try {
      const blob = await mapsApi.downloadReport(report._id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `UrbanPulse_Report_${report.area_name.replace(/\s+/g, '_')}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setDownloading(null);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this report?')) return;
    setDeleting(id);
    try {
      await mapsApi.deleteReport(id);
      setReports(reports.filter((r) => r._id !== id));
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setDeleting(null);
    }
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!user) {
    return (
      <div className="min-h-screen pt-28 pb-20 px-8 text-center">
        <p className="text-white/50">Please login to view saved reports</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 pb-20 px-8">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent">
            Saved Reports
          </h1>
          <p className="text-white/50 mt-2">Your generated PDF reports</p>
        </motion.div>

        {loading ? (
          <div className="text-center py-20">
            <Loader2 className="w-8 h-8 text-amber-400 mx-auto animate-spin" />
          </div>
        ) : reports.length === 0 ? (
          <GlassPanel>
            <div className="text-center py-16">
              <FileText className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/40">No reports generated yet</p>
              <p className="text-white/30 text-sm mt-1">Analyze an area and download a PDF report</p>
            </div>
          </GlassPanel>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {reports.map((report, i) => (
                <motion.div
                  key={report._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <GlassPanel>
                    <div className="p-4 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-6 h-6 text-amber-400" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white/90 truncate">{report.area_name}</h3>
                        <div className="flex items-center gap-3 text-xs text-white/40 mt-1">
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(report.generated_at).toLocaleDateString()}</span>
                          <span className="flex items-center gap-1"><HardDrive className="w-3 h-3" />{formatSize(report.file_size)}</span>
                          <span className={`font-bold ${report.score >= 70 ? 'text-green-400' : report.score >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                            Score: {report.score}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleDownload(report)}
                          disabled={downloading === report._id}
                          className="px-4 py-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/20 rounded-xl text-xs text-amber-300 hover:from-amber-500/30 hover:to-orange-500/30 transition-colors flex items-center gap-1"
                        >
                          {downloading === report._id ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileDown className="w-3 h-3" />}
                          Download
                        </motion.button>
                        <button
                          onClick={() => handleDelete(report._id)}
                          disabled={deleting === report._id}
                          className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-xs text-red-400 transition-colors"
                        >
                          {deleting === report._id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                  </GlassPanel>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
