import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, FileText, Users, UserPlus, UserCheck, Eye, Database, Download, RotateCcw, Trash2, Play, Pause } from 'lucide-react';

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
  errors: number;
  processed: number;
  importLogId?: string;
}

interface ImportProgress {
  total: number;
  processed: number;
  created: number;
  existing: number;
  errors: number;
  currentUser: string;
  isRunning: boolean;
  canResume: boolean;
}

interface BackupData {
  enrollments: any[];
  import_logs: any[];
}

interface CSVRow {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  entry_date?: string | null;
  payment_method?: string | null;
  payment_price?: string | null;
}

interface PreviewAnalysis {
  totalRows: number;
  uniqueUsers: number;
  duplicatesInFile: number;
  existingUsers: number;
  newUsers: number;
  existingEnrollments: number;
  newEnrollments: number;
  duplicateEmails: string[];
  duplicatePhones: string[];
  conflicts: Array<{
    email?: string;
    phone?: string;
    reason: string;
  }>;
}

export function DataImportSection() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importHistory, setImportHistory] = useState<any[]>([]);
  const [previewData, setPreviewData] = useState<CSVRow[]>([]);
  const [previewAnalysis, setPreviewAnalysis] = useState<PreviewAnalysis | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);
  const [processedRows, setProcessedRows] = useState<Set<number>>(new Set());
  const [isPaused, setIsPaused] = useState(false);

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
          first_name: values[headers.indexOf('first_name')]?.trim() || null,
          last_name: values[headers.indexOf('last_name')]?.trim() || null,
          email: values[headers.indexOf('email')]?.trim() || null,
          phone: values[headers.indexOf('phone')]?.trim() || null,
          entry_date: headers.includes('entry_date') ? (values[headers.indexOf('entry_date')]?.trim() || null) : null,
          payment_method: headers.includes('payment_method') ? (values[headers.indexOf('payment_method')]?.trim() || null) : null,
          payment_price: headers.includes('payment_price') ? (values[headers.indexOf('payment_price')]?.trim() || null) : null
        };
        
        // Process all rows, even with empty first_name or last_name
        rows.push(row);
      }
    }

    return rows;
  };

  const processImport = async (csvRows: CSVRow[], courseId: string, startFromIndex: number = 0): Promise<ImportResult> => {
    let newEnrollmentsCreated = 0;
    let existingEnrollments = 0;
    let errors = 0;
    let processed = 0;

    // Get course details for payment amount
    const course = courses.find(c => c.id === courseId);
    if (!course) {
      throw new Error('دوره انتخاب شده یافت نشد');
    }

    // Process unique users only (remove duplicates within CSV)
    const uniqueUsers = new Map<string, { row: CSVRow; index: number }>();
    csvRows.forEach((row, index) => {
      const userKey = `${row.email?.trim().toLowerCase()}-${row.phone?.trim()}`;
      if (!uniqueUsers.has(userKey)) {
        uniqueUsers.set(userKey, { row, index });
      }
    });

    const uniqueUserArray = Array.from(uniqueUsers.values());

    // Initialize progress
    setImportProgress({
      total: uniqueUserArray.length,
      processed: 0,
      created: 0,
      existing: 0,
      errors: 0,
      currentUser: '',
      isRunning: true,
      canResume: false
    });

    for (let i = startFromIndex; i < uniqueUserArray.length; i++) {
      // Check if import is paused
      if (isPaused) {
        setImportProgress(prev => prev ? { ...prev, isRunning: false, canResume: true } : null);
        return {
          totalRows: uniqueUserArray.length,
          newEnrollmentsCreated,
          existingEnrollments,
          errors,
          processed
        };
      }

      const { row, index } = uniqueUserArray[i];
      
      // Skip if already processed
      if (processedRows.has(index)) {
        processed++;
        continue;
      }

      try {
        // Update progress
        setImportProgress(prev => prev ? {
          ...prev,
          processed: processed + 1,
          currentUser: `${row.first_name} ${row.last_name}`.trim()
        } : null);

        // First, check if user exists in chat_users table
        let existingUser = null;
        if ((row.email && row.email.trim()) || (row.phone && row.phone.trim())) {
          const conditions = [];
          if (row.email && row.email.trim()) conditions.push(`email.eq.${row.email.trim()}`);
          if (row.phone && row.phone.trim()) conditions.push(`phone.eq.${row.phone.trim()}`);
          
          if (conditions.length > 0) {
            const { data: userData } = await supabase
              .from('chat_users')
              .select('id, email, phone')
              .or(conditions.join(','))
              .maybeSingle();
            
            existingUser = userData;
          }
        }

        // Check if enrollment already exists for this course
        let existingEnrollmentQuery = supabase
          .from('enrollments')
          .select('id')
          .eq('course_id', courseId);
        
        const enrollmentConditions = [];
        if (row.email && row.email.trim()) enrollmentConditions.push(`email.eq.${row.email.trim()}`);
        if (row.phone && row.phone.trim()) enrollmentConditions.push(`phone.eq.${row.phone.trim()}`);
        
        if (enrollmentConditions.length > 0) {
          existingEnrollmentQuery = existingEnrollmentQuery.or(enrollmentConditions.join(','));
        } else {
          existingEnrollmentQuery = existingEnrollmentQuery.limit(0);
        }
        
        const { data: existingEnrollment } = await existingEnrollmentQuery.maybeSingle();

        if (existingEnrollment) {
          existingEnrollments++;
          setImportProgress(prev => prev ? { ...prev, existing: prev.existing + 1 } : null);
          setProcessedRows(prev => new Set([...prev, index]));
          processed++;
          console.log(`Enrollment already exists for ${row.email || row.phone}`);
          continue;
        }

        // Create or update user in chat_users if needed
        let chatUserId = existingUser?.id;
        
        if (!existingUser && ((row.email && row.email.trim()) || (row.phone && row.phone.trim()))) {
          // Parse entry date for user creation
          let userCreatedAt = new Date().toISOString();
          if (row.entry_date && row.entry_date.trim()) {
            try {
              const dateStr = row.entry_date.trim();
              let parsedDate: Date;
              
              if (dateStr.includes(' ')) {
                const [datePart, timePart] = dateStr.split(' ');
                if (datePart.includes('-') && datePart.split('-')[0].length === 4) {
                  const [year, month, day] = datePart.split('-');
                  const [hour, minute] = timePart.split(':');
                  parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
                } else {
                  parsedDate = new Date(dateStr);
                }
              } else if (dateStr.includes('/')) {
                const [day, month, year] = dateStr.split('/');
                parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
              } else if (dateStr.includes('-') && dateStr.length === 10) {
                if (dateStr.indexOf('-') === 4) {
                  parsedDate = new Date(dateStr);
                } else {
                  const [day, month, year] = dateStr.split('-');
                  parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                }
              } else {
                parsedDate = new Date(dateStr);
              }
              
              if (!isNaN(parsedDate.getTime())) {
                userCreatedAt = parsedDate.toISOString();
              }
            } catch (error) {
              console.warn(`Invalid date format for ${row.email}: ${row.entry_date}, using current date`);
            }
          }

          // Create new user in chat_users
          const { data: newUser, error: userError } = await supabase
            .from('chat_users')
            .insert({
              name: `${row.first_name || ''} ${row.last_name || ''}`.trim() || 'کاربر بدون نام',
              phone: row.phone || null,
              email: row.email || null,
              first_name: row.first_name || null,
              last_name: row.last_name || null,
              full_name: `${row.first_name || ''} ${row.last_name || ''}`.trim() || 'کاربر بدون نام',
              country_code: '+98',
              signup_source: 'enrollment',
              is_approved: true,
              role: 'user',
              created_at: userCreatedAt,
              updated_at: userCreatedAt
            })
            .select('id')
            .single();

          if (userError) {
            console.error(`Error creating user for ${row.email}:`, userError);
            errors++;
            setImportProgress(prev => prev ? { ...prev, errors: prev.errors + 1 } : null);
          } else {
            chatUserId = newUser.id;
          }
        }

        // Create enrollment
        const fullName = `${row.first_name || ''} ${row.last_name || ''}`.trim() || 'کاربر بدون نام';
        
        // Parse entry date for enrollment
        let createdAt = new Date().toISOString();
        if (row.entry_date?.trim()) {
          try {
            const dateStr = row.entry_date.trim();
            let parsedDate: Date;
            
            if (dateStr.includes(' ')) {
              const [datePart, timePart] = dateStr.split(' ');
              if (datePart.includes('-') && datePart.split('-')[0].length === 4) {
                const [year, month, day] = datePart.split('-');
                const [hour, minute] = timePart.split(':');
                parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
              } else {
                parsedDate = new Date(dateStr);
              }
            } else if (dateStr.includes('/')) {
              const [day, month, year] = dateStr.split('/');
              parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            } else if (dateStr.includes('-') && dateStr.length === 10) {
              if (dateStr.indexOf('-') === 4) {
                parsedDate = new Date(dateStr);
              } else {
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
        if (row.payment_method?.trim().toLowerCase() === 'manual') {
          paymentMethod = 'کارت به کارت';
        } else if (row.payment_method?.trim().toLowerCase() === 'zarinpal') {
          paymentMethod = 'zarinpal';
        }

        // Determine payment amount
        let paymentAmount = course.price;
        if (row.payment_price?.trim()) {
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
            email: row.email || null,
            phone: row.phone || null,
            payment_status: 'completed',
            payment_amount: paymentAmount,
            payment_method: paymentMethod,
            country_code: '+98',
            created_at: createdAt,
            updated_at: createdAt,
            chat_user_id: chatUserId
          });

        if (enrollmentError) {
          console.error(`Error creating enrollment for ${row.email}:`, enrollmentError);
          errors++;
          setImportProgress(prev => prev ? { ...prev, errors: prev.errors + 1 } : null);
          continue;
        }

        newEnrollmentsCreated++;
        setImportProgress(prev => prev ? { ...prev, created: prev.created + 1 } : null);
        setProcessedRows(prev => new Set([...prev, index]));
        processed++;
        console.log(`Successfully created enrollment for ${row.email || row.phone}`);

        // Add small delay to prevent overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 50));

      } catch (error) {
        console.error(`Error processing user ${row.email}:`, error);
        errors++;
        setImportProgress(prev => prev ? { ...prev, errors: prev.errors + 1 } : null);
      }
    }

    // Mark import as completed
    setImportProgress(prev => prev ? { ...prev, isRunning: false, canResume: false } : null);

    return {
      totalRows: uniqueUserArray.length,
      newEnrollmentsCreated,
      existingEnrollments,
      errors,
      processed
    };
  };

  const analyzeCSVData = async (csvRows: CSVRow[], courseId: string): Promise<PreviewAnalysis> => {
    const analysis: PreviewAnalysis = {
      totalRows: csvRows.length,
      uniqueUsers: 0,
      duplicatesInFile: 0,
      existingUsers: 0,
      newUsers: 0,
      existingEnrollments: 0,
      newEnrollments: 0,
      duplicateEmails: [],
      duplicatePhones: [],
      conflicts: []
    };

    // Check for duplicates within the CSV file
    const emailMap = new Map<string, number>();
    const phoneMap = new Map<string, number>();
    
    csvRows.forEach((row, index) => {
      if (row.email && row.email.trim()) {
        const email = row.email.trim().toLowerCase();
        emailMap.set(email, (emailMap.get(email) || 0) + 1);
      }
      if (row.phone && row.phone.trim()) {
        const phone = row.phone.trim();
        phoneMap.set(phone, (phoneMap.get(phone) || 0) + 1);
      }
    });

    // Find duplicates in file
    analysis.duplicateEmails = Array.from(emailMap.entries())
      .filter(([_, count]) => count > 1)
      .map(([email]) => email);
    
    analysis.duplicatePhones = Array.from(phoneMap.entries())
      .filter(([_, count]) => count > 1)
      .map(([phone]) => phone);

    analysis.duplicatesInFile = analysis.duplicateEmails.length + analysis.duplicatePhones.length;

    // Check against existing users in database
    const emails = csvRows.map(row => row.email?.trim().toLowerCase()).filter(Boolean);
    const phones = csvRows.map(row => row.phone?.trim()).filter(Boolean);

    let existingUsers = [];
    if (emails.length > 0 || phones.length > 0) {
      const { data: dbUsers } = await supabase
        .from('chat_users')
        .select('id, email, phone')
        .or(`email.in.(${emails.join(',')}),phone.in.(${phones.join(',')})`);
      
      existingUsers = dbUsers || [];
    }

    // Check existing enrollments for the selected course
    let existingEnrollments = [];
    if (emails.length > 0 || phones.length > 0) {
      const { data: dbEnrollments } = await supabase
        .from('enrollments')
        .select('email, phone')
        .eq('course_id', courseId)
        .or(`email.in.(${emails.join(',')}),phone.in.(${phones.join(',')})`);
      
      existingEnrollments = dbEnrollments || [];
    }

    // Analyze each row
    const processedUsers = new Set<string>();
    
    for (const row of csvRows) {
      const userKey = `${row.email?.trim().toLowerCase()}-${row.phone?.trim()}`;
      
      if (processedUsers.has(userKey)) {
        continue; // Skip duplicates within file
      }
      processedUsers.add(userKey);

      // Check if user exists in database
      const userExists = existingUsers.some(user => 
        (row.email && user.email?.toLowerCase() === row.email.trim().toLowerCase()) ||
        (row.phone && user.phone === row.phone.trim())
      );

      // Check if enrollment exists for this course
      const enrollmentExists = existingEnrollments.some(enrollment => 
        (row.email && enrollment.email?.toLowerCase() === row.email.trim().toLowerCase()) ||
        (row.phone && enrollment.phone === row.phone.trim())
      );

      if (userExists) {
        analysis.existingUsers++;
      } else {
        analysis.newUsers++;
      }

      if (enrollmentExists) {
        analysis.existingEnrollments++;
        analysis.conflicts.push({
          email: row.email,
          phone: row.phone,
          reason: 'ثبت‌نام برای این دوره از قبل وجود دارد'
        });
      } else {
        analysis.newEnrollments++;
      }
    }

    analysis.uniqueUsers = analysis.existingUsers + analysis.newUsers;

    return analysis;
  };

  const handleFileUpload = async (file: File | null) => {
    setCsvFile(file);
    setPreviewData([]);
    setPreviewAnalysis(null);
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

  const handleCourseSelection = async (courseId: string) => {
    setSelectedCourse(courseId);
    
    if (previewData.length > 0) {
      setIsProcessing(true);
      try {
        const analysis = await analyzeCSVData(previewData, courseId);
        setPreviewAnalysis(analysis);
      } catch (error: any) {
        toast.error(`خطا در تجزیه و تحلیل داده‌ها: ${error.message}`);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleFinalImport = async () => {
    if (!selectedCourse || previewData.length === 0) {
      toast.error('لطفاً دوره را انتخاب کنید');
      return;
    }

    setIsImporting(true);
    setIsPaused(false);

    try {
      console.log(`Importing ${previewData.length} rows for course ${selectedCourse}`);

      // Process import
      const result = await processImport(previewData, selectedCourse, 0);

      if (!isPaused) {
        // Log import with returning id
        const { data: importLogData, error: logError } = await supabase
          .from('import_logs')
          .insert({
            uploaded_by: 'admin',
            course_id: selectedCourse,
            total_rows: result.totalRows,
            new_users_created: result.newEnrollmentsCreated,
            existing_users_updated: result.existingEnrollments
          })
          .select('id')
          .single();

        if (logError) {
          console.error('Error logging import:', logError);
        }

        // Show success message
        toast.success(
          `✅ ${result.totalRows} کاربر پردازش شد، ${result.newEnrollmentsCreated} ثبت‌نام جدید ایجاد شد، ${result.existingEnrollments} ثبت‌نام موجود بود، ${result.errors} خطا`
        );

        // Reset form
        setCsvFile(null);
        setSelectedCourse('');
        setPreviewData([]);
        setPreviewAnalysis(null);
        setShowPreview(false);
        setImportProgress(null);
        setProcessedRows(new Set());
        
        // Refresh import history
        fetchImportHistory();
      } else {
        toast.info('وارد کردن داده‌ها متوقف شد. می‌توانید از همان نقطه ادامه دهید.');
      }

    } catch (error: any) {
      console.error('Import error:', error);
      toast.error(`خطا در وارد کردن داده‌ها: ${error.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  const handleResumeImport = async () => {
    if (!selectedCourse || previewData.length === 0) {
      toast.error('لطفاً دوره را انتخاب کنید');
      return;
    }

    setIsImporting(true);
    setIsPaused(false);

    try {
      const startFromIndex = processedRows.size;
      console.log(`Resuming import from index ${startFromIndex}`);

      // Process import from where it left off
      const result = await processImport(previewData, selectedCourse, startFromIndex);

      if (!isPaused) {
        // Log import completion
        const { data: importLogData, error: logError } = await supabase
          .from('import_logs')
          .insert({
            uploaded_by: 'admin',
            course_id: selectedCourse,
            total_rows: result.totalRows,
            new_users_created: result.newEnrollmentsCreated,
            existing_users_updated: result.existingEnrollments
          })
          .select('id')
          .single();

        if (logError) {
          console.error('Error logging import:', logError);
        }

        toast.success(
          `✅ وارد کردن داده‌ها تکمیل شد! ${result.newEnrollmentsCreated} ثبت‌نام جدید ایجاد شد، ${result.existingEnrollments} ثبت‌نام موجود بود، ${result.errors} خطا`
        );

        // Reset form
        setCsvFile(null);
        setSelectedCourse('');
        setPreviewData([]);
        setPreviewAnalysis(null);
        setShowPreview(false);
        setImportProgress(null);
        setProcessedRows(new Set());
        
        // Refresh import history
        fetchImportHistory();
      }

    } catch (error: any) {
      console.error('Resume import error:', error);
      toast.error(`خطا در ادامه وارد کردن داده‌ها: ${error.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  const handlePauseImport = () => {
    setIsPaused(true);
    toast.info('در حال متوقف کردن وارد کردن داده‌ها...');
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
              <Select value={selectedCourse} onValueChange={handleCourseSelection}>
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

      {/* Analysis Results */}
      {previewAnalysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              تجزیه و تحلیل داده‌ها
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{previewAnalysis.totalRows}</div>
                <div className="text-sm text-blue-600">کل ردیف‌ها</div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{previewAnalysis.newUsers}</div>
                <div className="text-sm text-green-600">کاربران جدید</div>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{previewAnalysis.existingUsers}</div>
                <div className="text-sm text-yellow-600">کاربران موجود</div>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{previewAnalysis.newEnrollments}</div>
                <div className="text-sm text-purple-600">ثبت‌نام‌های جدید</div>
              </div>
            </div>

            {previewAnalysis.duplicatesInFile > 0 && (
              <div className="bg-orange-50 border-l-4 border-orange-400 p-4 mb-4">
                <div className="flex">
                  <div className="ml-3">
                    <p className="text-sm text-orange-700">
                      <strong>تکراری در فایل:</strong> {previewAnalysis.duplicatesInFile} مورد
                    </p>
                    {previewAnalysis.duplicateEmails.length > 0 && (
                      <p className="text-xs text-orange-600 mt-1">
                        ایمیل‌های تکراری: {previewAnalysis.duplicateEmails.slice(0, 3).join(', ')}
                        {previewAnalysis.duplicateEmails.length > 3 && '...'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {previewAnalysis.existingEnrollments > 0 && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                <div className="flex">
                  <div className="ml-3">
                    <p className="text-sm text-red-700">
                      <strong>ثبت‌نام‌های موجود:</strong> {previewAnalysis.existingEnrollments} مورد برای این دوره از قبل وجود دارد
                    </p>
                  </div>
                </div>
              </div>
            )}

            {previewAnalysis.conflicts.length > 0 && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <p className="text-sm text-red-700 font-medium mb-2">تضادهای شناسایی شده:</p>
                    <div className="max-h-32 overflow-y-auto">
                      {previewAnalysis.conflicts.slice(0, 5).map((conflict, index) => (
                        <p key={index} className="text-xs text-red-600">
                          {conflict.email || conflict.phone}: {conflict.reason}
                        </p>
                      ))}
                      {previewAnalysis.conflicts.length > 5 && (
                        <p className="text-xs text-red-600">... و {previewAnalysis.conflicts.length - 5} مورد دیگر</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Preview Data */}
      {showPreview && previewData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              پیش‌نمایش داده‌ها ({previewData.length} ردیف)
            </CardTitle>
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
                    <TableHead>مبلغ پرداخت</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.slice(0, 10).map((row, index) => (
                    <TableRow key={index}>
                      <TableCell>{row.first_name}</TableCell>
                      <TableCell>{row.last_name}</TableCell>
                      <TableCell>{row.email || '-'}</TableCell>
                      <TableCell>{row.phone || '-'}</TableCell>
                      <TableCell>{row.entry_date || 'تاریخ فعلی'}</TableCell>
                      <TableCell>
                        {row.payment_method === 'manual' ? 'کارت به کارت' : 
                         row.payment_method === 'zarinpal' ? 'zarinpal' : 
                         row.payment_method || 'manual_import'}
                      </TableCell>
                      <TableCell>
                        {row.payment_price ? `${parseFloat(row.payment_price).toLocaleString()} تومان` : 'قیمت دوره'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {previewData.length > 10 && (
                <div className="p-4 text-center text-muted-foreground">
                  و {previewData.length - 10} ردیف دیگر...
                </div>
              )}
            </div>

            {/* Progress Bar */}
            {importProgress && (
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span>در حال پردازش: {importProgress.currentUser}</span>
                  <span>{importProgress.processed} از {importProgress.total}</span>
                </div>
                <Progress 
                  value={(importProgress.processed / importProgress.total) * 100} 
                  className="h-2"
                />
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div className="text-green-600">ایجاد شده: {importProgress.created}</div>
                  <div className="text-yellow-600">موجود: {importProgress.existing}</div>
                  <div className="text-red-600">خطا: {importProgress.errors}</div>
                  <div className="text-blue-600">پردازش شده: {importProgress.processed}</div>
                </div>
              </div>
            )}

            {/* Import and Management Buttons */}
            {showPreview && (
              <div className="flex gap-2 mt-4">
                {!importProgress?.canResume ? (
                  <Button
                    onClick={handleFinalImport}
                    disabled={!selectedCourse || isImporting}
                    className="flex items-center gap-2"
                  >
                    {isImporting && <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />}
                    <Database className="h-4 w-4" />
                    {isImporting ? 'در حال وارد کردن...' : 'وارد کردن به پایگاه داده'}
                  </Button>
                ) : (
                  <Button
                    onClick={handleResumeImport}
                    disabled={!selectedCourse || isImporting}
                    className="flex items-center gap-2"
                  >
                    {isImporting && <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />}
                    <Play className="h-4 w-4" />
                    {isImporting ? 'در حال ادامه...' : 'ادامه وارد کردن از همان نقطه'}
                  </Button>
                )}
                
                {isImporting && !isPaused && (
                  <Button
                    onClick={handlePauseImport}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Pause className="h-4 w-4" />
                    توقف
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Backup and Management Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            مدیریت پشتیبان‌گیری و بازیابی
          </CardTitle>
          <CardDescription>
            پشتیبان‌گیری از داده‌ها و بازیابی آخرین واردات
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              onClick={handleBackupData}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              پشتیبان‌گیری از همه داده‌ها
            </Button>
            <Button
              onClick={handleRestoreLastImport}
              variant="destructive"
              disabled={importHistory.length === 0}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              برگرداندن آخرین واردات
            </Button>
          </div>
          {importHistory.length > 0 && (
            <p className="text-sm text-muted-foreground mt-2">
              آخرین واردات: {importHistory[0].new_users_created} ثبت‌نام از دوره "{importHistory[0].courses?.title}"
            </p>
          )}
        </CardContent>
      </Card>

      {/* Import History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            تاریخچه واردات
          </CardTitle>
        </CardHeader>
        <CardContent>
          {importHistory.length > 0 ? (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>تاریخ</TableHead>
                    <TableHead>دوره</TableHead>
                    <TableHead>تعداد کل</TableHead>
                    <TableHead>ثبت‌نام جدید</TableHead>
                    <TableHead>موجود</TableHead>
                    <TableHead>توسط</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {importHistory.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        {new Date(log.created_at).toLocaleDateString('fa-IR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </TableCell>
                      <TableCell>{log.courses?.title}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {log.total_rows}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-green-600">
                          <UserPlus className="h-4 w-4" />
                          {log.new_users_created}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-yellow-600">
                          <UserCheck className="h-4 w-4" />
                          {log.existing_users_updated}
                        </div>
                      </TableCell>
                      <TableCell>{log.uploaded_by}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              هیچ تاریخچه واردات یافت نشد
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}