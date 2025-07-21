import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Key, Calendar, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface License {
  license_id: string;
  course_id: string;
  course_title: string;
  license_key: string;
  license_data: any;
  license_status: string;
  created_at: string;
  expires_at: string;
  activated_at: string;
  enrollment_id: string;
}

interface UserLicensesProps {
  userId: number;
  userPhone: string;
}

export function UserLicenses({ userId, userPhone }: UserLicensesProps) {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLicenses();
  }, [userPhone]);

  const fetchLicenses = async () => {
    try {
      const { data, error } = await supabase.rpc('get_user_licenses_by_phone', {
        user_phone: userPhone
      });

      if (error) throw error;
      setLicenses(data || []);
    } catch (error) {
      console.error('Error fetching licenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLicenseStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return <Badge variant="default" className="text-xs">فعال</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="text-xs">در انتظار</Badge>;
      case 'expired':
        return <Badge variant="destructive" className="text-xs">منقضی شده</Badge>;
      case 'revoked':
        return <Badge variant="outline" className="text-xs">لغو شده</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'نامشخص';
    return new Date(dateString).toLocaleDateString('fa-IR');
  };

  const getLicenseTypeInfo = (licenseData: any) => {
    if (licenseData?.type === 'spotplayer') {
      return {
        type: 'پلیر رفیعی',
        icon: '🎬',
        color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      };
    }
    return {
      type: 'لایسنس آکادمی',
      icon: '🎓',
      color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    };
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div dir="rtl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <Key className="w-4 h-4 sm:w-5 sm:h-5" />
            لایسنس‌ها و کلیدهای دسترسی ({licenses.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {licenses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              هیچ لایسنسی برای این کاربر یافت نشد.
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-0">
              {/* Mobile Card View */}
              <div className="block sm:hidden space-y-4">
                {licenses.map((license) => {
                  const typeInfo = getLicenseTypeInfo(license.license_data);
                  return (
                    <Card key={license.license_id} className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{license.course_title}</p>
                            <p className="text-xs text-muted-foreground">
                              {typeInfo.icon} {typeInfo.type}
                            </p>
                          </div>
                          {getLicenseStatusBadge(license.license_status)}
                        </div>
                        
                        <div className="space-y-2">
                          <div>
                            <label className="text-xs font-medium text-muted-foreground">کلید لایسنس</label>
                            <p className="font-mono text-xs break-all bg-muted p-2 rounded">
                              {license.license_key}
                            </p>
                            {license.license_data?.license_url && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="mt-1 h-auto p-0 text-xs"
                                onClick={() => window.open(license.license_data.license_url, '_blank')}
                              >
                                <ExternalLink className="w-3 h-3 ml-1" />
                                مشاهده لایسنس
                              </Button>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <label className="font-medium text-muted-foreground">تاریخ ایجاد</label>
                              <p>{formatDate(license.created_at)}</p>
                            </div>
                            <div>
                              <label className="font-medium text-muted-foreground">انقضا</label>
                              <p>{license.expires_at ? formatDate(license.expires_at) : 'هرگز'}</p>
                            </div>
                          </div>
                          
                          {license.license_data?.license_id && (
                            <Badge variant="outline" className="text-xs">
                              شناسه: {license.license_data.license_id}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>

              {/* Desktop Table View */}
              <div className="hidden sm:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">دوره</TableHead>
                      <TableHead className="text-right">نوع لایسنس</TableHead>
                      <TableHead className="text-right">کلید لایسنس</TableHead>
                      <TableHead className="text-right">وضعیت</TableHead>
                      <TableHead className="text-right">تاریخ ایجاد</TableHead>
                      <TableHead className="text-right">انقضا</TableHead>
                      <TableHead className="text-right">عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {licenses.map((license) => {
                      const typeInfo = getLicenseTypeInfo(license.license_data);
                      return (
                        <TableRow key={license.license_id}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">{license.course_title}</p>
                              <p className="text-xs text-muted-foreground">
                                {typeInfo.icon} {typeInfo.type}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`text-xs ${typeInfo.color}`}>
                              {typeInfo.type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-[200px]">
                              <p className="font-mono text-xs break-all">
                                {license.license_key}
                              </p>
                              {license.license_data?.license_url && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="mt-1 h-auto p-0 text-xs"
                                  onClick={() => window.open(license.license_data.license_url, '_blank')}
                                >
                                  <ExternalLink className="w-3 h-3 ml-1" />
                                  مشاهده لایسنس
                                </Button>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {getLicenseStatusBadge(license.license_status)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                              <span className="text-sm">{formatDate(license.created_at)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {license.expires_at ? formatDate(license.expires_at) : 'هرگز'}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {license.license_data?.license_id && (
                                <Badge variant="outline" className="text-xs">
                                  شناسه: {license.license_data.license_id}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}