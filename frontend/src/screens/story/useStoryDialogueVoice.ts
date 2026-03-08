import { useEffect, useEffectEvent, useRef } from 'react';
import { API_BASE_URL, resolveAssetUrl } from '@/api/trpcClient';

interface UseStoryDialogueVoiceOptions {
  turnKey: string;
  text: string;
  speakerName?: string | null;
  characterId?: number | null;
  enabled: boolean;
}

export function useStoryDialogueVoice({
  turnKey,
  text,
  speakerName,
  characterId,
  enabled,
}: UseStoryDialogueVoiceOptions) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blockedAudioRef = useRef<HTMLAudioElement | null>(null);
  const playedTurnKeyRef = useRef<string | null>(null);

  const stopPlayback = useEffectEvent(() => {
    blockedAudioRef.current = null;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
  });

  const tryResumeBlockedPlayback = useEffectEvent(async () => {
    const audio = blockedAudioRef.current;

    if (!audio) {
      return;
    }

    try {
      await audio.play();
      blockedAudioRef.current = null;
    } catch {
      // Wait for the next user gesture.
    }
  });

  useEffect(() => {
    const handleResume = () => {
      void tryResumeBlockedPlayback();
    };

    window.addEventListener('pointerdown', handleResume);
    window.addEventListener('keydown', handleResume);

    return () => {
      window.removeEventListener('pointerdown', handleResume);
      window.removeEventListener('keydown', handleResume);
    };
  }, [tryResumeBlockedPlayback]);

  useEffect(() => {
    if (!enabled || !text.trim()) {
      stopPlayback();
      return;
    }

    if (playedTurnKeyRef.current === turnKey) {
      return;
    }

    const abortController = new AbortController();
    playedTurnKeyRef.current = turnKey;

    stopPlayback();

    void (async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/voice/dialogue`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text,
            speakerName,
            characterId,
          }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          playedTurnKeyRef.current = null;
          return;
        }

        const payload = await response.json();
        const audioUrl = resolveAssetUrl(payload.audioUrl);

        if (!audioUrl || abortController.signal.aborted) {
          if (!abortController.signal.aborted) {
            playedTurnKeyRef.current = null;
          }
          return;
        }

        const audio = new Audio(audioUrl);
        audio.preload = 'auto';
        audioRef.current = audio;

        try {
          await audio.play();
        } catch (error) {
          if (error instanceof DOMException && error.name === 'NotAllowedError') {
            blockedAudioRef.current = audio;
            return;
          }

          audioRef.current = null;
          playedTurnKeyRef.current = null;
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }

        playedTurnKeyRef.current = null;
      }
    })();

    return () => {
      abortController.abort();
      stopPlayback();
    };
  }, [characterId, enabled, speakerName, stopPlayback, text, turnKey]);

  useEffect(() => () => stopPlayback(), [stopPlayback]);
}
