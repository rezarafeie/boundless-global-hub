import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Users } from 'lucide-react';
import TestManagement from '@/components/Admin/TestManagement';
import TestEnrollmentManagement from '@/components/Admin/TestEnrollmentManagement';

const EnrollAdminTests: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center gap-3">
            <FileText className="w-8 h-8" />
            مدیریت آزمون‌ها
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="enrollments" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="enrollments" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                ثبت‌نام‌های آزمون
              </TabsTrigger>
              <TabsTrigger value="tests" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                مدیریت آزمون‌ها
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="enrollments" className="space-y-4">
              <TestEnrollmentManagement />
            </TabsContent>
            
            <TabsContent value="tests" className="space-y-4">
              <TestManagement />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnrollAdminTests;