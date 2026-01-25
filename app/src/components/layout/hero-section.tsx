import { motion } from 'framer-motion';

const HeroMain = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="text-center space-y-8 mb-16"
    >
      <div className="relative">
        <motion.h1
          className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
        >
          <span className="text-foreground relative">Transform Markdown</span>
        </motion.h1>
        <motion.p
          className="text-xl md:text-2xl text-muted-foreground mt-6 max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          Into a focused, distraction-free reading experience with{' '}
          <span className="text-primary font-semibold">smart sections</span>
        </motion.p>
      </div>
    </motion.div>
  );
};

export default HeroMain;
