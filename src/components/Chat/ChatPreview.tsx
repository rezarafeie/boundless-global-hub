
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Users, Lock } from 'lucide-react';
import type { ChatMessage } from '@/types/supabase';

interface ChatPreviewProps {
  messages: ChatMessage[];
  onRegisterClick: () => void;
}

const ChatPreview: React.FC<ChatPreviewProps> = ({ messages, onRegisterClick }) => {
  // Show only the last 5 messages for preview
  const previewMessages = messages.slice(-5);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'moderator': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin': return 'مدیر';
      case 'moderator': return 'مدیر بحث';
      default: return 'عضو';
    }
  };

  return (
    <Card className="relative overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          پیش‌نمایش چت گروهی
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            <Users className="w-3 h-3 mr-1" />
            آنلاین
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="relative">
        {/* Blurred Messages */}
        <div className="space-y-3 relative">
          {previewMessages.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 mx-auto text-slate-400 mb-4" />
              <p className="text-slate-500">گفتگوهای جذاب در انتظار شماست!</p>
            </div>
          ) : (
            previewMessages.map((message) => (
              <div key={message.id} className="flex justify-start">
                <div className="max-w-[80%] filter blur-sm">
                  <div className="bg-slate-100 dark:bg-slate-800 rounded-lg rounded-bl-none px-4 py-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{message.sender_name}</span>
                      <Badge className={getRoleColor(message.sender_role)}>
                        {getRoleText(message.sender_role)}
                      </Badge>
                    </div>
                    <p className="text-sm">{message.message}</p>
                    <span className="text-xs opacity-75 mt-1 block">
                      {new Date(message.created_at).toLocaleString('fa-IR')}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Overlay with call to action */}
        <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-white/50 to-transparent dark:from-slate-900/90 dark:via-slate-900/50 flex items-center justify-center">
          <div className="text-center p-6 bg-white dark:bg-slate-800 rounded-lg shadow-lg border max-w-sm">
            <Lock className="w-12 h-12 mx-auto text-blue-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2">به چت گروهی بپیوندید</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
              برای مشاهده و شرکت در گفتگوهای جذاب، ابتدا ثبت‌نام کنید
            </p>
            <Button 
              onClick={onRegisterClick}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Users className="w-4 h-4 mr-2" />
              ثبت‌نام و عضویت
            </Button>
            <p className="text-xs text-slate-500 mt-2">
              تایید سریع توسط مدیر • رایگان
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChatPreview;
