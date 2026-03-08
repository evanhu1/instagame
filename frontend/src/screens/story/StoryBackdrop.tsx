import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface StoryBackdropProps {
  backgroundKey: string;
  imageUrl: string | null;
  alt: string;
}

interface StableBackgroundState {
  key: string;
  url: string | null;
}

export function StoryBackdrop({
  backgroundKey,
  imageUrl,
  alt,
}: StoryBackdropProps) {
  const [stableBackground, setStableBackground] = useState<StableBackgroundState>({
    key: backgroundKey,
    url: imageUrl,
  });

  useEffect(() => {
    setStableBackground((currentValue) => {
      if (imageUrl) {
        if (
          currentValue.key === backgroundKey &&
          currentValue.url === imageUrl
        ) {
          return currentValue;
        }

        return {
          key: backgroundKey,
          url: imageUrl,
        };
      }

      if (currentValue.key !== backgroundKey) {
        return {
          key: backgroundKey,
          url: null,
        };
      }

      return currentValue;
    });
  }, [backgroundKey, imageUrl]);

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
          {stableBackground.url ? (
            <img
              key={`${stableBackground.key}:${stableBackground.url}`}
              src={stableBackground.url}
              alt={alt}
              className="h-full w-full object-cover"
              style={{ filter: 'brightness(0.3) saturate(0.7) blur(2px)' }}
            />
          ) : (
            <div
              className="h-full w-full"
              style={{
                background:
                  'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
              }}
            />
          )}
        </motion.div>
      </div>

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.7) 100%)',
        }}
      />
    </>
  );
}
