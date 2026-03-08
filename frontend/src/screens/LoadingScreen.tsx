import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music } from 'lucide-react';
import { useGame } from '@/context/GameContext';
import { MOCK_STORY } from '@/data/mockStory';

const LOADING_STAGES = [
  { text: 'Scanning surroundings...', delay: 0 },
  { text: 'A story is forming...', delay: 2000 },
  { text: null, delay: 4000, showTitle: true },
  { text: null, delay: 5500, showSubtitle: true },
  { text: null, delay: 7000, showTap: true },
];

export function LoadingScreen() {
  const { state, dispatch } = useGame();
  const [currentStage, setCurrentStage] = useState(0);
  const [showMusicIndicator, setShowMusicIndicator] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowMusicIndicator(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timers = LOADING_STAGES.map((stage, index) =>
      setTimeout(() => setCurrentStage(index), stage.delay)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  const handleTapToBegin = useCallback(() => {
    setIsFadingOut(true);
    setTimeout(() => {
      dispatch({ type: 'SET_SCREEN', payload: 'story' });
    }, 500);
  }, [dispatch]);

  const currentStageData = LOADING_STAGES[currentStage];

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      {/* Full-screen photo with Ken Burns effect */}
      <motion.div
        initial={{ scale: 1 }}
        animate={{ scale: 1.15 }}
        transition={{ duration: 8, ease: 'linear' }}
        className="absolute inset-0"
      >
        {state.uploadedPhoto ? (
          <motion.img
            src={state.uploadedPhoto}
            alt="Uploaded"
            className="w-full h-full object-cover"
            initial={{ filter: 'saturate(0.6) contrast(1.1) brightness(0.35)' }}
            animate={{ filter: 'saturate(0.8) contrast(1.15) brightness(0.3)' }}
            transition={{ duration: 5, ease: 'easeOut' }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900" />
        )}
      </motion.div>

      {/* Full dark overlay for text readability */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Bottom gradient — extra dark at bottom for title/premise area */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 50%, transparent 80%)',
        }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 20%, rgba(0,0,0,0.5) 100%)',
        }}
      />

      {/* Music indicator */}
      <AnimatePresence>
        {showMusicIndicator && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-3 right-3 z-20"
          >
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.6, 1, 0.6],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm rounded-full px-2.5 py-1"
            >
              <Music className="w-2.5 h-2.5 text-white/60" />
              <span className="text-white/40 text-[9px]">Music</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading text content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10 px-5">
        {/* Stage text (scanning, forming) */}
        <AnimatePresence mode="wait">
          {currentStageData?.text && (
            <motion.p
              key={currentStage}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="text-white/90 text-sm font-light tracking-wide"
            >
              {currentStageData.text.split('').map((char, index) => (
                <motion.span
                  key={index}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.04 }}
                >
                  {char}
                </motion.span>
              ))}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Story title */}
        <AnimatePresence>
          {currentStageData?.showTitle && (
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="text-white text-xl font-serif text-center mt-3"
              style={{
                textShadow: '0 0 30px rgba(255,255,255,0.2)',
              }}
            >
              {MOCK_STORY.title}
            </motion.h1>
          )}
        </AnimatePresence>

        {/* Subtitle */}
        <AnimatePresence>
          {currentStageData?.showSubtitle && (
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
              className="text-white/85 text-[11px] text-center mt-3 max-w-[220px] leading-relaxed"
            >
              {MOCK_STORY.premise}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Tap to begin */}
      <AnimatePresence>
        {currentStageData?.showTap && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0.4, 0.9, 0.4],
            }}
            transition={{
              opacity: {
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              },
            }}
            onClick={handleTapToBegin}
            className="absolute bottom-12 left-0 right-0 z-20 text-center"
          >
            <span className="text-white/90 text-[11px] tracking-widest uppercase">
              Tap to begin
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Fade to black overlay */}
      <AnimatePresence>
        {isFadingOut && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 z-50 bg-black"
          />
        )}
      </AnimatePresence>
    </div>
  );
}
