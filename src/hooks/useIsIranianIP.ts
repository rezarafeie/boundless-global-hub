import { useEffect, useState } from 'react';
import { IPDetectionService } from '@/lib/ipDetectionService';

export function useIsIranianIP() {
  const [isIranianIP, setIsIranianIP] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    IPDetectionService.isIranianIP()
      .then((res) => {
        if (mounted) setIsIranianIP(res);
      })
      .catch(() => {
        if (mounted) setIsIranianIP(null);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return isIranianIP;
}
