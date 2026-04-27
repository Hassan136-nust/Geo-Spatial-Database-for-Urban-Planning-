import { useEffect, useState, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GlassPanel } from '../components/GlassPanel';
import { PenTool, Loader2, Calendar, Hash, Star, X, RotateCcw, Maximize2, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import mapsApi from '../services/mapsApi';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Sky } from '@react-three/drei';
import { useNavigate } from 'react-router';
import { Building3D, TYPE_COLOR } from '../components/City3DBuildings';

// ── Coordinate → 3D ───────────────────────────────────────
function toXZ(lat, lng, cLat, cLng, radius) {
  const s = 9 / Math.max(radius * 1000, 500);
  const cosLat = Math.cos((cLat * Math.PI) / 180);
  return [(lng - cLng) * 111000 * cosLat * s, -(lat - cLat) * 111000 * s];
}

// ── Auto-rotate camera for preview ────────────────────────
function AutoRotate() {
  useFrame((state) => {
    const t = state.clock.elapsedTime * 0.2;
    state.camera.position.x = Math.sin(t) * 16;
    state.camera.position.z = Math.cos(t) * 16;
    state.camera.lookAt(0, 1, 0);
  });
  return null;
}

// ── Khaki ground with road grid ───────────────────────────
function Ground() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#d8cfb0" roughness={0.95} />
      </mesh>
      {/* subtle road lines */}
      {[-6, -3, 0, 3, 6].map((v, i) => (
        <group key={i}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[v, 0.005, 0]}>
            <planeGeometry args={[0.12, 40]} />
            <meshStandardMaterial color="#b8af90" roughness={1} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, v]}>
            <planeGeometry args={[40, 0.12]} />
            <meshStandardMaterial color="#b8af90" roughness={1} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ── City scene ────────────────────────────────────────────
function CityScene({ design, interactive }) {
  const { elements = [], center = {}, radius = 5 } = design;
  const cLat = center.lat || 33.6844;
  const cLng = center.lng || 73.0479;
  return (
    <>
      <ambientLight intensity={1.4} />
      <directionalLight position={[12, 20, 12]} intensity={1.4} castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={60}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      <directionalLight position={[-8, 10, -8]} intensity={0.4} color="#ffe8b0" />
      <Sky distance={450000} sunPosition={[12, 20, 12]} inclination={0} azimuth={0.25} />
      <Ground />
      {elements.map((el, i) => {
        const [x, z] = toXZ(el.lat, el.lng, cLat, cLng, radius);
        return <Building3D key={el.element_id || i} type={el.type} x={x} z={z} />;
      })}
      {!interactive && <AutoRotate />}
      {interactive && <OrbitControls enablePan={false} minDistance={5} maxDistance={35} maxPolarAngle={Math.PI / 2.1} />}
    </>
  );
}

