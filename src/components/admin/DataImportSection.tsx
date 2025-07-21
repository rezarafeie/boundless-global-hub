
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
  price: number;
}

interface ImportResult {
  totalRows: number;
  newEnrollmentsCreated: number;
  existingEnrollments: number;
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
        .select('id, title, slug, price')
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
        if (row.email && row.phone && row.first_name && row.last_name) {
          rows.push(row);
        }
      }
    }

    return rows;
  };

  const processImport = async (csvRows: CSVRow[], courseId: string): Promise<ImportResult> => {
    let newEnrollmentsCreated = 0;
    let existingEnrollments = 0;

    // Get course details for payment amount
    const course = courses.find(c => c.id === courseId);
    if (!course) {
      throw new Error('دوره انتخاب شده یافت نشد');
    }

    for (const row of csvRows) {
      try {
        // Check if enrollment already exists for this email/phone and course
        const { data: existingEnrollment, error: enrollmentCheckError } = await supabase
          .from('enrollments')
          .select('id')
          .eq('course_id', courseId)
          .or(`email.eq.${row.email},phone.eq.${row.phone}`)
          .maybeSingle();

        if (enrollmentCheckError) {
          console.error(`Error checking enrollment for ${row.email}:`, enrollmentCheckError);
          continue;
        }

        if (existingEnrollment) {
          // Enrollment already exists
          existingEnrollments++;
          console.log(`Enrollment already exists for ${row.email}`);
          continue;
        }

        // Create new enrollment
        const fullName = `${row.first_name} ${row.last_name}`.trim();
        
        const { error: enrollmentError } = await supabase
          .from('enrollments')
          .insert({
            course_id: courseId,
            full_name: fullName,
            email: row.email,
            phone: row.phone,
            payment_status: 'completed',
            payment_amount: course.price,
            payment_method: 'manual_import',
            country_code: '+98'
          });

        if (enrollmentError) {
          console.error(`Error creating enrollment for ${row.email}:`, enrollmentError);
          continue;
        }

        newEnrollmentsCreated++;
        console.log(`Successfully created enrollment for ${row.email}`);

      } catch (error) {
        console.error(`Error processing user ${row.email}:`, error);
        // Continue with next user instead of failing entire import
      }
    }

    return {
      totalRows: csvRows.length,
      newEnrollmentsCreated,
      existingEnrollments
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

      console.log(`Processing ${csvRows.length} rows for course ${selectedCourse}`);

      // Process import
      const result = await processImport(csvRows, selectedCourse);

      // Log import
      await supabase
        .from('import_logs')
        .insert({
          uploaded_by: 'admin',
          course_id: selectedCourse,
          total_rows: result.totalRows,
          new_users_created: result.newEnrollmentsCreated,
          existing_users_updated: result.existingEnrollments
        });

      // Show success message
      toast.success(
        `✅ ${result.totalRows} کاربر پردازش شد، ${result.newEnrollmentsCreated} ثبت‌نام جدید ایجاد شد، ${result.existingEnrollments} ثبت‌نام موجود بود`
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
            فایل CSV خود را بارگذاری کنید و دوره مورد نظر را برای ثبت‌نام انتخاب کنید
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
                    {course.title} - {course.price.toLocaleString()} تومان
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
            {isImporting ? 'در حال پردازش...' : 'وارد کردن کاربران و ثبت‌نام در دوره'}
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
