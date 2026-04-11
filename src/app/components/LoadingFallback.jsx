import { motion } from 'motion/react';

export function LoadingFallback() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black">
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <motion.div
          animate={{
            rotate: 360,
            scale: [1, 1.2, 1],
          }}
          transition={{
            rotate: { duration: 2, repeat: Infinity, ease: 'linear' },
            scale: { duration: 1, repeat: Infinity },
          }}
          className="w-16 h-16 mx-auto mb-4 border-4 border-cyan-400 border-t-transparent rounded-full"
        />
        <p className="text-white/60 text-sm">Initializing UrbanPulse Intelligence...</p>
      </motion.div>
    </div>
  );
}
