import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GlassPanel } from '../components/GlassPanel';
import { FolderPlus, Trash2, Loader2, Plus, X, Folder, Calendar, Hash, MapPin, PencilRuler, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import mapsApi from '../services/mapsApi';

const PROJECT_COLORS = ['#0ea5e9', '#8b5cf6', '#f59e0b', '#22c55e', '#ef4444', '#ec4899', '#06b6d4', '#f97316'];

export function Projects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newColor, setNewColor] = useState('#0ea5e9');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (user) loadProjects();
  }, [user]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const res = await mapsApi.getProjects();
      setProjects(res.data || []);
    } catch (err) {
      console.error('Load projects error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await mapsApi.createProject(newName, newDesc, newColor);
      setProjects([res.data, ...projects]);
      setShowCreate(false);
      setNewName('');
      setNewDesc('');
    } catch (err) {
      console.error('Create error:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this project?')) return;
    try {
      await mapsApi.deleteProject(id);
      setProjects(projects.filter((p) => p._id !== id));
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  if (!user) return <div className="min-h-screen pt-28 pb-20 px-8 text-center"><p className="text-white/50">Please login</p></div>;

  return (
    <div className="min-h-screen pt-28 pb-20 px-8">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Projects</h1>
            <p className="text-muted-foreground mt-2">Organize areas, designs & reports into workspaces</p>
          </div>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowCreate(true)} className="px-4 py-2.5 bg-primary rounded-xl text-primary-foreground text-sm font-semibold flex items-center gap-2 shadow-sm">
            <Plus className="w-4 h-4" /> New Project
          </motion.button>
        </motion.div>

        {/* Create Modal */}
        <AnimatePresence>
          {showCreate && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mb-6">
              <GlassPanel>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold">Create Project</h3>
                    <button onClick={() => setShowCreate(false)}><X className="w-5 h-5 text-white/40" /></button>
                  </div>
                  <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Project name" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm mb-3 focus:outline-none focus:border-blue-500/50" />
                  <textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Description (optional)" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm mb-3 h-20 resize-none focus:outline-none focus:border-blue-500/50" />
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xs text-white/40">Color:</span>
                    {PROJECT_COLORS.map((c) => (
                      <button key={c} onClick={() => setNewColor(c)} className={`w-6 h-6 rounded-full border-2 transition-transform ${newColor === c ? 'border-white scale-125' : 'border-transparent'}`} style={{ background: c }} />
                    ))}
                  </div>
                  <button onClick={handleCreate} disabled={creating || !newName.trim()} className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
                    {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FolderPlus className="w-4 h-4" />} Create
                  </button>
                </div>
              </GlassPanel>
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="text-center py-20"><Loader2 className="w-8 h-8 text-blue-400 mx-auto animate-spin" /></div>
        ) : projects.length === 0 ? (
          <GlassPanel>
            <div className="text-center py-16">
              <Folder className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/40">No projects yet</p>
            </div>
          </GlassPanel>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project, i) => (
              <motion.div key={project._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <GlassPanel>
                  <div className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: project.color || '#0ea5e9' }} />
                      <h3 className="font-semibold text-white/90 truncate">{project.name}</h3>
                      <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full ${project.status === 'active' ? 'bg-green-500/20 text-green-400' : project.status === 'completed' ? 'bg-blue-500/20 text-blue-400' : 'bg-white/10 text-white/40'}`}>{project.status}</span>
                    </div>
                    {project.description && <p className="text-xs text-white/40 mb-3 line-clamp-2">{project.description}</p>}
                    <div className="flex items-center gap-3 text-xs text-white/30 mb-3">
                      <span><Hash className="w-3 h-3 inline" /> {(project.areas?.length || 0) + (project.designs?.length || 0) + (project.reports?.length || 0)} items</span>
                      <span><Calendar className="w-3 h-3 inline" /> {new Date(project.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-1">
                        {project.areas?.length > 0 && <span className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400"><MapPin className="w-3 h-3" /></span>}
                        {project.designs?.length > 0 && <span className="w-6 h-6 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400"><PencilRuler className="w-3 h-3" /></span>}
                        {project.reports?.length > 0 && <span className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400"><FileText className="w-3 h-3" /></span>}
                      </div>
                      <button onClick={() => handleDelete(project._id)} className="ml-auto px-2 py-1 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  </div>
                </GlassPanel>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
