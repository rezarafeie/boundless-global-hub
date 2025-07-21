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
        return <Badge variant="default">Active</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'expired':
        return <Badge variant="destructive">Expired</Badge>;
      case 'revoked':
        return <Badge variant="outline">Revoked</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fa-IR');
  };

  const getLicenseTypeInfo = (licenseData: any) => {
    if (licenseData?.type === 'spotplayer') {
      return {
        type: 'Rafiei Player',
        icon: '🎬',
        color: 'bg-blue-100 text-blue-800'
      };
    }
    return {
      type: 'Academy License',
      icon: '🎓',
      color: 'bg-green-100 text-green-800'
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="w-5 h-5" />
          Licenses & Access Keys ({licenses.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {licenses.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No licenses found for this user.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course</TableHead>
                <TableHead>License Type</TableHead>
                <TableHead>License Key</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created Date</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {licenses.map((license) => {
                const typeInfo = getLicenseTypeInfo(license.license_data);
                return (
                  <TableRow key={license.license_id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{license.course_title}</p>
                        <p className="text-sm text-muted-foreground">
                          {typeInfo.icon} {typeInfo.type}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={typeInfo.color}>
                        {typeInfo.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[200px]">
                        <p className="font-mono text-sm break-all">
                          {license.license_key}
                        </p>
                        {license.license_data?.license_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-1 h-auto p-0 text-xs"
                            onClick={() => window.open(license.license_data.license_url, '_blank')}
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            View License
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getLicenseStatusBadge(license.license_status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        {formatDate(license.created_at)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {license.expires_at ? formatDate(license.expires_at) : 'Never'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {license.license_data?.license_id && (
                          <Badge variant="outline" className="text-xs">
                            ID: {license.license_data.license_id}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}