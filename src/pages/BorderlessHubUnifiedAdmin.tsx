
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/Layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowRight, Users, MessageSquare, Settings, Shield } from 'lucide-react';
import UnifiedUserManagement from '@/components/Admin/UnifiedUserManagement';
import UnifiedChatManagement from '@/components/Admin/UnifiedChatManagement';

const BorderlessHubUnifiedAdmin = () => {
  const navigate = useNavigate();

  const handleBackToHub = () => {
    navigate('/hub');
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950 pt-20">
        <div className="bg-white dark:bg-slate-800 shadow-sm border-b">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleBackToHub}
                  className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  <ArrowRight className="w-5 h-5" />
                  <span>برگشت به هاب</span>
                </button>
              </div>
              <div className="flex items-center gap-3">
                <Settings className="w-8 h-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
                    پنل مدیریت یکپارچه
                  </h1>
                  <p className="text-slate-600 dark:text-slate-300 text-sm">
                    مدیریت کاربران، پشتیبانی و گفتگوها
                  </p>
                </div>
              </div>
              <div></div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <Tabs defaultValue="users" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                کاربران و نقش‌های پشتیبانی
              </TabsTrigger>
              <TabsTrigger value="chats" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                مدیریت چت‌ها و تاپیک‌ها
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users">
              <UnifiedUserManagement />
            </TabsContent>

            <TabsContent value="chats">
              <UnifiedChatManagement />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
};

export default BorderlessHubUnifiedAdmin;
