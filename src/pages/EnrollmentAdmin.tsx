
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Percent } from 'lucide-react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import CourseManagement from '@/components/Admin/CourseManagement';
import PaginatedEnrollmentsTable from '@/components/Admin/PaginatedEnrollmentsTable';
import EmailSettings from '@/components/Admin/EmailSettings';
import EmailTemplateManager from '@/components/Admin/EmailTemplateManager';
import NotificationManagementSection from '@/components/Admin/NotificationManagementSection';
import AnalyticsReports from '@/components/Admin/AnalyticsReports';
import PendingApprovalPayments from '@/components/Admin/PendingApprovalPayments';
import { LeadManagement } from '@/components/Admin/LeadManagement';
import { SalesAgentCourseManager } from '@/components/Admin/SalesAgentCourseManager';
import DiscountManagement from '@/components/Admin/DiscountManagement';

export default function EnrollmentAdmin() {
  const [activeTab, setActiveTab] = useState("enrollments");
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);

  return (
    <div dir="rtl" className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">مدیریت ثبت‌نام‌ها</h1>
        <div className="flex gap-2">
          <Button
            onClick={() => setIsDiscountModalOpen(true)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Percent className="w-4 h-4" />
            مدیریت تخفیف‌ها
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="enrollments">ثبت‌نام‌ها</TabsTrigger>
          <TabsTrigger value="courses">دوره‌ها</TabsTrigger>
          <TabsTrigger value="leads">مدیریت لیدها</TabsTrigger>
          <TabsTrigger value="sales-agents">نمایندگان فروش</TabsTrigger>
          <TabsTrigger value="pending">تأیید پرداخت</TabsTrigger>
          <TabsTrigger value="analytics">آمار</TabsTrigger>
          <TabsTrigger value="settings">تنظیمات</TabsTrigger>
        </TabsList>

        <TabsContent value="enrollments">
          <PaginatedEnrollmentsTable />
        </TabsContent>

        <TabsContent value="courses">
          <CourseManagement />
        </TabsContent>

        <TabsContent value="leads">
          <LeadManagement />
        </TabsContent>

        <TabsContent value="sales-agents">
          <SalesAgentCourseManager />
        </TabsContent>

        <TabsContent value="pending">
          <PendingApprovalPayments />
        </TabsContent>

        <TabsContent value="analytics">
          <AnalyticsReports />
        </TabsContent>

        <TabsContent value="settings">
          <div className="space-y-6">
            <EmailSettings />
            <EmailTemplateManager />
            <NotificationManagementSection />
            {isDiscountModalOpen && (
              <DiscountManagement onClose={() => setIsDiscountModalOpen(false)} />
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
