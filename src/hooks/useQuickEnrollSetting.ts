import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

let cached: boolean | null = null;
let pending: Promise<boolean> | null = null;

export const useQuickEnrollSetting = () => {
  const [enabled, setEnabled] = useState<boolean>(cached ?? false);
  const [loading, setLoading] = useState<boolean>(cached === null);

  useEffect(() => {
    if (cached !== null) {
      setEnabled(cached);
      setLoading(false);
      return;
    }
    if (!pending) {
      pending = supabase
        .from('admin_settings')
        .select('quick_enroll_enabled')
        .eq('id', 1)
        .maybeSingle()
        .then(({ data }) => {
          cached = !!(data as any)?.quick_enroll_enabled;
          return cached;
        });
    }
    pending.then((v) => {
      setEnabled(v);
      setLoading(false);
    });
  }, []);

  return { enabled, loading };
};
