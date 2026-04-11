import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GlassPanel } from '../components/GlassPanel';
import { Map, Plus, Pencil, Trash2, X, Save, Users } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export function Zones() {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingZone, setEditingZone] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('');
  const { user } = useAuth();

  const canEdit = user && (user.role === 'admin' || user.role === 'planner');

  const [formData, setFormData] = useState({
    name: '', zone_type: 'residential', description: '', area_sqkm: 0, population_density: 0, status: 'active',
  });

  useEffect(() => { loadZones(); }, []);

  const loadZones = async () => {
    try {
      const res = await api.get('/zones');
      setZones(res.data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this zone?')) return;
    try {
      await api.delete(`/zones/${id}`);
      setZones(zones.filter((z) => z._id !== id));
    } catch (err) { alert(err.message); }
  };

  const handleEdit = (zone) => {
    setEditingZone(zone._id);
    setFormData({
      name: zone.name,
      zone_type: zone.zone_type,
      description: zone.description || '',
      area_sqkm: zone.area_sqkm,
      population_density: zone.population_density,
      status: zone.status,
    });
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingZone) {
        const res = await api.put(`/zones/${editingZone}`, formData);
        setZones(zones.map((z) => z._id === editingZone ? res.data.data : z));
      } else {
        const res = await api.post('/zones', {
          ...formData,
          geometry: { type: 'Polygon', coordinates: [[[73.05, 33.70], [73.06, 33.70], [73.06, 33.71], [73.05, 33.71], [73.05, 33.70]]] },
        });
        setZones([...zones, res.data.data]);
      }
      setShowForm(false);
      setEditingZone(null);
      setFormData({ name: '', zone_type: 'residential', description: '', area_sqkm: 0, population_density: 0, status: 'active' });
    } catch (err) { alert(err.message); }
  };

  const filtered = filter ? zones.filter((z) => z.zone_type === filter) : zones;
  const typeColors = { residential: 'text-blue-400 bg-blue-400/10', commercial: 'text-amber-400 bg-amber-400/10', industrial: 'text-red-400 bg-red-400/10', green: 'text-green-400 bg-green-400/10', institutional: 'text-purple-400 bg-purple-400/10', mixed: 'text-cyan-400 bg-cyan-400/10' };

  if (loading) {
    return <div className="min-h-screen pt-32 flex items-center justify-center"><motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }} className="w-12 h-12 border-3 border-cyan-400 border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="min-h-screen pt-28 pb-20 px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between mb-10">
          <div>
            <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-white via-blue-100 to-cyan-200 bg-clip-text text-transparent">Zones Management</h1>
            <p className="text-lg text-white/50">Islamabad's {zones.length} mapped sectors</p>
          </div>
          {canEdit && (
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => { setShowForm(true); setEditingZone(null); setFormData({ name: '', zone_type: 'residential', description: '', area_sqkm: 0, population_density: 0, status: 'active' }); }}
              className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg shadow-cyan-500/25">
              <Plus className="w-4 h-4" /> Add Zone
            </motion.button>
          )}
        </motion.div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {['', 'residential', 'commercial', 'industrial', 'institutional', 'mixed', 'green'].map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-full text-xs font-medium transition-colors ${filter === f ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'}`}>
              {f || 'All'} {f ? '' : `(${zones.length})`}
            </button>
          ))}
        </div>

        {/* Zone Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((zone, i) => (
            <GlassPanel key={zone._id} delay={0.03 * i}>
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-bold">{zone.name}</h3>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs capitalize mt-1 ${typeColors[zone.zone_type] || 'text-white/60 bg-white/10'}`}>{zone.zone_type}</span>
                  </div>
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: zone.color || '#4488ff' }} />
                </div>
                <p className="text-xs text-white/50 mb-4 line-clamp-2">{zone.description}</p>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-white/5 rounded-lg p-2">
                    <span className="text-white/40">Area</span>
                    <div className="font-bold">{zone.area_sqkm} km²</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2">
                    <span className="text-white/40">Density</span>
                    <div className="font-bold">{zone.population_density?.toLocaleString()}/km²</div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                  <span className={`text-xs ${zone.status === 'active' ? 'text-green-400' : 'text-amber-400'} capitalize`}>{zone.status?.replace('_', ' ')}</span>
                  {canEdit && (
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(zone)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"><Pencil className="w-3.5 h-3.5 text-white/50" /></button>
                      <button onClick={() => handleDelete(zone._id)} className="p-1.5 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5 text-red-400/50" /></button>
                    </div>
                  )}
                </div>
              </div>
            </GlassPanel>
          ))}
        </div>

        {/* Edit/Create Modal */}
        <AnimatePresence>
          {showForm && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowForm(false)} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md">
                <div className="backdrop-blur-xl bg-black/80 border border-white/20 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold">{editingZone ? 'Edit Zone' : 'New Zone'}</h3>
                    <button onClick={() => setShowForm(false)} className="p-2 hover:bg-white/10 rounded-lg"><X className="w-5 h-5" /></button>
                  </div>
                  <form onSubmit={handleSave} className="space-y-4">
                    <input type="text" placeholder="Zone Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500/50" required />
                    <select value={formData.zone_type} onChange={(e) => setFormData({ ...formData, zone_type: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500/50">
                      <option value="residential" className="bg-gray-900">Residential</option>
                      <option value="commercial" className="bg-gray-900">Commercial</option>
                      <option value="industrial" className="bg-gray-900">Industrial</option>
                      <option value="institutional" className="bg-gray-900">Institutional</option>
                      <option value="mixed" className="bg-gray-900">Mixed</option>
                      <option value="green" className="bg-gray-900">Green</option>
                    </select>
                    <textarea placeholder="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500/50 h-20 resize-none" />
                    <div className="grid grid-cols-2 gap-3">
                      <input type="number" step="0.1" placeholder="Area (km²)" value={formData.area_sqkm} onChange={(e) => setFormData({ ...formData, area_sqkm: parseFloat(e.target.value) })} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500/50" />
                      <input type="number" placeholder="Pop. Density" value={formData.population_density} onChange={(e) => setFormData({ ...formData, population_density: parseInt(e.target.value) })} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500/50" />
                    </div>
                    <button type="submit" className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
                      <Save className="w-4 h-4" /> {editingZone ? 'Update Zone' : 'Create Zone'}
                    </button>
                  </form>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
