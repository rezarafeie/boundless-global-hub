
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Users, Lock, Sparkles } from 'lucide-react';
import type { ChatMessage } from '@/types/supabase';

interface ChatPreviewProps {
  messages: ChatMessage[];
  onRegisterClick: () => void;
}

const ChatPreview: React.FC<ChatPreviewProps> = ({ messages, onRegisterClick }) => {
  const previewMessages = messages.slice(-3);

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 border-slate-200 dark:border-slate-700 shadow-xl">
      <CardHeader className="border-b border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50">
        <CardTitle className="flex items-center gap-3 text-slate-800 dark:text-white">
          <div className="relative">
            <MessageCircle className="w-6 h-6 text-amber-600" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          </div>
          <span>پیش‌نمایش چت گروهی</span>
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 ml-auto">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
            فعال
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="relative p-6">
        <div className="space-y-3 mb-6">
          {previewMessages.length === 0 ? (
            <div className="text-center py-12">
              <Sparkles className="w-16 h-16 mx-auto text-amber-400 mb-4" />
              <p className="text-slate-600 dark:text-slate-400 text-lg font-medium">
                گفتگوهای جذاب در انتظار شماست!
              </p>
            </div>
          ) : (
            previewMessages.map((message, index) => (
              <div key={message.id} className="relative">
                <div className="flex justify-start">
                  <div className="max-w-[80%] bg-white dark:bg-slate-700 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm filter blur-[2px] opacity-60">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-slate-700 dark:text-slate-300">
                        {message.sender_name}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {message.message.length > 50 ? message.message.substring(0, 50) + '...' : message.message}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Clean overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/60 to-transparent dark:from-slate-900/95 dark:via-slate-900/60 flex items-center justify-center">
          <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-sm mx-4">
            <div className="relative mb-6">
              <Lock className="w-12 h-12 mx-auto text-amber-600" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full animate-pulse"></div>
            </div>
            
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-3">
              به چت گروهی بپیوندید
            </h3>
            
            <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
              برای مشاهده و شرکت در گفتگوهای جذاب اعضای بدون مرز
            </p>
            
            <Button 
              onClick={onRegisterClick}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 mb-3"
            >
              <Users className="w-4 h-4 mr-2" />
              ثبت‌نام و عضویت
            </Button>
            
            <p className="text-xs text-slate-500 dark:text-slate-400">
              تایید سریع • عضویت رایگان
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChatPreview;
