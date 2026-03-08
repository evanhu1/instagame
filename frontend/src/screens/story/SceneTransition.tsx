import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTypewriter } from '@/hooks/useTypewriter';

interface SceneTransitionProps {
  text: string | null;
  onComplete: () => void;
}

export function SceneTransition({ text, onComplete }: SceneTransitionProps) {
  const { displayedText, isComplete } = useTypewriter({
    text: text || '',
    speed: 35,
    enabled: Boolean(text),
  });

  useEffect(() => {
    if (!isComplete) {
      return;
    }

    const timer = setTimeout(onComplete, 1500);
    return () => clearTimeout(timer);
  }, [isComplete, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0 z-50 flex items-center justify-center bg-black px-6"
    >
      <div className="text-center">
        <div className="mx-auto mb-3 h-[1px] w-4 bg-amber-400/30" />
        <p className="max-w-[220px] text-[11px] leading-relaxed italic text-white/60">
          {displayedText}
        </p>
        <div className="mx-auto mt-3 h-[1px] w-4 bg-amber-400/30" />
      </div>
    </motion.div>
  );
}
