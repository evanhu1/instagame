import { motion } from 'framer-motion';
import { ArrowLeft, Music } from 'lucide-react';

interface StoryHeaderProps {
  title: string;
  summary: string;
  musicEnabled: boolean;
  isMusicAvailable: boolean;
  autoplayBlocked: boolean;
  onBack?: () => void;
  onToggleMusic: () => void;
}

export function StoryHeader({
  title,
  summary,
  musicEnabled,
  isMusicAvailable,
  autoplayBlocked,
  onBack,
  onToggleMusic,
}: StoryHeaderProps) {
  return (
    <>
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-3 py-1.5">
        <button
          onClick={onBack}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm transition-transform active:scale-95"
        >
          <ArrowLeft className="h-3.5 w-3.5 text-white/60" />
        </button>

        <motion.button
          type="button"
          onClick={onToggleMusic}
          disabled={!isMusicAvailable}
          animate={{
            opacity: musicEnabled && isMusicAvailable ? [0.45, 0.8, 0.45] : 0.45,
          }}
          transition={{
            duration: 2,
            repeat: musicEnabled && isMusicAvailable ? Infinity : 0,
            ease: 'easeInOut',
          }}
          className="rounded-full bg-black/40 p-1.5 backdrop-blur-sm transition disabled:opacity-40"
          title={
            !isMusicAvailable
              ? 'No background music for this scene'
              : musicEnabled
                ? 'Mute background music'
                : 'Play background music'
          }
          aria-label={
            !isMusicAvailable
              ? 'No background music available'
              : musicEnabled
                ? 'Mute background music'
                : 'Play background music'
          }
        >
          <Music
            className={`h-2.5 w-2.5 ${
              musicEnabled && !autoplayBlocked && isMusicAvailable
                ? 'text-amber-300'
                : 'text-white/50'
            }`}
          />
        </motion.button>
      </div>

      <div className="absolute top-9 left-3 right-3 z-20">
        <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 backdrop-blur-md">
          <p className="text-[11px] font-medium leading-tight text-amber-100/90">
            {title}
          </p>
          <p className="mt-1 text-[10px] leading-relaxed text-white/70">
            {summary}
          </p>
        </div>
      </div>
    </>
  );
}