// ── Design Card ────────────────────────────────────────────
function DesignCard({ design, index, onExpand }) {
  const navigate = useNavigate();
  const typeList = [...new Set((design.elements || []).map(e => e.type))];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.5 }}
      className="group"
    >
      <div className="rounded-2xl overflow-hidden border border-gray-200 bg-white/5 hover:border-indigo-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10">
        {/* 3D preview */}
        <div className="relative h-52 cursor-pointer" onClick={() => onExpand(design)}>
          <Canvas shadows gl={{ antialias: true }}>
            <PerspectiveCamera makeDefault position={[14, 11, 14]} fov={44} />
            <Suspense fallback={null}>
              <CityScene design={design} interactive={false} />
            </Suspense>
          </Canvas>
          <button
            onClick={(e) => { e.stopPropagation(); onExpand(design); }}
            className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/60 border border-gray-200 text-gray-700 hover:text-gray-900 transition-all opacity-0 group-hover:opacity-100"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          {design.evaluation_score != null && (
            <div className={`absolute top-3 left-3 px-2.5 py-1 rounded-lg text-xs font-bold backdrop-blur-sm border ${
              design.evaluation_score >= 70 ? 'bg-green-500/25 border-green-500/40 text-green-200'
              : design.evaluation_score >= 50 ? 'bg-yellow-500/25 border-yellow-500/40 text-yellow-200'
              : 'bg-red-500/25 border-red-500/40 text-red-200'}`}>
              <Star className="w-3 h-3 inline mr-0.5" />{design.evaluation_score}/100
            </div>
          )}
        </div>
        {/* Info */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900/90 truncate flex items-center gap-2 mb-1">
            <PenTool className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
            {design.design_name}
          </h3>
          <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
            <span className="flex items-center gap-1"><Hash className="w-3 h-3" />{design.element_count || design.elements?.length || 0} elements</span>
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(design.created_at).toLocaleDateString()}</span>
          </div>
          <div className="flex flex-wrap gap-1 mb-3">
            {typeList.slice(0, 6).map(t => (
              <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full border"
                style={{ background: (TYPE_COLOR[t] || '#6b7280') + '22', borderColor: (TYPE_COLOR[t] || '#6b7280') + '55', color: TYPE_COLOR[t] || '#6b7280' }}>
                {t}
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={() => onExpand(design)}
              className="flex-1 py-2 text-xs font-medium rounded-xl bg-indigo-500/15 border border-indigo-500/25 text-indigo-300 hover:bg-indigo-500/25 transition-colors flex items-center justify-center gap-1">
              <RotateCcw className="w-3 h-3" /> Explore 3D
            </button>
            <button onClick={() => navigate(`/planner?load=${design._id}`)}
              className="py-2 px-3 text-xs rounded-xl bg-white/5 border border-gray-200 text-gray-900/50 hover:text-gray-900 hover:bg-white/10 transition-colors flex items-center gap-1">
              Edit <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Fullscreen Modal ───────────────────────────────────────
function CityModal({ design, onClose }) {
  useEffect(() => {
    const fn = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onClose]);

  const typeGroups = (design.elements || []).reduce((acc, el) => {
    acc[el.type] = (acc[el.type] || 0) + 1;
    return acc;
  }, {});

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm p-4">
      <motion.div initial={{ scale: 0.93, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.93, y: 20 }}
        className="w-full max-w-5xl h-[86vh] rounded-2xl overflow-hidden border border-gray-200 flex flex-col bg-card">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-black/15 bg-white/40 backdrop-blur-sm flex-shrink-0">
          <div>
            <h2 className="font-bold text-gray-900">{design.design_name}</h2>
            <p className="text-xs text-gray-900/55">{design.element_count || design.elements?.length || 0} elements · Drag to rotate · Scroll to zoom</p>
          </div>
          <div className="flex items-center gap-3">
            {design.evaluation_score != null && (
              <span className={`text-sm font-bold px-3 py-1 rounded-lg border ${
                design.evaluation_score >= 70 ? 'bg-green-500/20 border-green-500/30 text-green-200'
                : design.evaluation_score >= 50 ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-200'
                : 'bg-red-500/20 border-red-500/30 text-red-200'}`}>
                ★ {design.evaluation_score}/100
              </span>
            )}
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/30 text-gray-600 hover:text-gray-900 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        {/* 3D */}
        <div className="flex-1 relative">
          <Canvas shadows gl={{ antialias: true }}>
            <PerspectiveCamera makeDefault position={[18, 14, 18]} fov={48} />
            <Suspense fallback={null}>
              <CityScene design={design} interactive={true} />
            </Suspense>
          </Canvas>
          {/* Legend */}
          <div className="absolute bottom-4 left-4 flex flex-wrap gap-2 max-w-sm">
            {Object.entries(typeGroups).map(([type, count]) => (
              <span key={type} className="text-[10px] px-2 py-1 rounded-lg border backdrop-blur-sm text-gray-900 font-medium"
                style={{ background: (TYPE_COLOR[type] || '#6b7280') + '35', borderColor: (TYPE_COLOR[type] || '#6b7280') + '60' }}>
                {type} × {count}
              </span>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main Page ──────────────────────────────────────────────
export function Projects() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => { if (user) load(); }, [user]);

  const load = async () => {
    try {
      setLoading(true);
      const res = await mapsApi.getUserDesigns();
      setDesigns(res.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  if (!user) return <div className="min-h-screen pt-28 text-center"><p className="text-gray-900/50">Please login</p></div>;

  return (
    <div className="min-h-screen pt-28 pb-20 px-8">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
            My 3D Cities
          </h1>
          <p className="text-gray-500 mt-2">Your saved urban layouts visualized as 3D cities. Click any card to explore it interactively.</p>
        </motion.div>

        {loading ? (
          <div className="text-center py-24">
            <Loader2 className="w-8 h-8 text-indigo-400 mx-auto animate-spin mb-3" />
            <p className="text-gray-400 text-sm">Loading your cities...</p>
          </div>
        ) : designs.length === 0 ? (
          <GlassPanel>
            <div className="text-center py-20">
              <div className="text-5xl mb-4">🏙️</div>
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No saved designs yet</h3>
              <p className="text-gray-400 text-sm mb-6">Build a city in the Planner and save it — it will appear here in 3D.</p>
              <button onClick={() => navigate('/planner')}
                className="px-6 py-2.5 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl text-purple-300 text-sm font-medium hover:from-purple-500/30 hover:to-pink-500/30 transition-all">
                Open Planner
              </button>
            </div>
          </GlassPanel>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {designs.map((d, i) => (
              <DesignCard key={d._id} design={d} index={i} onExpand={setExpanded} />
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {expanded && <CityModal design={expanded} onClose={() => setExpanded(null)} />}
      </AnimatePresence>
    </div>
  );
}
