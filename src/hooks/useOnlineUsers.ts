
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface OnlineUser {
  id: string;
  name: string;
  presence_ref: string;
}

export const useOnlineUsers = () => {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);

  useEffect(() => {
    const channel = supabase.channel('online_users');

    channel
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
        const users = Object.keys(newState).map(key => {
          const presence = newState[key][0];
          return {
            id: key,
            name: presence?.display_name || presence?.user_name || presence?.name || 'کاربر ناشناس',
            presence_ref: presence?.presence_ref || ''
          };
        });
        setOnlineUsers(users);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { onlineUsers };
};
