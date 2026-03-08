import { motion } from 'framer-motion';

interface StoryBackdropProps {
  imageUrl: string | null;
}

const fallbackBackground =
  'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)';
const vignetteOverlay =
  'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.7) 100%)';

export function StoryBackdrop({ imageUrl }: StoryBackdropProps) {
  return (
    <>
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.04, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute inset-[-5%]"
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt=""
              aria-hidden="true"
              className="h-full w-full object-cover"
              style={{ filter: 'brightness(0.3) saturate(0.7) blur(2px)' }}
            />
          ) : (
            <div
              className="h-full w-full"
              style={{ background: fallbackBackground }}
            />
          )}
        </motion.div>
      </div>

      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: vignetteOverlay }}
      />
    </>
  );
}
