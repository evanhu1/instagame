import { useState, useEffect, useCallback, useRef } from 'react';

interface UseTypewriterOptions {
  text: string;
  speed?: number;
  randomize?: boolean;
  minSpeed?: number;
  maxSpeed?: number;
  enabled?: boolean;
}

interface UseTypewriterReturn {
  displayedText: string;
  isComplete: boolean;
  skip: () => void;
  reset: () => void;
}

export function useTypewriter({
  text,
  speed = 40,
  randomize = true,
  minSpeed = 30,
  maxSpeed = 50,
  enabled = true,
}: UseTypewriterOptions): UseTypewriterReturn {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const indexRef = useRef(0);

  const clearCurrentTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const skip = useCallback(() => {
    clearCurrentTimeout();
    setDisplayedText(text);
    setIsComplete(true);
    indexRef.current = text.length;
  }, [text, clearCurrentTimeout]);

  const reset = useCallback(() => {
    clearCurrentTimeout();
    setDisplayedText('');
    setIsComplete(false);
    indexRef.current = 0;
  }, [clearCurrentTimeout]);

  useEffect(() => {
    if (!enabled) {
      setDisplayedText(text);
      setIsComplete(true);
      return;
    }

    // Reset when text changes
    reset();

    const typeNextChar = () => {
      if (indexRef.current < text.length) {
        const nextIndex = indexRef.current + 1;
        setDisplayedText(text.slice(0, nextIndex));
        indexRef.current = nextIndex;

        const delay = randomize
          ? Math.random() * (maxSpeed - minSpeed) + minSpeed
          : speed;

        timeoutRef.current = setTimeout(typeNextChar, delay);
      } else {
        setIsComplete(true);
      }
    };

    // Start typing immediately (no initial delay)
    typeNextChar();

    return () => {
      clearCurrentTimeout();
    };
  }, [text, speed, randomize, minSpeed, maxSpeed, enabled, reset, clearCurrentTimeout]);

  return {
    displayedText,
    isComplete,
    skip,
    reset,
  };
}
