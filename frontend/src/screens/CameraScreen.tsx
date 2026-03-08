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

// Animated cycling placeholder component
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
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageUrl = reader.result as string;
        setPreviewImage(imageUrl);
        dispatch({ type: 'SET_PHOTO', payload: imageUrl });
      };
      reader.readAsDataURL(file);
    }
  }, [dispatch]);

  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handlePromptChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: 'SET_PROMPT', payload: e.target.value });
  }, [dispatch]);

  const handleClearPhoto = useCallback(() => {
    setPreviewImage(null);
    dispatch({ type: 'SET_PHOTO', payload: null });
    // Reset file input so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [dispatch]);

  const handleStartGame = useCallback(() => {
    setIsTransitioning(true);
    setTimeout(() => {
      dispatch({ type: 'SET_SCREEN', payload: 'loading' });
    }, 600);
  }, [dispatch]);

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-black to-gray-900" />

      {/* Subtle vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%)',
        }}
      />

      {/* Main content — vertically centered */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-5 gap-4 pb-14">

        {/* Upload area — the primary action */}
        <motion.button
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          onClick={triggerFileInput}
          className="relative group"
        >
          <div
            className="w-[170px] h-[170px] rounded-2xl overflow-hidden border-2 border-dashed border-white/25
                       flex flex-col items-center justify-center gap-2.5 bg-white/5
                       group-active:scale-95 transition-transform"
            style={{
              boxShadow: '0 0 30px rgba(255,255,255,0.04)',
            }}
          >
            {/* Corner accents */}
            <div className="absolute top-2.5 left-2.5 w-3.5 h-3.5 border-l-2 border-t-2 border-amber-400/40" />
            <div className="absolute top-2.5 right-2.5 w-3.5 h-3.5 border-r-2 border-t-2 border-amber-400/40" />
            <div className="absolute bottom-2.5 left-2.5 w-3.5 h-3.5 border-l-2 border-b-2 border-amber-400/40" />
            <div className="absolute bottom-2.5 right-2.5 w-3.5 h-3.5 border-r-2 border-b-2 border-amber-400/40" />

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
              <Camera className="w-8 h-8 text-white/35" strokeWidth={1.5} />
            </motion.div>
            <div className="text-center">
              <p className="text-white/50 text-[11px] font-medium">Tap to upload a photo</p>
              <p className="text-white/25 text-[9px] mt-0.5">of you, your room, anything</p>
            </div>

            {/* Scan line */}
            <motion.div
              animate={{ top: ['0%', '100%', '0%'] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
              className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/25 to-transparent"
            />
          </div>
        </motion.button>

        {/* Genre input — clear label and prominent field */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
          className="w-full max-w-[220px]"
        >
          <label className="text-white/40 text-[9px] uppercase tracking-widest mb-1 block text-center">
            What kind of game?
          </label>
          <div className="relative flex items-center gap-2 bg-white/8 backdrop-blur-md rounded-lg px-3 py-2.5 border border-white/12">
            <span className="text-white/35 text-[11px] flex-shrink-0">I want a</span>
            <div className="relative flex-1">
              <input
                type="text"
                value={state.userPrompt}
                onChange={handlePromptChange}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                placeholder={inputFocused ? '' : ' '}
                className="bg-transparent text-white text-[11px] w-full outline-none"
                style={{ userSelect: 'text', WebkitUserSelect: 'text' }}
              />
              {/* Cycling placeholder behind input */}
              {!state.userPrompt && !inputFocused && (
                <div className="absolute inset-0 pointer-events-none flex items-center">
                  <CyclingPlaceholder />
                </div>
              )}
            </div>
          </div>
          <p className="text-white/20 text-[9px] text-center mt-1">
            or leave blank — we'll surprise you
          </p>
        </motion.div>

        {/* Upload button */}
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          onClick={triggerFileInput}
          className="flex items-center gap-1.5 bg-amber-400/12 border border-amber-400/25 rounded-full px-4 py-2
                     active:scale-95 transition-transform"
        >
          <Upload className="w-3 h-3 text-amber-400" />
          <span className="text-amber-400 text-[11px] font-medium">Upload Photo</span>
        </motion.button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Photo preview overlay — user stays here until they tap "Go" */}
      <AnimatePresence>
        {previewImage && !isTransitioning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 z-30"
          >
            {/* Photo background */}
            <img
              src={previewImage}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            {/* Dark overlay for readability */}
            <div className="absolute inset-0 bg-black/50" />

            {/* Close button */}
            <button
              onClick={handleClearPhoto}
              className="absolute top-3 left-3 z-40 w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center active:scale-95 transition-transform"
            >
              <X className="w-3.5 h-3.5 text-white/70" />
            </button>

            {/* Prompt input + Go button overlay */}
            <div className="absolute inset-0 z-40 flex flex-col items-center justify-end pb-20 px-5">
              {/* Genre input on preview */}
              <div className="w-full max-w-[220px] mb-3">
                <div className="relative flex items-center gap-2 bg-black/40 backdrop-blur-md rounded-lg px-3 py-2.5 border border-white/20">
                  <span className="text-white/50 text-[11px] flex-shrink-0">I want a</span>
                  <input
                    type="text"
                    value={state.userPrompt}
                    onChange={handlePromptChange}
                    placeholder="spy thriller..."
                    className="bg-transparent text-white text-[11px] w-full outline-none placeholder:text-white/25"
                    style={{ userSelect: 'text', WebkitUserSelect: 'text' }}
                  />
                </div>
              </div>

              {/* Go button */}
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                onClick={handleStartGame}
                className="flex items-center gap-2 bg-amber-400 rounded-full px-6 py-2.5 active:scale-95 transition-transform"
                style={{
                  boxShadow: '0 4px 20px rgba(212,168,67,0.4)',
                }}
              >
                <span className="text-black text-xs font-semibold">Start Adventure</span>
                <ArrowRight className="w-3.5 h-3.5 text-black" />
              </motion.button>

              <p className="text-white/30 text-[9px] mt-2">tap photo to change</p>
            </div>

            {/* Tap photo area to re-upload */}
            <button
              onClick={triggerFileInput}
              className="absolute inset-0 z-35"
              aria-label="Change photo"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transition overlay */}
      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 z-50 bg-black"
          />
        )}
      </AnimatePresence>
    </div>
  );
}
