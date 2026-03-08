import { useRef, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, ArrowRight, X } from 'lucide-react';
import { useGame } from '@/context/GameContext';

const GENRE_PLACEHOLDERS = [
  'spy thriller...',
  'cozy mystery...',
  'zombie survival...',
  'office drama...',
  'fantasy adventure...',
  'sci-fi heist...',
  'rom-com chaos...',
];

function CyclingPlaceholder() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const cycleInterval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % GENRE_PLACEHOLDERS.length);
        setIsVisible(true);
      }, 300);
    }, 2500);

    return () => clearInterval(cycleInterval);
  }, []);

  return (
    <motion.span
      animate={{ opacity: isVisible ? 1 : 0 }}
      transition={{ duration: 0.3 }}
      className="text-white/25 text-[11px]"
    >
      {GENRE_PLACEHOLDERS[currentIndex]}
    </motion.span>
  );
}

export function CameraScreen() {
  const { state, dispatch } = useGame();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];

      if (!file) {
        return;
      }

      const reader = new FileReader();

      reader.onloadend = () => {
        dispatch({
          type: 'SET_UPLOAD',
          payload: {
            previewUrl: typeof reader.result === 'string' ? reader.result : null,
            file,
          },
        });
      };

      reader.readAsDataURL(file);
    },
    [dispatch],
  );

  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handlePromptChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      dispatch({ type: 'SET_PROMPT', payload: event.target.value });
    },
    [dispatch],
  );

  const handleClearPhoto = useCallback(() => {
    dispatch({
      type: 'SET_UPLOAD',
      payload: {
        previewUrl: null,
        file: null,
      },
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [dispatch]);

  const handleStartGame = useCallback(() => {
    if (!state.pendingImageFile) {
      return;
    }

    setIsTransitioning(true);
    setTimeout(() => {
      dispatch({ type: 'SET_SCREEN', payload: 'loading' });
    }, 600);
  }, [dispatch, state.pendingImageFile]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-black to-gray-900" />

      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%)',
        }}
      />

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-5 pb-14">
        <motion.button
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          onClick={triggerFileInput}
          className="relative group"
        >
          <div
            className="flex h-[170px] w-[170px] flex-col items-center justify-center gap-2.5 overflow-hidden rounded-2xl border-2 border-dashed border-white/25 bg-white/5"
            style={{
              boxShadow: '0 0 30px rgba(255,255,255,0.04)',
            }}
          >
            <div className="absolute top-2.5 left-2.5 h-3.5 w-3.5 border-l-2 border-t-2 border-amber-400/40" />
            <div className="absolute top-2.5 right-2.5 h-3.5 w-3.5 border-r-2 border-t-2 border-amber-400/40" />
            <div className="absolute bottom-2.5 left-2.5 h-3.5 w-3.5 border-l-2 border-b-2 border-amber-400/40" />
            <div className="absolute bottom-2.5 right-2.5 h-3.5 w-3.5 border-r-2 border-b-2 border-amber-400/40" />

            <motion.div
              animate={{
                scale: [1, 1.05, 1],
                opacity: [0.4, 0.7, 0.4],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <Camera className="h-8 w-8 text-white/35" strokeWidth={1.5} />
            </motion.div>
            <div className="text-center">
              <p className="text-[11px] font-medium text-white/50">Tap to upload a photo</p>
              <p className="mt-0.5 text-[9px] text-white/25">of you, your room, anything</p>
            </div>

            <motion.div
              animate={{ top: ['0%', '100%', '0%'] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
              className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/25 to-transparent"
            />
          </div>
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
          className="w-full max-w-[220px]"
        >
          <label className="mb-1 block text-center text-[9px] uppercase tracking-widest text-white/40">
            What kind of game?
          </label>
          <div className="relative flex items-center gap-2 rounded-lg border border-white/12 bg-white/8 px-3 py-2.5 backdrop-blur-md">
            <span className="flex-shrink-0 text-[11px] text-white/35">I want a</span>
            <div className="relative flex-1">
              <input
                type="text"
                value={state.userPrompt}
                onChange={handlePromptChange}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                placeholder={inputFocused ? '' : ' '}
                className="w-full bg-transparent text-[11px] text-white outline-none"
                style={{ userSelect: 'text', WebkitUserSelect: 'text' }}
              />
              {!state.userPrompt && !inputFocused ? (
                <div className="pointer-events-none absolute inset-0 flex items-center">
                  <CyclingPlaceholder />
                </div>
              ) : null}
            </div>
          </div>
        </motion.div>

        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          onClick={triggerFileInput}
          className="flex items-center gap-1.5 rounded-full border border-amber-400/25 bg-amber-400/12 px-4 py-2 active:scale-95 transition-transform"
        >
          <Upload className="h-3 w-3 text-amber-400" />
          <span className="text-[11px] font-medium text-amber-400">Upload Photo</span>
        </motion.button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      <AnimatePresence>
        {state.uploadedPhoto && !isTransitioning ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 z-30"
          >
            <img
              src={state.uploadedPhoto}
              alt="Preview"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50" />

            <button
              onClick={handleClearPhoto}
              className="absolute top-3 left-3 z-40 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm active:scale-95 transition-transform"
            >
              <X className="h-3.5 w-3.5 text-white/70" />
            </button>

            <div className="absolute inset-0 z-40 flex flex-col items-center justify-end px-5 pb-20">
              <div className="mb-3 w-full max-w-[220px]">
                <div className="relative flex items-center gap-2 rounded-lg border border-white/20 bg-black/40 px-3 py-2.5 backdrop-blur-md">
                  <span className="flex-shrink-0 text-[11px] text-white/50">I want a</span>
                  <input
                    type="text"
                    value={state.userPrompt}
                    onChange={handlePromptChange}
                    placeholder="spy thriller..."
                    className="w-full bg-transparent text-[11px] text-white outline-none placeholder:text-white/25"
                    style={{ userSelect: 'text', WebkitUserSelect: 'text' }}
                  />
                </div>
              </div>

              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                onClick={handleStartGame}
                className="flex items-center gap-2 rounded-full bg-amber-400 px-6 py-2.5 active:scale-95 transition-transform"
                style={{
                  boxShadow: '0 4px 20px rgba(212,168,67,0.4)',
                }}
              >
                <span className="text-xs font-semibold text-black">Start Adventure</span>
                <ArrowRight className="h-3.5 w-3.5 text-black" />
              </motion.button>

              <p className="mt-2 text-[9px] text-white/30">tap photo to change</p>
            </div>

            <button
              onClick={triggerFileInput}
              className="absolute inset-0 z-35"
              aria-label="Change photo"
            />
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {isTransitioning ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 z-50 bg-black"
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}
