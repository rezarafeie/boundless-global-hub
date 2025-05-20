
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://frmjqexnjgkhydgjnwew.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZybWpxZXhuamdraHlkZ2pud2V3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyNTkzMDcsImV4cCI6MjA2MjgzNTMwN30.0LfozVYrG5TTqic-Gw5Tap31ETKgvzjayUtw74zRqJI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
