
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { UserPlus, Eye, Clock, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Lead {
  enrollment_id: string;
  full_name: string;
  email: string;
  phone: string;
  course_title: string;
  payment_status: string;
  payment_amount: number;
  created_at: string;
  is_assigned: boolean;
  assigned_to_agent: string | null;
}

interface AssignedLead {
  assignment_id: number;
  enrollment_id: string;
  full_name: string;
  email: string;
  phone: string;
  course_title: string;
  payment_amount: number;
  assigned_at: string;
  status: string;
}

const LeadManagement: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [assignedLeads, setAssignedLeads] = useState<AssignedLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<string | null>(null);

  useEffect(() => {
    fetchLeads();
    fetchAssignedLeads();
  }, [user]);

  const fetchLeads = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase.rpc('get_user_courses_for_sales_agent', {
        agent_user_id: parseInt(user.id)
      });

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast({
        title: 'خطا',
        description: 'خطا در بارگذاری لیدها',
        variant: 'destructive',
      });
    }
  };

  const fetchAssignedLeads = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase.rpc('get_lead_assignments', {
        agent_user_id: parseInt(user.id)
      });

      if (error) throw error;
      setAssignedLeads(data || []);
    } catch (error) {
      console.error('Error fetching assigned leads:', error);
      toast({
        title: 'خطا',
        description: 'خطا در بارگذاری لیدهای اختصاص داده شده',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const assignLead = async (enrollmentId: string) => {
    if (!user) return;
    
    try {
      setAssigning(enrollmentId);
      
      const { data, error } = await supabase.rpc('assign_lead_to_agent', {
        p_enrollment_id: enrollmentId,
        p_agent_user_id: parseInt(user.id),
        p_assigned_by: parseInt(user.id)
      });

      if (error) throw error;
      
      if (data) {
        toast({
          title: 'موفق',
          description: 'لید با موفقیت اختصاص داده شد',
        });
        
        // Refresh both lists
        fetchLeads();
        fetchAssignedLeads();
      } else {
        toast({
          title: 'خطا',
          description: 'خطا در اختصاص لید',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error assigning lead:', error);
      toast({
        title: 'خطا',
        description: 'خطا در اختصاص لید',
        variant: 'destructive',
      });
    } finally {
      setAssigning(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR');
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price) + ' تومان';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Assigned Leads */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            لیدهای اختصاص داده شده
          </CardTitle>
        </CardHeader>
        <CardContent>
          {assignedLeads.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              هیچ لیدی اختصاص داده نشده است
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">نام</TableHead>
                    <TableHead className="text-right">ایمیل</TableHead>
                    <TableHead className="text-right">تلفن</TableHead>
                    <TableHead className="text-right">دوره</TableHead>
                    <TableHead className="text-right">مبلغ</TableHead>
                    <TableHead className="text-right">تاریخ اختصاص</TableHead>
                    <TableHead className="text-right">وضعیت</TableHead>
                    <TableHead className="text-center">عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignedLeads.map((lead) => (
                    <TableRow key={lead.assignment_id}>
                      <TableCell className="font-medium">{lead.full_name}</TableCell>
                      <TableCell>{lead.email}</TableCell>
                      <TableCell>{lead.phone}</TableCell>
                      <TableCell>{lead.course_title}</TableCell>
                      <TableCell>{formatPrice(lead.payment_amount)}</TableCell>
                      <TableCell>{formatDate(lead.assigned_at)}</TableCell>
                      <TableCell>
                        <Badge variant="default">{lead.status}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 ml-2" />
                          مشاهده
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Leads */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            لیدهای موجود
          </CardTitle>
        </CardHeader>
        <CardContent>
          {leads.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              هیچ لیدی موجود نیست
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">نام</TableHead>
                    <TableHead className="text-right">ایمیل</TableHead>
                    <TableHead className="text-right">تلفن</TableHead>
                    <TableHead className="text-right">دوره</TableHead>
                    <TableHead className="text-right">مبلغ</TableHead>
                    <TableHead className="text-right">تاریخ ثبت‌نام</TableHead>
                    <TableHead className="text-right">وضعیت</TableHead>
                    <TableHead className="text-center">عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead) => (
                    <TableRow key={lead.enrollment_id}>
                      <TableCell className="font-medium">{lead.full_name}</TableCell>
                      <TableCell>{lead.email}</TableCell>
                      <TableCell>{lead.phone}</TableCell>
                      <TableCell>{lead.course_title}</TableCell>
                      <TableCell>{formatPrice(lead.payment_amount)}</TableCell>
                      <TableCell>{formatDate(lead.created_at)}</TableCell>
                      <TableCell>
                        {lead.is_assigned ? (
                          <Badge variant="secondary">
                            اختصاص داده شده به {lead.assigned_to_agent}
                          </Badge>
                        ) : (
                          <Badge variant="outline">آماده اختصاص</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {!lead.is_assigned && (
                          <Button
                            onClick={() => assignLead(lead.enrollment_id)}
                            disabled={assigning === lead.enrollment_id}
                            size="sm"
                          >
                            {assigning === lead.enrollment_id ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                                در حال اختصاص...
                              </>
                            ) : (
                              <>
                                <UserPlus className="h-4 w-4 ml-2" />
                                اختصاص به من
                              </>
                            )}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LeadManagement;
