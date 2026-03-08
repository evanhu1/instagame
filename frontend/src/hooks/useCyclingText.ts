import { useState, useEffect } from 'react';

interface UseCyclingTextOptions {
  texts: string[];
  interval?: number;
  enabled?: boolean;
}

export function useCyclingText({
  texts,
  interval = 3000,
  enabled = true,
}: UseCyclingTextOptions): string {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!enabled || texts.length === 0) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % texts.length);
    }, interval);

    return () => clearInterval(timer);
  }, [texts, interval, enabled]);

  return texts[currentIndex] || '';
}
