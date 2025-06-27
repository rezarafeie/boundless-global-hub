
export interface Notification {
  id: number;
  title: string;
  message: string;
  color: string;
  link?: string;
  notification_type: 'banner' | 'floating' | 'popup';
  is_active: boolean;
  priority: number;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationInsert {
  title: string;
  message: string;
  color: string;
  link?: string;
  notification_type: 'banner' | 'floating' | 'popup';
  is_active?: boolean;
  priority?: number;
  start_date?: string;
  end_date?: string;
}
