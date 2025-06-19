
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { announcementsService, chatService, liveService } from '@/lib/supabase';
import type { Announcement, ChatMessage, LiveSettings } from '@/types/supabase';

export const useAnnouncements = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial fetch
    const fetchAnnouncements = async () => {
      try {
        const data = await announcementsService.getAll();
        setAnnouncements(data);
      } catch (error) {
        console.error('Error fetching announcements:', error);
        setAnnouncements([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();

    // Real-time subscription
    const channel = supabase
      .channel('announcements_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'announcements' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setAnnouncements(prev => [payload.new as Announcement, ...prev]);
          } else if (payload.eventType === 'DELETE') {
            setAnnouncements(prev => prev.filter(a => a.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            setAnnouncements(prev => prev.map(a => 
              a.id === payload.new.id ? payload.new as Announcement : a
            ));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { announcements, loading };
};

export const useChatMessages = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial fetch
    const fetchMessages = async () => {
      try {
        const data = await chatService.getMessages();
        setMessages(data);
      } catch (error) {
        console.error('Error fetching messages:', error);
        setMessages([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Real-time subscription
    const channel = supabase
      .channel('chat_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'chat_messages' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setMessages(prev => [...prev, payload.new as ChatMessage]);
          } else if (payload.eventType === 'DELETE') {
            setMessages(prev => prev.filter(m => m.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            setMessages(prev => prev.map(m => 
              m.id === payload.new.id ? payload.new as ChatMessage : m
            ));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { messages, loading };
};

export const useLiveSettings = () => {
  const [liveSettings, setLiveSettings] = useState<LiveSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial fetch
    const fetchLiveSettings = async () => {
      try {
        const data = await liveService.getSettings();
        setLiveSettings(data);
      } catch (error) {
        console.error('Error fetching live settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLiveSettings();

    // Real-time subscription
    const channel = supabase
      .channel('live_settings_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'live_settings' },
        (payload) => {
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            setLiveSettings(payload.new as LiveSettings);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { liveSettings, loading };
};
