import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, FileText, Users, UserPlus, UserCheck } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  slug: string;
}

interface ImportResult {
  totalRows: number;
  newUsersCreated: number;
  existingUsersUpdated: number;
  enrollmentsAdded: number;
}

interface CSVRow {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}

export function DataImportSection() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importHistory, setImportHistory] = useState<any[]>([]);

  // Fetch courses on component mount
  React.useEffect(() => {
    fetchCourses();
    fetchImportHistory();
  }, []);

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title, slug')
        .eq('is_active', true)
        .order('title');

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.error('خطا در بارگیری دوره‌ها');
    }
  };

  const fetchImportHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('import_logs')
        .select(`
          *,
          courses(title)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setImportHistory(data || []);
    } catch (error) {
      console.error('Error fetching import history:', error);
    }
  };

  const parseCSV = (csvText: string): CSVRow[] => {
    const lines = csvText.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    // Validate headers
    const requiredHeaders = ['first_name', 'last_name', 'email', 'phone'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    
    if (missingHeaders.length > 0) {
      throw new Error(`فیلدهای مورد نیاز یافت نشد: ${missingHeaders.join(', ')}`);
    }

    const rows: CSVRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      if (values.length >= 4) {
        const row: CSVRow = {
          first_name: values[headers.indexOf('first_name')] || '',
          last_name: values[headers.indexOf('last_name')] || '',
          email: values[headers.indexOf('email')] || '',
          phone: values[headers.indexOf('phone')] || ''
        };
        
        // Basic validation
        if (row.email && row.phone) {
          rows.push(row);
        }
      }
    }

    return rows;
  };

  const processImport = async (csvRows: CSVRow[], courseId: string): Promise<ImportResult> => {
    let newUsersCreated = 0;
    let existingUsersUpdated = 0;
    let enrollmentsAdded = 0;

    for (const row of csvRows) {
      try {
        // Check if user exists by email or phone
        const { data: existingUsers, error: userCheckError } = await supabase
          .from('academy_users')
          .select('id, email, phone')
          .or(`email.eq.${row.email},phone.eq.${row.phone}`);

        if (userCheckError) throw userCheckError;

        let userId: string;

        if (existingUsers && existingUsers.length > 0) {
          // User exists
          userId = existingUsers[0].id;
          existingUsersUpdated++;
        } else {
          // Create new user
          const { data: newUser, error: createUserError } = await supabase
            .from('academy_users')
            .insert({
              first_name: row.first_name,
              last_name: row.last_name,
              email: row.email,
              phone: row.phone,
              role: 'student'
            })
            .select('id')
            .single();

          if (createUserError) throw createUserError;
          userId = newUser.id;
          newUsersCreated++;
        }

        // Check if already enrolled
        const { data: existingEnrollment, error: enrollmentCheckError } = await supabase
          .from('academy_enrollments')
          .select('id')
          .eq('user_id', userId)
          .eq('course_id', courseId)
          .single();

        if (enrollmentCheckError && enrollmentCheckError.code !== 'PGRST116') {
          throw enrollmentCheckError;
        }

        if (!existingEnrollment) {
          // Create enrollment
          const { error: enrollError } = await supabase
            .from('academy_enrollments')
            .insert({
              user_id: userId,
              course_id: courseId,
              status: 'enrolled'
            });

          if (enrollError) throw enrollError;
          enrollmentsAdded++;
        }

      } catch (error) {
        console.error(`Error processing user ${row.email}:`, error);
        // Continue with next user instead of failing entire import
      }
    }

    return {
      totalRows: csvRows.length,
      newUsersCreated,
      existingUsersUpdated,
      enrollmentsAdded
    };
  };

  const handleImport = async () => {
    if (!csvFile || !selectedCourse) {
      toast.error('لطفاً فایل CSV و دوره را انتخاب کنید');
      return;
    }

    setIsImporting(true);

    try {
      // Read CSV file
      const csvText = await csvFile.text();
      const csvRows = parseCSV(csvText);

      if (csvRows.length === 0) {
        throw new Error('هیچ داده معتبری در فایل یافت نشد');
      }

      // Process import
      const result = await processImport(csvRows, selectedCourse);

      // Log import
      await supabase
        .from('import_logs')
        .insert({
          uploaded_by: 'admin', // You might want to get actual admin ID
          course_id: selectedCourse,
          total_rows: result.totalRows,
          new_users_created: result.newUsersCreated,
          existing_users_updated: result.existingUsersUpdated
        });

      // Show success message
      toast.success(
        `✅ ${result.totalRows} کاربر پردازش شد، ${result.newUsersCreated} کاربر جدید ایجاد شد، ${result.enrollmentsAdded} ثبت‌نام انجام شد`
      );

      // Reset form
      setCsvFile(null);
      setSelectedCourse('');
      
      // Refresh import history
      fetchImportHistory();

    } catch (error: any) {
      console.error('Import error:', error);
      toast.error(`خطا در وارد کردن داده‌ها: ${error.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Import Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            وارد کردن کاربران از فایل CSV
          </CardTitle>
          <CardDescription>
            فایل CSV خود را بارگذاری کنید و دوره مورد نظر را برای اختصاص دسترسی انتخاب کنید
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="csv-file">فایل CSV</Label>
            <Input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
              className="cursor-pointer"
            />
            <p className="text-sm text-muted-foreground">
              فرمت مورد انتظار: first_name, last_name, email, phone
            </p>
          </div>

          {/* Course Selection */}
          <div className="space-y-2">
            <Label htmlFor="course-select">انتخاب دوره</Label>
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger>
                <SelectValue placeholder="دوره مورد نظر را انتخاب کنید" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Import Button */}
          <Button
            onClick={handleImport}
            disabled={!csvFile || !selectedCourse || isImporting}
            className="w-full"
          >
            {isImporting ? 'در حال پردازش...' : 'وارد کردن کاربران و اختصاص دسترسی'}
          </Button>
        </CardContent>
      </Card>

      <Separator />

      {/* Import History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            تاریخچه واردات
          </CardTitle>
        </CardHeader>
        <CardContent>
          {importHistory.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              هنوز هیچ واردات انجام نشده است
            </p>
          ) : (
            <div className="space-y-3">
              {importHistory.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="space-y-1">
                    <div className="font-medium">
                      {log.courses?.title || 'دوره نامشخص'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(log.created_at).toLocaleDateString('fa-IR')}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-blue-600" />
                      <span>{log.total_rows} کل</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <UserPlus className="h-4 w-4 text-green-600" />
                      <span>{log.new_users_created} جدید</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <UserCheck className="h-4 w-4 text-orange-600" />
                      <span>{log.existing_users_updated} موجود</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}