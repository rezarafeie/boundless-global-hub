import { useRef, useCallback } from 'react';

interface UseDoubleTapOptions {
  onDoubleTap: () => void;
  delay?: number;
}

export const useDoubleTap = ({ onDoubleTap, delay = 300 }: UseDoubleTapOptions) => {
  const tapCount = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleTap = useCallback(() => {
    tapCount.current += 1;

    if (tapCount.current === 1) {
      // First tap - start timer
      timeoutRef.current = setTimeout(() => {
        tapCount.current = 0;
      }, delay);
    } else if (tapCount.current === 2) {
      // Second tap - execute double tap
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      tapCount.current = 0;
      onDoubleTap();
    }
  }, [onDoubleTap, delay]);

  return handleTap;
};