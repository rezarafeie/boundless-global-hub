import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Percent, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const BlackFridaySettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [discountPercentage, setDiscountPercentage] = useState<number>(20);

  // Fetch Black Friday settings
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['black-friday-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('black_friday_settings')
        .select('*')
        .eq('id', 1)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch courses
  const { data: courses } = useQuery({
    queryKey: ['courses-for-bf'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title, slug')
        .eq('is_active', true)
        .order('title');
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch discounts
  const { data: discounts, isLoading: discountsLoading } = useQuery({
    queryKey: ['black-friday-discounts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('black_friday_discounts')
        .select('*, courses(title)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Update settings mutation
  const updateSettings = useMutation({
    mutationFn: async (updates: any) => {
      const { error } = await supabase
        .from('black_friday_settings')
        .update(updates)
        .eq('id', 1);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['black-friday-settings'] });
      toast({
        title: 'تنظیمات بلک فرایدی بروزرسانی شد',
        description: 'تغییرات با موفقیت ذخیره شد',
      });
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'خطا در بروزرسانی',
        description: 'لطفا دوباره تلاش کنید',
      });
    },
  });

  // Add discount mutation
  const addDiscount = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('black_friday_discounts')
        .insert({
          course_id: selectedCourseId,
          discount_percentage: discountPercentage,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['black-friday-discounts'] });
      setSelectedCourseId('');
      setDiscountPercentage(20);
      toast({
        title: 'تخفیف اضافه شد',
        description: 'تخفیف دوره با موفقیت ثبت شد',
      });
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'خطا در افزودن تخفیف',
        description: 'این دوره قبلا اضافه شده یا خطایی رخ داده است',
      });
    },
  });

  // Remove discount mutation
  const removeDiscount = useMutation({
    mutationFn: async (discountId: string) => {
      const { error } = await supabase
        .from('black_friday_discounts')
        .delete()
        .eq('id', discountId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['black-friday-discounts'] });
      toast({
        title: 'تخفیف حذف شد',
        description: 'تخفیف دوره با موفقیت حذف شد',
      });
    },
  });

  if (settingsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>تنظیمات کمپین بلک فرایدی</CardTitle>
          <CardDescription>
            مدیریت کمپین بلک فرایدی و تخفیف‌های ویژه
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable/Disable Switch */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>فعال‌سازی بلک فرایدی</Label>
              <p className="text-sm text-muted-foreground">
                با فعال‌سازی، تم سایت به سیاه و طلایی تغییر می‌کند
              </p>
            </div>
            <Switch
              checked={settings?.is_enabled || false}
              onCheckedChange={(checked) => updateSettings.mutate({ is_enabled: checked })}
            />
          </div>

          {/* Start Date */}
          <div className="space-y-2">
            <Label htmlFor="start_date">تاریخ شروع</Label>
            <Input
              id="start_date"
              type="datetime-local"
              value={settings?.start_date ? new Date(settings.start_date).toISOString().slice(0, 16) : ''}
              onChange={(e) => updateSettings.mutate({ start_date: new Date(e.target.value).toISOString() })}
            />
          </div>

          {/* End Date */}
          <div className="space-y-2">
            <Label htmlFor="end_date">تاریخ پایان</Label>
            <Input
              id="end_date"
              type="datetime-local"
              value={settings?.end_date ? new Date(settings.end_date).toISOString().slice(0, 16) : ''}
              onChange={(e) => updateSettings.mutate({ end_date: new Date(e.target.value).toISOString() })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Add Course Discount */}
      <Card>
        <CardHeader>
          <CardTitle>افزودن تخفیف دوره</CardTitle>
          <CardDescription>
            انتخاب دوره و درصد تخفیف برای بلک فرایدی
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>انتخاب دوره</Label>
            <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
              <SelectTrigger>
                <SelectValue placeholder="دوره را انتخاب کنید" />
              </SelectTrigger>
              <SelectContent>
                {courses?.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="discount">درصد تخفیف (%)</Label>
            <div className="flex gap-2">
              <Input
                id="discount"
                type="number"
                min="1"
                max="100"
                value={discountPercentage}
                onChange={(e) => setDiscountPercentage(Number(e.target.value))}
                className="flex-1"
              />
              <Button
                onClick={() => addDiscount.mutate()}
                disabled={!selectedCourseId || addDiscount.isPending}
              >
                {addDiscount.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Percent className="h-4 w-4 ml-2" />
                    افزودن
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Discounts */}
      <Card>
        <CardHeader>
          <CardTitle>تخفیف‌های فعال</CardTitle>
          <CardDescription>
            لیست دوره‌های دارای تخفیف بلک فرایدی
          </CardDescription>
        </CardHeader>
        <CardContent>
          {discountsLoading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : discounts && discounts.length > 0 ? (
            <div className="space-y-2">
              {discounts.map((discount: any) => (
                <div
                  key={discount.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 text-primary px-3 py-1 rounded-md font-bold">
                      {discount.discount_percentage}%
                    </div>
                    <span className="font-medium">{discount.courses?.title}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeDiscount.mutate(discount.id)}
                    disabled={removeDiscount.isPending}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">
              هنوز هیچ تخفیفی تعریف نشده است
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BlackFridaySettings;