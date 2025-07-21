import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CreditCard, ExternalLink, Calendar, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Enrollment {
  id: string;
  course_id: string;
  created_at: string;
  payment_status: string;
  payment_amount: number;
  payment_method: string;
  zarinpal_ref_id: string;
  zarinpal_authority: string;
  course_title?: string;
  course_price?: number;
}

interface UserEnrollmentsProps {
  userId: number;
}

export function UserEnrollments({ userId }: UserEnrollmentsProps) {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEnrollments();
  }, [userId]);

  const fetchEnrollments = async () => {
    try {
      // First get the user's phone number
      const { data: userData } = await supabase
        .from('chat_users')
        .select('phone')
        .eq('id', userId)
        .single();

      if (!userData) return;

      // Then get enrollments by phone
      const { data: enrollmentData, error } = await supabase
        .from('enrollments')
        .select(`
          id,
          course_id,
          created_at,
          payment_status,
          payment_amount,
          payment_method,
          zarinpal_ref_id,
          zarinpal_authority,
          courses (
            title,
            price
          )
        `)
        .eq('phone', userData.phone)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedData = enrollmentData?.map(item => ({
        ...item,
        course_title: item.courses?.title,
        course_price: item.courses?.price
      })) || [];

      setEnrollments(formattedData);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'success':
        return <Badge variant="default">Paid</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR');
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price);
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
          <CreditCard className="w-5 h-5" />
          Course Enrollments ({enrollments.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {enrollments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No enrollments found for this user.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course</TableHead>
                <TableHead>Enrollment Date</TableHead>
                <TableHead>Payment Amount</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Transaction ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enrollments.map((enrollment) => (
                <TableRow key={enrollment.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{enrollment.course_title || 'Unknown Course'}</p>
                      <p className="text-sm text-muted-foreground">
                        Course Price: {formatPrice(enrollment.course_price || 0)} تومان
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      {formatDate(enrollment.created_at)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      {formatPrice(enrollment.payment_amount)} تومان
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {enrollment.payment_method || 'N/A'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {getPaymentStatusBadge(enrollment.payment_status)}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {enrollment.zarinpal_ref_id ? (
                        <p>Ref: {enrollment.zarinpal_ref_id}</p>
                      ) : (
                        <p className="text-muted-foreground">N/A</p>
                      )}
                      {enrollment.zarinpal_authority && (
                        <p className="text-xs text-muted-foreground">
                          Auth: {enrollment.zarinpal_authority.slice(0, 10)}...
                        </p>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}