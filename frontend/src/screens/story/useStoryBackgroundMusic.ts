import { useEffect, useEffectEvent, useRef, useState } from 'react';

interface UseStoryBackgroundMusicOptions {
  backgroundMusicUrl: string | null;
  musicEnabled: boolean;
}

export function useStoryBackgroundMusic({
  backgroundMusicUrl,
  musicEnabled,
}: UseStoryBackgroundMusicOptions) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

  const tryPlayBackgroundMusic = useEffectEvent(() => {
    const audio = audioRef.current;

    if (!audio || !backgroundMusicUrl || !musicEnabled) {
      return;
    }

    const playback = audio.play();

    if (typeof playback?.then !== 'function') {
      setAutoplayBlocked(false);
      return;
    }

    playback
      .then(() => {
        setAutoplayBlocked(false);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'NotAllowedError') {
          setAutoplayBlocked(true);
          return;
        }

        console.error('Background music playback failed.', error);
      });
  });

  useEffect(() => {
    const audio = audioRef.current ?? new Audio();
    audioRef.current = audio;

    if (!backgroundMusicUrl) {
      setAutoplayBlocked(false);
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      return;
    }

    audio.src = backgroundMusicUrl;
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = 0.4;
    audio.muted = !musicEnabled;

    if (musicEnabled) {
      tryPlayBackgroundMusic();
      return;
    }

    audio.pause();
  }, [backgroundMusicUrl, musicEnabled]);

  useEffect(() => {
    if (!autoplayBlocked || !backgroundMusicUrl || !musicEnabled) {
      return;
    }

    const resumePlayback = () => {
      tryPlayBackgroundMusic();
    };

    window.addEventListener('pointerdown', resumePlayback, { once: true });
    window.addEventListener('keydown', resumePlayback, { once: true });

    return () => {
      window.removeEventListener('pointerdown', resumePlayback);
      window.removeEventListener('keydown', resumePlayback);
    };
  }, [autoplayBlocked, backgroundMusicUrl, musicEnabled]);

  useEffect(() => {
    return () => {
      const audio = audioRef.current;

      if (!audio) {
        return;
      }

      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    };
  }, []);

  return {
    autoplayBlocked,
    isMusicAvailable: Boolean(backgroundMusicUrl),
  };
}
