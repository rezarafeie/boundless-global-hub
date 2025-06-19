import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import MainLayout from '@/components/Layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Settings, Plus, Trash2, Pin, Send, Play, Save } from 'lucide-react';

const BorderlessHubAdmin = () => {
  const { translations } = useLanguage();
  
  // Form states
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    type: 'general',
    summary: '',
    fullText: '',
    mediaType: 'none',
    mediaContent: '',
    isPinned: false
  });

  const [chatMessage, setChatMessage] = useState('');
  const [liveStreamCode, setLiveStreamCode] = useState('');

  // Mock existing data
  const existingAnnouncements = [
    {
      id: 1,
      title: "شروع دوره جدید بدون مرز",
      type: "urgent",
      date: "۲۵ بهمن ۱۴۰۳",
      isPinned: true,
      views: 245
    },
    {
      id: 2,
      title: "بروزرسانی پلتفرم آموزشی",
      type: "technical",
      date: "۲۳ بهمن ۱۴۰۳",
      isPinned: false,
      views: 156
    }
  ];

  const recentChatMessages = [
    {
      id: 1,
      sender: "رضا رفیعی",
      message: "سلام دوستان عزیز!",
      time: "۱۴:۳۰",
      isPinned: true
    },
    {
      id: 2,
      sender: "علی محمدی",
      message: "ممنون از محتوای عالی",
      time: "۱۴:۳۲",
      isPinned: false
    }
  ];

  const handleAnnouncementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Publishing announcement:', announcementForm);
    // Reset form
    setAnnouncementForm({
      title: '',
      type: 'general',
      summary: '',
      fullText: '',
      mediaType: 'none',
      mediaContent: '',
      isPinned: false
    });
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Sending chat message:', chatMessage);
    setChatMessage('');
  };

  const handleLiveStreamUpdate = () => {
    console.log('Updating live stream:', liveStreamCode);
  };

  const deleteAnnouncement = (id: number) => {
    console.log('Deleting announcement:', id);
  };

  const togglePinAnnouncement = (id: number) => {
    console.log('Toggling pin for announcement:', id);
  };

  const deleteChatMessage = (id: number) => {
    console.log('Deleting chat message:', id);
  };

  const togglePinChatMessage = (id: number) => {
    console.log('Toggling pin for chat message:', id);
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950">
        {/* Header */}
        <div className="bg-white dark:bg-slate-800 shadow-sm border-b">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center gap-3">
              <Settings className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
                  مدیریت مرکز بدون مرز
                </h1>
                <p className="text-slate-600 dark:text-slate-300 text-sm">
                  پنل مدیریت اطلاعیه‌ها، چت گروهی و پخش زنده
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          <Tabs defaultValue="announcements" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="announcements" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                مدیریت اطلاعیه‌ها
              </TabsTrigger>
              <TabsTrigger value="chat" className="flex items-center gap-2">
                <Send className="w-4 h-4" />
                مدیریت چت
              </TabsTrigger>
              <TabsTrigger value="live" className="flex items-center gap-2">
                <Play className="w-4 h-4" />
                پخش زنده
              </TabsTrigger>
            </TabsList>

            {/* Announcements Management */}
            <TabsContent value="announcements" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Add New Announcement Form */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Plus className="w-5 h-5" />
                      اضافه کردن اطلاعیه جدید
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleAnnouncementSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="title">عنوان اطلاعیه</Label>
                        <Input
                          id="title"
                          value={announcementForm.title}
                          onChange={(e) => setAnnouncementForm({...announcementForm, title: e.target.value})}
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="type">نوع اطلاعیه</Label>
                        <Select 
                          value={announcementForm.type} 
                          onValueChange={(value) => setAnnouncementForm({...announcementForm, type: value})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="urgent">فوری</SelectItem>
                            <SelectItem value="general">عمومی</SelectItem>
                            <SelectItem value="technical">فنی</SelectItem>
                            <SelectItem value="educational">آموزشی</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="summary">خلاصه اطلاعیه</Label>
                        <Textarea
                          id="summary"
                          value={announcementForm.summary}
                          onChange={(e) => setAnnouncementForm({...announcementForm, summary: e.target.value})}
                          rows={2}
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="fullText">متن کامل اطلاعیه</Label>
                        <Textarea
                          id="fullText"
                          value={announcementForm.fullText}
                          onChange={(e) => setAnnouncementForm({...announcementForm, fullText: e.target.value})}
                          rows={4}
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="mediaType">نوع مدیا</Label>
                        <Select 
                          value={announcementForm.mediaType} 
                          onValueChange={(value) => setAnnouncementForm({...announcementForm, mediaType: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="انتخاب کنید..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">بدون مدیا</SelectItem>
                            <SelectItem value="image">تصویر</SelectItem>
                            <SelectItem value="audio">صوت</SelectItem>
                            <SelectItem value="video">ویدیو</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {announcementForm.mediaType && announcementForm.mediaType !== 'none' && (
                        <div>
                          <Label htmlFor="mediaContent">
                            کد HTML مدیا ({announcementForm.mediaType === 'image' ? '<img>' : 
                                           announcementForm.mediaType === 'audio' ? '<audio>' : 
                                           '<iframe>'})
                          </Label>
                          <Textarea
                            id="mediaContent"
                            value={announcementForm.mediaContent}
                            onChange={(e) => setAnnouncementForm({...announcementForm, mediaContent: e.target.value})}
                            rows={3}
                            placeholder={
                              announcementForm.mediaType === 'image' ? '<img src="..." alt="..." class="w-full rounded-lg" />' :
                              announcementForm.mediaType === 'audio' ? '<audio controls class="w-full"><source src="..." type="audio/mpeg"></audio>' :
                              '<iframe src="..." width="100%" height="300" frameborder="0" allowfullscreen></iframe>'
                            }
                          />
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="isPinned"
                          checked={announcementForm.isPinned}
                          onChange={(e) => setAnnouncementForm({...announcementForm, isPinned: e.target.checked})}
                        />
                        <Label htmlFor="isPinned">سنجاق کردن در بالای صفحه</Label>
                      </div>

                      <Button type="submit" className="w-full">
                        <Plus className="w-4 h-4 mr-2" />
                        انتشار اطلاعیه
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                {/* Existing Announcements */}
                <Card>
                  <CardHeader>
                    <CardTitle>اطلاعیه‌های موجود</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {existingAnnouncements.map((announcement) => (
                        <div key={announcement.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{announcement.title}</h4>
                              {announcement.isPinned && <Pin className="w-4 h-4 text-yellow-600" />}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className="text-xs">{announcement.type}</Badge>
                              <span className="text-xs text-slate-500">{announcement.date}</span>
                              <span className="text-xs text-slate-500">{announcement.views} بازدید</span>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => togglePinAnnouncement(announcement.id)}
                            >
                              <Pin className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => deleteAnnouncement(announcement.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Chat Management */}
            <TabsContent value="chat" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Send New Message */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Send className="w-5 h-5" />
                      ارسال پیام جدید
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleChatSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="chatMessage">متن پیام</Label>
                        <Textarea
                          id="chatMessage"
                          value={chatMessage}
                          onChange={(e) => setChatMessage(e.target.value)}
                          rows={4}
                          placeholder="پیام خود را اینجا بنویسید..."
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full">
                        <Send className="w-4 h-4 mr-2" />
                        ارسال پیام
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                {/* Recent Messages */}
                <Card>
                  <CardHeader>
                    <CardTitle>پیام‌های اخیر</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {recentChatMessages.map((message) => (
                        <div key={message.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{message.sender}</span>
                              {message.isPinned && <Pin className="w-4 h-4 text-yellow-600" />}
                            </div>
                            <p className="text-sm text-slate-600 mt-1">{message.message}</p>
                            <span className="text-xs text-slate-500">{message.time}</span>
                          </div>
                          <div className="flex gap-1">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => togglePinChatMessage(message.id)}
                            >
                              <Pin className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => deleteChatMessage(message.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Live Stream Management */}
            <TabsContent value="live" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Play className="w-5 h-5" />
                    مدیریت پخش زنده
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="liveStreamCode">کد iframe پخش زنده</Label>
                    <Textarea
                      id="liveStreamCode"
                      value={liveStreamCode}
                      onChange={(e) => setLiveStreamCode(e.target.value)}
                      rows={6}
                      placeholder='<iframe src="https://your-stream-url.com" width="100%" height="400px" allowfullscreen></iframe>'
                    />
                  </div>
                  
                  <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">پیش‌نمایش:</h4>
                    {liveStreamCode ? (
                      <div className="border rounded-lg p-2">
                        <div dangerouslySetInnerHTML={{ __html: liveStreamCode }} />
                      </div>
                    ) : (
                      <p className="text-slate-500 text-sm">کد iframe را وارد کنید تا پیش‌نمایش نمایش داده شود</p>
                    )}
                  </div>

                  <Button onClick={handleLiveStreamUpdate} className="w-full">
                    <Save className="w-4 h-4 mr-2" />
                    ذخیره و بروزرسانی پخش زنده
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
};

export default BorderlessHubAdmin;
