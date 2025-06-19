
import { supabase } from '@/integrations/supabase/client';

export type RafieiMeetSettings = {
  id: number;
  is_active: boolean;
  title: string;
  description: string;
  meet_url: string;
  updated_at: string;
};

export const rafieiMeetService = {
  async getSettings(): Promise<RafieiMeetSettings | null> {
    const { data, error } = await supabase
      .from('rafiei_meet_settings')
      .select('*')
      .eq('id', 1)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data as RafieiMeetSettings | null;
  },

  async updateSettings(settings: Partial<RafieiMeetSettings>): Promise<RafieiMeetSettings> {
    const { data, error } = await supabase
      .from('rafiei_meet_settings')
      .update({ ...settings, updated_at: new Date().toISOString() })
      .eq('id', 1)
      .select()
      .single();
    
    if (error) throw error;
    return data as RafieiMeetSettings;
  }
};
