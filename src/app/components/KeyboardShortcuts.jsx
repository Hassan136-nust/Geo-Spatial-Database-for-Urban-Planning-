import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Keyboard } from 'lucide-react';

const shortcuts = [
  { keys: ['?'], description: 'Show keyboard shortcuts' },
  { keys: ['P'], description: 'Toggle performance stats' },
  { keys: ['Scroll'], description: 'Rotate Earth vertically' },
  { keys: ['Click', 'Drag'], description: 'Manual Earth rotation' },
  { keys: ['Esc'], description: 'Close this dialog' },
];

export function KeyboardShortcuts() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === '?' && !isVisible) {
        e.preventDefault();
        setIsVisible(true);
      }
      if (e.key === 'Escape' && isVisible) {
        setIsVisible(false);
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isVisible]);

  return (
    <>
      <AnimatePresence>
        {!isVisible && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsVisible(true)}
            className="fixed bottom-8 left-8 z-50 w-12 h-12 backdrop-blur-xl bg-white/5 border border-gray-200 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors group"
            title="Keyboard Shortcuts"
          >
            <Keyboard className="w-5 h-5 text-gray-600 group-hover:text-gray-900/90 transition-colors" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isVisible && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsVisible(false)} className="fixed inset-0 z-50 bg-white/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md">
              <div className="backdrop-blur-xl bg-white/90 border border-gray-300 rounded-2xl shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <Keyboard className="w-6 h-6 text-cyan-400" />
                    <h2 className="text-xl font-bold">Keyboard Shortcuts</h2>
                  </div>
                  <button onClick={() => setIsVisible(false)} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {shortcuts.map((shortcut, index) => (
                      <motion.div key={index} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} className="flex items-center justify-between">
                        <span className="text-gray-700">{shortcut.description}</span>
                        <div className="flex gap-2">
                          {shortcut.keys.map((key, i) => (
                            <kbd key={i} className="px-3 py-1.5 text-sm font-mono bg-white/10 border border-gray-300 rounded-lg">{key}</kbd>
                          ))}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <p className="text-sm text-gray-900/50 text-center">
                      Press <kbd className="px-2 py-1 text-xs bg-white/10 rounded">?</kbd> anytime to view shortcuts.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
