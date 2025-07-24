
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, FileText, Users, UserPlus, UserCheck, Eye, Database, Download, RotateCcw, Trash2 } from 'lucide-react';

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
  importLogId?: string;
}

interface BackupData {
  enrollments: any[];
  import_logs: any[];
}

interface CSVRow {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  entry_date?: string;
  payment_method?: string;
  payment_price?: string;
}

export function DataImportSection() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importHistory, setImportHistory] = useState<any[]>([]);
  const [previewData, setPreviewData] = useState<CSVRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

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
          phone: values[headers.indexOf('phone')] || '',
          entry_date: headers.includes('entry_date') ? values[headers.indexOf('entry_date')] || '' : undefined,
          payment_method: headers.includes('payment_method') ? values[headers.indexOf('payment_method')] || '' : undefined,
          payment_price: headers.includes('payment_price') ? values[headers.indexOf('payment_price')] || '' : undefined
        };
        
        // Basic validation - allow null email/phone
        if (row.first_name && row.last_name) {
          // Set empty strings to null for database compatibility
          if (!row.email || !row.email.trim()) row.email = '';
          if (!row.phone || !row.phone.trim()) row.phone = '';
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
        // Check if enrollment already exists - handle null email/phone
        let existingQuery = supabase
          .from('enrollments')
          .select('id')
          .eq('course_id', courseId);
        
        // Build OR condition only for non-empty values
        const conditions = [];
        if (row.email && row.email.trim()) conditions.push(`email.eq.${row.email.trim()}`);
        if (row.phone && row.phone.trim()) conditions.push(`phone.eq.${row.phone.trim()}`);
        
        if (conditions.length > 0) {
          existingQuery = existingQuery.or(conditions.join(','));
        } else {
          // If no email or phone, skip duplicate check
          existingQuery = existingQuery.limit(0);
        }
        
        const { data: existingEnrollment, error: enrollmentCheckError } = await existingQuery.maybeSingle();

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
        
        // Parse entry date if provided, otherwise use current date
        let createdAt = new Date().toISOString();
        if (row.entry_date && row.entry_date.trim()) {
          try {
            // Support multiple date formats including 2024-02-28 08:22
            const dateStr = row.entry_date.trim();
            let parsedDate: Date;
            
            if (dateStr.includes(' ')) {
              // Handle YYYY-MM-DD HH:MM format
              const [datePart, timePart] = dateStr.split(' ');
              if (datePart.includes('-') && datePart.split('-')[0].length === 4) {
                // YYYY-MM-DD format with time
                const [year, month, day] = datePart.split('-');
                const [hour, minute] = timePart.split(':');
                parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
              } else {
                parsedDate = new Date(dateStr);
              }
            } else if (dateStr.includes('/')) {
              // Handle DD/MM/YYYY format
              const [day, month, year] = dateStr.split('/');
              parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            } else if (dateStr.includes('-') && dateStr.length === 10) {
              // Handle YYYY-MM-DD or DD-MM-YYYY format
              if (dateStr.indexOf('-') === 4) {
                // YYYY-MM-DD format
                parsedDate = new Date(dateStr);
              } else {
                // DD-MM-YYYY format
                const [day, month, year] = dateStr.split('-');
                parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
              }
            } else {
              parsedDate = new Date(dateStr);
            }
            
            if (!isNaN(parsedDate.getTime())) {
              createdAt = parsedDate.toISOString();
            }
          } catch (error) {
            console.warn(`Invalid date format for ${row.email}: ${row.entry_date}, using current date`);
          }
        }

        // Determine payment method
        let paymentMethod = 'manual_import';
        if (row.payment_method && row.payment_method.trim().toLowerCase() === 'manual') {
          paymentMethod = 'کارت به کارت';
        } else if (row.payment_method && row.payment_method.trim().toLowerCase() === 'zarinpal') {
          paymentMethod = 'zarinpal';
        }

        // Determine payment amount
        let paymentAmount = course.price;
        if (row.payment_price && row.payment_price.trim()) {
          const customPrice = parseFloat(row.payment_price.replace(/[,\s]/g, ''));
          if (!isNaN(customPrice) && customPrice > 0) {
            paymentAmount = customPrice;
          }
        }
        
        const { error: enrollmentError } = await supabase
          .from('enrollments')
          .insert({
            course_id: courseId,
            full_name: fullName,
            email: row.email,
            phone: row.phone,
            payment_status: 'completed',
            payment_amount: paymentAmount,
            payment_method: paymentMethod,
            country_code: '+98',
            created_at: createdAt
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

  const handleFileUpload = async (file: File | null) => {
    setCsvFile(file);
    setPreviewData([]);
    setShowPreview(false);
    
    if (!file) return;
    
    setIsProcessing(true);
    try {
      const csvText = await file.text();
      const parsedData = parseCSV(csvText);
      setPreviewData(parsedData);
      setShowPreview(true);
      toast.success(`${parsedData.length} ردیف داده پردازش شد`);
    } catch (error: any) {
      toast.error(`خطا در پردازش فایل: ${error.message}`);
      setCsvFile(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFinalImport = async () => {
    if (!selectedCourse || previewData.length === 0) {
      toast.error('لطفاً دوره را انتخاب کنید');
      return;
    }

    setIsImporting(true);

    try {
      console.log(`Importing ${previewData.length} rows for course ${selectedCourse}`);

      // Process import
      const result = await processImport(previewData, selectedCourse);

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
      setPreviewData([]);
      setShowPreview(false);
      
      // Refresh import history
      fetchImportHistory();

    } catch (error: any) {
      console.error('Import error:', error);
      toast.error(`خطا در وارد کردن داده‌ها: ${error.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  const handleBackupData = async () => {
    try {
      const { data: enrollments, error: enrollError } = await supabase
        .from('enrollments')
        .select('*')
        .order('created_at', { ascending: false });

      const { data: importLogs, error: logsError } = await supabase
        .from('import_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (enrollError || logsError) {
        throw new Error('خطا در دریافت داده‌ها');
      }

      const backupData = {
        enrollments: enrollments || [],
        import_logs: importLogs || [],
        backup_date: new Date().toISOString(),
        total_enrollments: enrollments?.length || 0,
        total_import_logs: importLogs?.length || 0
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `enrollments_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`پشتیبان‌گیری انجام شد - ${enrollments?.length || 0} ثبت‌نام`);
    } catch (error: any) {
      toast.error(`خطا در پشتیبان‌گیری: ${error.message}`);
    }
  };

  const handleRestoreLastImport = async () => {
    if (importHistory.length === 0) {
      toast.error('هیچ واردات قبلی یافت نشد');
      return;
    }

    const lastImport = importHistory[0];
    const confirmRestore = window.confirm(
      `آیا مطمئن هستید که می‌خواهید آخرین واردات را برگردانید؟\n` +
      `این عمل ${lastImport.new_users_created} ثبت‌نام جدید از دوره "${lastImport.courses?.title}" را حذف خواهد کرد.`
    );

    if (!confirmRestore) return;

    try {
      // Delete enrollments created in the last import
      const { error } = await supabase
        .from('enrollments')
        .delete()
        .eq('course_id', lastImport.course_id)
        .gte('created_at', lastImport.created_at);

      if (error) throw error;

      // Delete the import log
      await supabase
        .from('import_logs')
        .delete()
        .eq('id', lastImport.id);

      toast.success(`آخرین واردات برگردانده شد - ${lastImport.new_users_created} ثبت‌نام حذف شد`);
      fetchImportHistory();
    } catch (error: any) {
      toast.error(`خطا در برگرداندن واردات: ${error.message}`);
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
              onChange={(e) => handleFileUpload(e.target.files?.[0] || null)}
              className="cursor-pointer"
              disabled={isProcessing}
            />
            <p className="text-sm text-muted-foreground">
              فرمت مورد انتظار: first_name, last_name, email, phone, entry_date (اختیاری), payment_method (اختیاری), payment_price (اختیاری)
              <br />
              فرمت تاریخ: YYYY-MM-DD HH:MM (مثل 2024-02-28 08:22) یا YYYY-MM-DD یا DD/MM/YYYY یا DD-MM-YYYY
              <br />
              روش پرداخت: manual (کارت به کارت) یا zarinpal - قیمت پرداخت: مبلغ به تومان
            </p>
            {isProcessing && (
              <p className="text-sm text-blue-600">در حال پردازش فایل...</p>
            )}
          </div>

          {/* Course Selection - Only show when we have preview data */}
          {showPreview && (
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
          )}
        </CardContent>
      </Card>

      {/* Preview Data */}
      {showPreview && previewData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              پیش‌نمایش داده‌ها ({previewData.length} ردیف)
            </CardTitle>
            <CardDescription>
              داده‌های پردازش شده را بررسی کنید و سپس دکمه وارد کردن را فشار دهید
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>نام</TableHead>
                    <TableHead>نام خانوادگی</TableHead>
                    <TableHead>ایمیل</TableHead>
                    <TableHead>تلفن</TableHead>
                    <TableHead>تاریخ ثبت‌نام</TableHead>
                    <TableHead>روش پرداخت</TableHead>
                    <TableHead>مبلغ (تومان)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell>{row.first_name}</TableCell>
                      <TableCell>{row.last_name}</TableCell>
                      <TableCell>{row.email}</TableCell>
                      <TableCell>{row.phone}</TableCell>
                      <TableCell>{row.entry_date || 'الان'}</TableCell>
                      <TableCell>
                        {row.payment_method === 'manual' ? 'کارت به کارت' : 
                         row.payment_method === 'zarinpal' ? 'zarinpal' : 
                         'ریخط‌واردات دستی'}
                      </TableCell>
                      <TableCell>
                        {row.payment_price ? 
                          parseFloat(row.payment_price.replace(/[,\s]/g, '')).toLocaleString() : 
                          courses.find(c => c.id === selectedCourse)?.price?.toLocaleString() || 'مشخص نشده'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {/* Final Import Button */}
            <div className="mt-4">
              <Button
                onClick={handleFinalImport}
                disabled={!selectedCourse || isImporting}
                className="w-full"
                size="lg"
              >
                <Database className="h-4 w-4 mr-2" />
                {isImporting ? 'در حال وارد کردن...' : `وارد کردن ${previewData.length} ردیف به دیتابیس`}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Backup & Restore Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            مدیریت پشتیبان‌گیری و بازگردانی
          </CardTitle>
          <CardDescription>
            پشتیبان‌گیری از کل داده‌ها یا بازگردانی آخرین واردات
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={handleBackupData}
              variant="outline"
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              پشتیبان‌گیری کامل
            </Button>
            
            <Button
              onClick={handleRestoreLastImport}
              variant="destructive"
              className="flex-1"
              disabled={importHistory.length === 0}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              برگرداندن آخرین واردات
            </Button>
          </div>
          
          {importHistory.length > 0 && (
            <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
              <strong>آخرین واردات:</strong> {importHistory[0].courses?.title} - 
              {importHistory[0].new_users_created} ثبت‌نام جدید در {new Date(importHistory[0].created_at).toLocaleDateString('fa-IR')}
            </div>
          )}
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
