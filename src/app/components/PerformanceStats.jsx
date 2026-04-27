import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export function PerformanceStats() {
  const [isVisible, setIsVisible] = useState(false);
  const [stats, setStats] = useState({ fps: 0, memory: 0, frame: 0 });

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'p' || e.key === 'P') {
        setIsVisible((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    let frameCount = 0;
    let lastTime = performance.now();
    let fps = 0;
    let animId;

    const updateStats = () => {
      frameCount++;
      const currentTime = performance.now();
      const delta = currentTime - lastTime;
      if (delta >= 1000) {
        fps = Math.round((frameCount * 1000) / delta);
        frameCount = 0;
        lastTime = currentTime;
        const memory = performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : 0;
        setStats({ fps, memory, frame: frameCount });
      }
      animId = requestAnimationFrame(updateStats);
    };

    animId = requestAnimationFrame(updateStats);
    return () => cancelAnimationFrame(animId);
  }, [isVisible]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          className="fixed bottom-8 right-8 z-50 backdrop-blur-xl bg-white/70 border border-gray-200 rounded-xl p-4 font-mono text-xs"
        >
          <div className="space-y-2">
            <div className="flex justify-between gap-4">
              <span className="text-gray-600">FPS:</span>
              <span className={`font-bold ${stats.fps >= 55 ? 'text-green-400' : stats.fps >= 30 ? 'text-yellow-400' : 'text-red-400'}`}>
                {stats.fps}
              </span>
            </div>
            {stats.memory > 0 && (
              <div className="flex justify-between gap-4">
                <span className="text-gray-600">Memory:</span>
                <span className="text-blue-400">{stats.memory} MB</span>
              </div>
            )}
            <div className="mt-3 pt-3 border-t border-gray-200 text-gray-500 text-[10px]">
              Press 'P' to toggle
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
