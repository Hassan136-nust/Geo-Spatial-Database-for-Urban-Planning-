import { motion } from 'motion/react';

export function GlassPanel({ children, className = '', delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`relative backdrop-blur-xl bg-white/5 border border-gray-200 rounded-2xl shadow-2xl hover:bg-white/10 hover:border-gray-300 transition-colors ${className}`}
      style={{
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      }}
    >
      {children}
    </motion.div>
  );
}
