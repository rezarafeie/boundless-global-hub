import React from "react";
import AppLayout from "@/components/Layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Settings, MessageCircle, LogOut, User, Trophy, BookOpen } from "lucide-react";

const AppProfile = () => {
  const user = {
    name: "کاربر آکادمی",
    email: "user@example.com",
    phone: "09123456789",
    memberSince: "۱۴۰۲",
    totalCourses: 3,
    completedCourses: 1,
    certificates: 2
  };

  const menuItems = [
    { icon: User, label: "ویرایش پروفایل", action: () => {} },
    { icon: Settings, label: "تنظیمات", action: () => {} },
    { icon: MessageCircle, label: "پشتیبانی", action: () => {} },
    { icon: LogOut, label: "خروج", action: () => {}, variant: "destructive" }
  ];

  return (
    <AppLayout title="پروفایل کاربری">
      <div className="p-4 space-y-6">
        {/* User Info */}
        <Card>
          <CardContent className="p-6 text-center">
            <Avatar className="h-20 w-20 mx-auto mb-4">
              <AvatarFallback className="text-2xl">{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <h2 className="text-xl font-bold mb-1">{user.name}</h2>
            <p className="text-muted-foreground text-sm mb-1">{user.email}</p>
            <Badge variant="secondary">عضو از {user.memberSince}</Badge>
          </CardContent>
        </Card>

        {/* Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy size={20} />
              آمار یادگیری
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">{user.totalCourses}</div>
                <div className="text-sm text-muted-foreground">دوره</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{user.completedCourses}</div>
                <div className="text-sm text-muted-foreground">تکمیل شده</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{user.certificates}</div>
                <div className="text-sm text-muted-foreground">گواهینامه</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Menu Items */}
        <div className="space-y-2">
          {menuItems.map((item, index) => (
            <Card key={index} className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={item.action}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <item.icon size={20} className={item.variant === "destructive" ? "text-destructive" : "text-muted-foreground"} />
                  <span className={`font-medium ${item.variant === "destructive" ? "text-destructive" : ""}`}>
                    {item.label}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default AppProfile;