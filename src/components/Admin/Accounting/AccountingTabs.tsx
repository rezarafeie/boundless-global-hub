import React, { useState, Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, CreditCard, Users, BarChart3, Package, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

// Lazy load components
const AccountingInvoices = React.lazy(() => import('./AccountingInvoices'));
const AccountingInstallments = React.lazy(() => import('./AccountingInstallments'));
const AccountingCommissions = React.lazy(() => import('./AccountingCommissions'));
const AccountingReports = React.lazy(() => import('./AccountingReports'));
const AccountingProducts = React.lazy(() => import('./AccountingProducts'));

const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    <span className="mr-2 text-muted-foreground">در حال بارگذاری...</span>
  </div>
);

export const AccountingTabs: React.FC = () => {
  const [activeTab, setActiveTab] = useState('invoices');
  const [isRunningAnalysis, setIsRunningAnalysis] = useState(false);

  const handleRunAIAnalysis = async () => {
    setIsRunningAnalysis(true);
    try {
      const response = await supabase.functions.invoke('ai-weekly-analysis');
      
      if (response.error) {
        throw new Error(response.error.message);
      }

      toast.success('تحلیل هفتگی با موفقیت انجام شد');
      // Refresh reports tab
      if (activeTab === 'reports') {
        setActiveTab('invoices');
        setTimeout(() => setActiveTab('reports'), 100);
      }
    } catch (error: any) {
      console.error('AI Analysis error:', error);
      toast.error(`خطا در تحلیل: ${error.message}`);
    } finally {
      setIsRunningAnalysis(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">حسابداری</h1>
        <Button 
          variant="outline" 
          onClick={handleRunAIAnalysis}
          disabled={isRunningAnalysis}
        >
          <Brain className="h-4 w-4 mr-2" />
          {isRunningAnalysis ? 'در حال تحلیل...' : 'تحلیل هوشمند هفتگی'}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 h-auto">
          <TabsTrigger value="invoices" className="flex items-center gap-2 py-3">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">فاکتورها</span>
          </TabsTrigger>
          <TabsTrigger value="installments" className="flex items-center gap-2 py-3">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">اقساط</span>
          </TabsTrigger>
          <TabsTrigger value="commissions" className="flex items-center gap-2 py-3">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">کمیسیون‌ها</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2 py-3">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">گزارشات</span>
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2 py-3">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">محصولات</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="mt-4">
          <Suspense fallback={<LoadingSpinner />}>
            <AccountingInvoices />
          </Suspense>
        </TabsContent>

        <TabsContent value="installments" className="mt-4">
          <Suspense fallback={<LoadingSpinner />}>
            <AccountingInstallments />
          </Suspense>
        </TabsContent>

        <TabsContent value="commissions" className="mt-4">
          <Suspense fallback={<LoadingSpinner />}>
            <AccountingCommissions />
          </Suspense>
        </TabsContent>

        <TabsContent value="reports" className="mt-4">
          <Suspense fallback={<LoadingSpinner />}>
            <AccountingReports />
          </Suspense>
        </TabsContent>

        <TabsContent value="products" className="mt-4">
          <Suspense fallback={<LoadingSpinner />}>
            <AccountingProducts />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AccountingTabs;
