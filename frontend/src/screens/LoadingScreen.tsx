import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '@/context/GameContext';
import { buildStoryTitle } from '@/lib/story';

export function LoadingScreen() {
  const { state, dispatch, generateStory } = useGame();
  const [currentStage, setCurrentStage] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    if (state.storyStatus === 'idle' && state.pendingImageFile) {
      void generateStory();
    }
  }, [state.storyStatus, state.pendingImageFile, generateStory]);

  useEffect(() => {
    if (state.storyStatus !== 'generating') {
      return;
    }

    setCurrentStage(0);

    const timer = setTimeout(() => {
      setCurrentStage(1);
    }, 1800);

    return () => clearTimeout(timer);
  }, [state.storyStatus]);

  useEffect(() => {
    if (state.storyStatus !== 'ready' || !state.story) {
      return;
    }

    setCurrentStage(2);

    const subtitleTimer = setTimeout(() => {
      setCurrentStage(3);
    }, 600);

    const tapTimer = setTimeout(() => {
      setCurrentStage(4);
    }, 1400);

    return () => {
      clearTimeout(subtitleTimer);
      clearTimeout(tapTimer);
    };
  }, [state.storyStatus, state.story]);

  const handleTapToBegin = useCallback(() => {
    if (state.storyStatus !== 'ready' || !state.story) {
      return;
    }

    setIsFadingOut(true);
    setTimeout(() => {
      dispatch({ type: 'SET_SCREEN', payload: 'story' });
    }, 500);
  }, [dispatch, state.storyStatus, state.story]);

  const handleRetry = useCallback(() => {
    setCurrentStage(0);
    void generateStory();
  }, [generateStory]);

  const handleBack = useCallback(() => {
    dispatch({ type: 'SET_SCREEN', payload: 'camera' });
  }, [dispatch]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
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
            className="h-full w-full object-cover"
            initial={{ filter: 'saturate(0.6) contrast(1.1) brightness(0.35)' }}
            animate={{ filter: 'saturate(0.8) contrast(1.15) brightness(0.3)' }}
            transition={{ duration: 5, ease: 'easeOut' }}
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-gray-800 to-gray-900" />
        )}
      </motion.div>

      <div className="absolute inset-0 bg-black/50" />
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 50%, transparent 80%)',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 20%, rgba(0,0,0,0.5) 100%)',
        }}
      />

      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-5">
        {state.storyStatus === 'error' ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-[240px] text-center"
          >
            <p className="text-sm text-white/92">The story failed to generate.</p>
            <p className="mt-2 text-[11px] leading-relaxed text-white/60">
              {state.errorMessage || 'The backend returned an error.'}
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <button
                onClick={handleRetry}
                className="rounded-full bg-amber-400 px-4 py-2 text-[11px] font-semibold text-black"
              >
                Retry
              </button>
              <button
                onClick={handleBack}
                className="rounded-full border border-white/20 px-4 py-2 text-[11px] text-white/75"
              >
                Back
              </button>
            </div>
          </motion.div>
        ) : (
          <>
            <AnimatePresence mode="wait">
              {currentStage < 2 ? (
                <motion.p
                  key={currentStage}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-sm font-light tracking-wide text-white/90"
                >
                  {(currentStage === 0 ? 'Scanning surroundings...' : 'A story is forming...')
                    .split('')
                    .map((char, index) => (
                      <motion.span
                        key={`${char}-${index}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.04 }}
                      >
                        {char}
                      </motion.span>
                    ))}
                </motion.p>
              ) : null}
            </AnimatePresence>

            <AnimatePresence>
              {currentStage >= 2 && state.story ? (
                <motion.h1
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="mt-3 text-center font-serif text-xl text-white"
                  style={{
                    textShadow: '0 0 30px rgba(255,255,255,0.2)',
                  }}
                >
                  {buildStoryTitle(state.story, state.userPrompt)}
                </motion.h1>
              ) : null}
            </AnimatePresence>

            <AnimatePresence>
              {currentStage >= 3 && state.story ? (
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
                  className="mt-3 max-w-[220px] text-center text-[11px] leading-relaxed text-white/85"
                >
                  {state.story.story_background || 'A cinematic opening generated from your photo.'}
                </motion.p>
              ) : null}
            </AnimatePresence>
          </>
        )}
      </div>

      <AnimatePresence>
        {currentStage >= 4 && state.storyStatus === 'ready' ? (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.4, 0.9, 0.4] }}
            transition={{
              opacity: {
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              },
            }}
            onClick={handleTapToBegin}
            className="absolute right-0 bottom-12 left-0 z-20 text-center"
          >
            <span className="text-[11px] uppercase tracking-widest text-white/90">
              Tap to begin
            </span>
          </motion.button>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {isFadingOut ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 z-50 bg-black"
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}
