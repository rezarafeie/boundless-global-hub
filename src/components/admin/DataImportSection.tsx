import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, FileText, Users, UserPlus, UserCheck, Eye, Database, Download, RotateCcw, Trash2, Play, Pause, StickyNote } from 'lucide-react';

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

interface CRMImportResult {
  totalRows: number;
  newNotesCreated: number;
  existingNotes: number;
  errors: number;
  processed: number;
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
  crm_notes?: any[];
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

interface CRMCSVRow {
  user_phone: string | null;
  user_name?: string | null;
  content: string | null;
  type: string | null;
  status?: string | null;
  created_by?: string | null;
  course_name?: string | null;
  created_date?: string | null;
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

interface CRMPreviewAnalysis {
  totalRows: number;
  uniqueNotes: number;
  existingUsers: number;
  newUsers: number;
  validRows: number;
  invalidRows: number;
  duplicatePhones: string[];
  missingData: Array<{
    phone?: string;
    reason: string;
  }>;
}

export function DataImportSection() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [crmCsvFile, setCrmCsvFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isCrmImporting, setIsCrmImporting] = useState(false);
  const [importHistory, setImportHistory] = useState<any[]>([]);
  const [previewData, setPreviewData] = useState<CSVRow[]>([]);
  const [crmPreviewData, setCrmPreviewData] = useState<CRMCSVRow[]>([]);
  const [previewAnalysis, setPreviewAnalysis] = useState<PreviewAnalysis | null>(null);
  const [crmPreviewAnalysis, setCrmPreviewAnalysis] = useState<CRMPreviewAnalysis | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCrmProcessing, setIsCrmProcessing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showCrmPreview, setShowCrmPreview] = useState(false);
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);
  const [crmImportProgress, setCrmImportProgress] = useState<ImportProgress | null>(null);
  const [processedRows, setProcessedRows] = useState<Set<number>>(new Set());
  const [crmProcessedRows, setCrmProcessedRows] = useState<Set<number>>(new Set());
  const [isPaused, setIsPaused] = useState(false);
  const [isCrmPaused, setIsCrmPaused] = useState(false);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [crmImportErrors, setCrmImportErrors] = useState<string[]>([]);

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
    
    // Helper function to safely get and clean values
    const safeGetValue = (values: string[], headerIndex: number): string | null => {
      if (headerIndex === -1) return null;
      const value = values[headerIndex]?.trim().replace(/"/g, '');
      return value && value.length > 0 ? value : null;
    };
    
    // Validate headers - only first_name is truly required
    const requiredHeaders = ['first_name'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    
    if (missingHeaders.length > 0) {
      throw new Error(`فیلدهای مورد نیاز یافت نشد: ${missingHeaders.join(', ')}`);
    }

    const rows: CSVRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      
      // Get indices for all headers
      const firstNameIndex = headers.indexOf('first_name');
      const lastNameIndex = headers.indexOf('last_name');
      const emailIndex = headers.indexOf('email');
      const phoneIndex = headers.indexOf('phone');
      const entryDateIndex = headers.indexOf('entry_date');
      const paymentMethodIndex = headers.indexOf('payment_method');
      const paymentPriceIndex = headers.indexOf('payment_price');
      
      // Create row object with null for empty values
      const row: CSVRow = {
        first_name: safeGetValue(values, firstNameIndex),
        last_name: safeGetValue(values, lastNameIndex),
        email: safeGetValue(values, emailIndex),
        phone: safeGetValue(values, phoneIndex),
        entry_date: safeGetValue(values, entryDateIndex),
        payment_method: safeGetValue(values, paymentMethodIndex),
        payment_price: safeGetValue(values, paymentPriceIndex)
      };
      
      // Only add row if we have at least first_name or email or phone
      if (row.first_name || row.email || row.phone) {
        rows.push(row);
      } else {
        console.warn(`Skipping row ${i + 1}: No first_name, email, or phone provided`);
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
      // Create unique key using available identifiers (email, phone, or first_name+last_name)
      const email = row.email?.trim().toLowerCase() || '';
      const phone = row.phone?.trim() || '';
      const name = `${row.first_name?.trim() || ''}-${row.last_name?.trim() || ''}`;
      const userKey = `${email}-${phone}-${name}`;
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
        // Helper function to generate placeholder email for rows without email
        const generatePlaceholderEmail = (phone: string | undefined): string => {
          if (phone?.trim()) {
            return `${phone.trim()}@rafiei.co`;
          }
          return `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@rafiei.co`;
        };
        
        // Update progress
        setImportProgress(prev => prev ? {
          ...prev,
          processed: processed + 1,
          currentUser: `${row.first_name} ${row.last_name}`.trim()
        } : null);

        // First, check if user exists in chat_users table
        let existingUser = null;
        const finalEmail = row.email?.trim() || generatePlaceholderEmail(row.phone);
        
        if ((row.email && row.email.trim()) || (row.phone && row.phone.trim())) {
          const conditions = [];
          if (row.email && row.email.trim()) conditions.push(`email.eq.${row.email.trim()}`);
          if (row.phone && row.phone.trim()) conditions.push(`phone.eq.${row.phone.trim()}`);
          
          // Also check for the generated placeholder email if we're going to use one
          if (!row.email?.trim() && row.phone?.trim()) {
            conditions.push(`email.eq.${finalEmail}`);
          }
          
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
        let existingEnrollment = null;
        
        // If we found an existing user, check enrollment by user_id first (most reliable)
        if (existingUser?.id) {
          const { data: enrollmentByUserId } = await supabase
            .from('enrollments')
            .select('id')
            .eq('course_id', courseId)
            .eq('chat_user_id', existingUser.id)
            .maybeSingle();
          
          existingEnrollment = enrollmentByUserId;
        }

        // If no enrollment found by user_id, check by email/phone as fallback
        if (!existingEnrollment && ((row.email && row.email.trim()) || (row.phone && row.phone.trim()))) {
          const enrollmentConditions = [];
          if (row.email && row.email.trim()) enrollmentConditions.push(`email.eq.${row.email.trim()}`);
          if (row.phone && row.phone.trim()) enrollmentConditions.push(`phone.eq.${row.phone.trim()}`);
          
          if (enrollmentConditions.length > 0) {
            const { data: enrollmentByContact } = await supabase
              .from('enrollments')
              .select('id')
              .eq('course_id', courseId)
              .or(enrollmentConditions.join(','))
              .maybeSingle();
              
            existingEnrollment = enrollmentByContact;
          }
        }

        if (existingEnrollment) {
          existingEnrollments++;
          setImportProgress(prev => prev ? { ...prev, existing: prev.existing + 1 } : null);
          setProcessedRows(prev => new Set([...prev, index]));
          processed++;
          console.log(`Enrollment already exists for ${row.email || row.phone} in course ${courseId}`);
          const userInfo = `نام: ${row.first_name || ''} ${row.last_name || ''}, تلفن: ${row.phone || 'ندارد'}, ایمیل: ${row.email || 'ندارد'}`;
          setImportErrors(prev => [...prev, `کاربر موجود - ثبت‌نام تکراری ردیف ${index + 1} (${userInfo}): کاربر قبلاً در این دوره ثبت‌نام کرده است`]);
          continue;
        }

        console.log(`Creating enrollment for ${existingUser ? 'existing' : 'new'} user: ${row.email || row.phone}`);
        
        if (existingUser) {
          const userInfo = `نام: ${row.first_name || ''} ${row.last_name || ''}, تلفن: ${row.phone || 'ندارد'}, ایمیل: ${row.email || 'ندارد'}`;
          console.log(`Using existing user for enrollment: ${userInfo}`);
        }

        // If user exists but no enrollment for this course, we'll create the enrollment

        // Create or update user in chat_users if needed
        let chatUserId = existingUser?.id;
        
        if (!existingUser && (row.first_name?.trim() || row.email?.trim() || row.phone?.trim())) {
          // Parse entry date for user creation
          let userCreatedAt = new Date().toISOString();
          if (row.entry_date) {
            try {
              const dateStr = row.entry_date.trim();
              if (dateStr.length > 0) {
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
                } else {
                  console.warn(`Invalid date format for ${row.email || row.phone}: ${row.entry_date}, using current date`);
                }
              }
            } catch (error) {
              console.warn(`Error parsing date for ${row.email || row.phone}: ${row.entry_date}, using current date`);
            }
          }

          // Generate email if missing but phone exists
          // Use the already calculated finalEmail instead of generating again

          // Create new user in chat_users
          const { data: newUser, error: userError } = await supabase
            .from('chat_users')
            .insert({
              name: `${row.first_name || ''} ${row.last_name || ''}`.trim() || 'کاربر بدون نام',
              phone: row.phone || null,
              email: finalEmail,
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
            const errorMessage = userError.message || 'خطای نامشخص در ایجاد کاربر';
            const rowInfo = `نام: ${row.first_name || ''} ${row.last_name || ''}, تلفن: ${row.phone || 'ندارد'}, ایمیل: ${row.email || 'ندارد'}`;
            setImportErrors(prev => [...prev, `خطا در ایجاد کاربر ردیف ${index + 1} (${rowInfo}): ${errorMessage}`]);
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
        if (row.entry_date) {
          try {
            const dateStr = row.entry_date.trim();
            if (dateStr.length > 0) {
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
              } else {
                console.warn(`Invalid date format for enrollment ${row.email || row.phone}: ${row.entry_date}, using current date`);
              }
            }
          } catch (error) {
            console.warn(`Error parsing date for enrollment ${row.email || row.phone}: ${row.entry_date}, using current date`);
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

        // Generate email if missing but phone exists (for enrollment)
        // Use the already calculated finalEmail
        
        const { error: enrollmentError } = await supabase
          .from('enrollments')
          .insert({
            course_id: courseId,
            full_name: fullName,
            email: finalEmail,
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
          const errorMessage = enrollmentError.message || 'خطای نامشخص در ایجاد ثبت‌نام';
          const rowInfo = `نام: ${row.first_name || ''} ${row.last_name || ''}, تلفن: ${row.phone || 'ندارد'}, ایمیل: ${row.email || 'ندارد'}`;
          setImportErrors(prev => [...prev, `خطا در ایجاد ثبت‌نام ردیف ${index + 1} (${rowInfo}): ${errorMessage}`]);
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
        const errorMessage = error instanceof Error ? error.message : 'خطای نامشخص';
        const rowInfo = `نام: ${row.first_name || ''} ${row.last_name || ''}, تلفن: ${row.phone || 'ندارد'}, ایمیل: ${row.email || 'ندارد'}`;
        setImportErrors(prev => [...prev, `خطا در پردازش ردیف ${index + 1} (${rowInfo}): ${errorMessage}`]);
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

  const parseCRMCSV = (csvText: string): CRMCSVRow[] => {
    const lines = csvText.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    // Validate headers
    const requiredHeaders = ['user_phone', 'content', 'type'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    
    if (missingHeaders.length > 0) {
      throw new Error(`فیلدهای مورد نیاز یافت نشد: ${missingHeaders.join(', ')}`);
    }

    const rows: CRMCSVRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      if (values.length >= 3) {
        const row: CRMCSVRow = {
          user_phone: values[headers.indexOf('user_phone')]?.trim() || null,
          user_name: headers.includes('user_name') ? (values[headers.indexOf('user_name')]?.trim() || null) : null,
          content: values[headers.indexOf('content')]?.trim() || null,
          type: values[headers.indexOf('type')]?.trim() || null,
          status: headers.includes('status') ? (values[headers.indexOf('status')]?.trim() || null) : null,
          created_by: headers.includes('created_by') ? (values[headers.indexOf('created_by')]?.trim() || null) : null,
          course_name: headers.includes('course_name') ? (values[headers.indexOf('course_name')]?.trim() || null) : null,
          created_date: headers.includes('created_date') ? (values[headers.indexOf('created_date')]?.trim() || null) : null
        };
        
        rows.push(row);
      }
    }

    return rows;
  };

  const analyzeCRMData = async (crmRows: CRMCSVRow[]): Promise<CRMPreviewAnalysis> => {
    const analysis: CRMPreviewAnalysis = {
      totalRows: crmRows.length,
      uniqueNotes: 0,
      existingUsers: 0,
      newUsers: 0,
      validRows: 0,
      invalidRows: 0,
      duplicatePhones: [],
      missingData: []
    };

    // Check for duplicates and validation
    const phoneMap = new Map<string, number>();
    const validRows = [];
    
    crmRows.forEach((row, index) => {
      // Check for required fields
      if (!row.user_phone || !row.content || !row.type) {
        analysis.missingData.push({
          phone: row.user_phone,
          reason: 'فیلدهای مورد نیاز (تلفن، محتوا، نوع) کامل نیست'
        });
        analysis.invalidRows++;
        return;
      }

      const phone = row.user_phone.trim();
      phoneMap.set(phone, (phoneMap.get(phone) || 0) + 1);
      validRows.push(row);
      analysis.validRows++;
    });

    // Find duplicate phones
    analysis.duplicatePhones = Array.from(phoneMap.entries())
      .filter(([_, count]) => count > 1)
      .map(([phone]) => phone);

    // Check against existing users
    const phones = validRows.map(row => row.user_phone?.trim()).filter(Boolean);
    
    if (phones.length > 0) {
      const { data: existingUsers } = await supabase
        .from('chat_users')
        .select('id, phone')
        .in('phone', phones);
      
      analysis.existingUsers = existingUsers?.length || 0;
      analysis.newUsers = phones.length - analysis.existingUsers;
    }

    analysis.uniqueNotes = validRows.length;

    return analysis;
  };

  const processCRMImport = async (crmRows: CRMCSVRow[], startFromIndex: number = 0): Promise<CRMImportResult> => {
    let newNotesCreated = 0;
    let existingNotes = 0;
    let errors = 0;
    let processed = 0;

    // Filter valid rows
    const validRows = crmRows.filter(row => 
      row.user_phone && row.content && row.type
    );

    // Initialize progress
    setCrmImportProgress({
      total: validRows.length,
      processed: 0,
      created: 0,
      existing: 0,
      errors: 0,
      currentUser: '',
      isRunning: true,
      canResume: false
    });

    for (let i = startFromIndex; i < validRows.length; i++) {
      if (isCrmPaused) {
        setCrmImportProgress(prev => prev ? { ...prev, isRunning: false, canResume: true } : null);
        return {
          totalRows: validRows.length,
          newNotesCreated,
          existingNotes,
          errors,
          processed
        };
      }

      const row = validRows[i];
      
      if (crmProcessedRows.has(i)) {
        processed++;
        continue;
      }

      try {
        // Update progress
        setCrmImportProgress(prev => prev ? {
          ...prev,
          processed: processed + 1,
          currentUser: row.user_name || row.user_phone || 'کاربر نامشخص'
        } : null);

        // Find user by phone
        const { data: user } = await supabase
          .from('chat_users')
          .select('id')
          .eq('phone', row.user_phone.trim())
          .maybeSingle();

        if (!user) {
          console.warn(`User not found for phone: ${row.user_phone}`);
          errors++;
          setCrmImportProgress(prev => prev ? { ...prev, errors: prev.errors + 1 } : null);
          continue;
        }

        // Find course if course_name is provided
        let courseId = null;
        if (row.course_name) {
          const { data: course } = await supabase
            .from('courses')
            .select('id')
            .eq('title', row.course_name.trim())
            .maybeSingle();
          courseId = course?.id || null;
        }

        // Parse created date
        let createdAt = new Date().toISOString();
        if (row.created_date?.trim()) {
          try {
            const dateStr = row.created_date.trim();
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
            console.warn(`Invalid date format: ${row.created_date}, using current date`);
          }
        }

        // Create CRM note
        const { error: noteError } = await supabase
          .from('crm_notes')
          .insert({
            user_id: user.id,
            content: row.content,
            type: row.type,
            status: row.status || 'در انتظار پرداخت',
            created_by: row.created_by || 'imported',
            course_id: courseId,
            created_at: createdAt,
            updated_at: createdAt
          });

        if (noteError) {
          console.error(`Error creating CRM note:`, noteError);
          errors++;
          setCrmImportProgress(prev => prev ? { ...prev, errors: prev.errors + 1 } : null);
          continue;
        }

        newNotesCreated++;
        setCrmImportProgress(prev => prev ? { ...prev, created: prev.created + 1 } : null);
        setCrmProcessedRows(prev => new Set([...prev, i]));
        processed++;

        // Add small delay
        await new Promise(resolve => setTimeout(resolve, 50));

      } catch (error) {
        console.error(`Error processing CRM row:`, error);
        errors++;
        setCrmImportProgress(prev => prev ? { ...prev, errors: prev.errors + 1 } : null);
      }
    }

    setCrmImportProgress(prev => prev ? { ...prev, isRunning: false, canResume: false } : null);

    return {
      totalRows: validRows.length,
      newNotesCreated,
      existingNotes,
      errors,
      processed
    };
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
    setImportErrors([]);  // Reset errors

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
        const errorSummary = importErrors.length > 0 ? `, ${importErrors.length} خطا` : '';
        toast.success(
          `✅ ${result.totalRows} کاربر پردازش شد، ${result.newEnrollmentsCreated} ثبت‌نام جدید ایجاد شد، ${result.existingEnrollments} ثبت‌نام موجود بود${errorSummary}`
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
    setImportErrors([]);  // Reset errors when resuming

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

      const { data: crmNotes, error: crmError } = await supabase
        .from('crm_notes')
        .select('*')
        .order('created_at', { ascending: false });

      if (enrollError || logsError || crmError) {
        throw new Error('خطا در دریافت داده‌ها');
      }

      const backupData = {
        enrollments: enrollments || [],
        import_logs: importLogs || [],
        crm_notes: crmNotes || [],
        backup_date: new Date().toISOString(),
        total_enrollments: enrollments?.length || 0,
        total_import_logs: importLogs?.length || 0,
        total_crm_notes: crmNotes?.length || 0
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

      toast.success(`پشتیبان‌گیری انجام شد - ${enrollments?.length || 0} ثبت‌نام و ${crmNotes?.length || 0} یادداشت CRM`);
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

  const handleCrmFileUpload = async (file: File | null) => {
    setCrmCsvFile(file);
    setCrmPreviewData([]);
    setCrmPreviewAnalysis(null);
    setShowCrmPreview(false);
    
    if (!file) return;
    
    setIsCrmProcessing(true);
    try {
      const csvText = await file.text();
      const parsedData = parseCRMCSV(csvText);
      setCrmPreviewData(parsedData);
      
      const analysis = await analyzeCRMData(parsedData);
      setCrmPreviewAnalysis(analysis);
      setShowCrmPreview(true);
      
      toast.success(`${parsedData.length} ردیف داده CRM پردازش شد`);
    } catch (error: any) {
      toast.error(`خطا در پردازش فایل CRM: ${error.message}`);
      setCrmCsvFile(null);
    } finally {
      setIsCrmProcessing(false);
    }
  };

  const handleCrmImport = async () => {
    if (crmPreviewData.length === 0) {
      toast.error('لطفاً فایل CRM را انتخاب کنید');
      return;
    }

    setIsCrmImporting(true);
    setIsCrmPaused(false);

    try {
      const result = await processCRMImport(crmPreviewData, 0);

      if (!isCrmPaused) {
        toast.success(
          `✅ ${result.totalRows} یادداشت CRM پردازش شد، ${result.newNotesCreated} یادداشت جدید ایجاد شد، ${result.errors} خطا`
        );

        // Reset form
        setCrmCsvFile(null);
        setCrmPreviewData([]);
        setCrmPreviewAnalysis(null);
        setShowCrmPreview(false);
        setCrmImportProgress(null);
        setCrmProcessedRows(new Set());
      } else {
        toast.info('وارد کردن یادداشت‌های CRM متوقف شد');
      }

    } catch (error: any) {
      console.error('CRM import error:', error);
      toast.error(`خطا در وارد کردن یادداشت‌های CRM: ${error.message}`);
    } finally {
      setIsCrmImporting(false);
    }
  };

  const handleCrmPauseImport = () => {
    setIsCrmPaused(true);
    toast.info('در حال متوقف کردن وارد کردن یادداشت‌های CRM...');
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="enrollments" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="enrollments">وارد کردن ثبت‌نام‌ها</TabsTrigger>
          <TabsTrigger value="crm">وارد کردن CRM</TabsTrigger>
        </TabsList>
        
        <TabsContent value="enrollments">
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

                {/* Import Errors Display */}
                {importErrors.length > 0 && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <h4 className="text-red-800 font-medium mb-2">خطاهای وارد کردن ({importErrors.length} مورد):</h4>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {importErrors.map((error, index) => (
                        <div key={index} className="text-sm text-red-700 bg-white p-2 rounded border border-red-100">
                          {error}
                        </div>
                      ))}
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
        </TabsContent>
        
        <TabsContent value="crm">
          {/* CRM Import Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <StickyNote className="h-5 w-5" />
                وارد کردن یادداشت‌های CRM از فایل CSV
              </CardTitle>
              <CardDescription>
                فایل CSV یادداشت‌های CRM خود را بارگذاری کنید
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* File Upload */}
              <div className="space-y-2">
                <Label htmlFor="crm-csv-file">فایل CSV یادداشت‌های CRM</Label>
                <Input
                  id="crm-csv-file"
                  type="file"
                  accept=".csv"
                  onChange={(e) => handleCrmFileUpload(e.target.files?.[0] || null)}
                  className="cursor-pointer"
                  disabled={isCrmProcessing}
                />
                <p className="text-sm text-muted-foreground">
                  فرمت مورد انتظار: user_phone, content, type, user_name (اختیاری), status (اختیاری), created_by (اختیاری), course_name (اختیاری), created_date (اختیاری)
                  <br />
                  فرمت تاریخ: YYYY-MM-DD HH:MM (مثل 2024-02-28 08:22) یا YYYY-MM-DD یا DD/MM/YYYY یا DD-MM-YYYY
                </p>
                {isCrmProcessing && (
                  <p className="text-sm text-blue-600">در حال پردازش فایل CRM...</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* CRM Analysis Results */}
          {crmPreviewAnalysis && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <StickyNote className="h-5 w-5" />
                  تجزیه و تحلیل داده‌های CRM
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{crmPreviewAnalysis.totalRows}</div>
                    <div className="text-sm text-blue-600">کل ردیف‌ها</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{crmPreviewAnalysis.validRows}</div>
                    <div className="text-sm text-green-600">ردیف‌های معتبر</div>
                  </div>
                  <div className="bg-red-50 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{crmPreviewAnalysis.invalidRows}</div>
                    <div className="text-sm text-red-600">ردیف‌های نامعتبر</div>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">{crmPreviewAnalysis.existingUsers}</div>
                    <div className="text-sm text-yellow-600">کاربران موجود</div>
                  </div>
                </div>

                {crmPreviewAnalysis.duplicatePhones.length > 0 && (
                  <div className="bg-orange-50 border-l-4 border-orange-400 p-4 mb-4">
                    <div className="flex">
                      <div className="ml-3">
                        <p className="text-sm text-orange-700">
                          <strong>تلفن‌های تکراری:</strong> {crmPreviewAnalysis.duplicatePhones.length} مورد
                        </p>
                        <p className="text-xs text-orange-600 mt-1">
                          {crmPreviewAnalysis.duplicatePhones.slice(0, 3).join(', ')}
                          {crmPreviewAnalysis.duplicatePhones.length > 3 && '...'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {crmPreviewAnalysis.missingData.length > 0 && (
                  <div className="bg-red-50 border-l-4 border-red-400 p-4">
                    <div className="flex">
                      <div className="ml-3">
                        <p className="text-sm text-red-700 font-medium mb-2">داده‌های ناقص:</p>
                        <div className="max-h-32 overflow-y-auto">
                          {crmPreviewAnalysis.missingData.slice(0, 5).map((item, index) => (
                            <p key={index} className="text-xs text-red-600">
                              {item.phone || 'نامشخص'}: {item.reason}
                            </p>
                          ))}
                          {crmPreviewAnalysis.missingData.length > 5 && (
                            <p className="text-xs text-red-600">... و {crmPreviewAnalysis.missingData.length - 5} مورد دیگر</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* CRM Preview Data */}
          {showCrmPreview && crmPreviewData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  پیش‌نمایش داده‌های CRM ({crmPreviewData.length} ردیف)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-96 overflow-auto border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>تلفن کاربر</TableHead>
                        <TableHead>نام کاربر</TableHead>
                        <TableHead>محتوا</TableHead>
                        <TableHead>نوع</TableHead>
                        <TableHead>وضعیت</TableHead>
                        <TableHead>ایجاد شده توسط</TableHead>
                        <TableHead>دوره</TableHead>
                        <TableHead>تاریخ ایجاد</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {crmPreviewData.slice(0, 10).map((row, index) => (
                        <TableRow key={index}>
                          <TableCell>{row.user_phone}</TableCell>
                          <TableCell>{row.user_name || '-'}</TableCell>
                          <TableCell className="max-w-xs truncate">{row.content}</TableCell>
                          <TableCell>{row.type}</TableCell>
                          <TableCell>{row.status || 'در انتظار پرداخت'}</TableCell>
                          <TableCell>{row.created_by || 'imported'}</TableCell>
                          <TableCell>{row.course_name || '-'}</TableCell>
                          <TableCell>{row.created_date || 'تاریخ فعلی'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {crmPreviewData.length > 10 && (
                    <div className="p-4 text-center text-muted-foreground">
                      و {crmPreviewData.length - 10} ردیف دیگر...
                    </div>
                  )}
                </div>

                {/* CRM Progress Bar */}
                {crmImportProgress && (
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span>در حال پردازش: {crmImportProgress.currentUser}</span>
                      <span>{crmImportProgress.processed} از {crmImportProgress.total}</span>
                    </div>
                    <Progress 
                      value={(crmImportProgress.processed / crmImportProgress.total) * 100} 
                      className="h-2"
                    />
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div className="text-green-600">ایجاد شده: {crmImportProgress.created}</div>
                      <div className="text-yellow-600">موجود: {crmImportProgress.existing}</div>
                      <div className="text-red-600">خطا: {crmImportProgress.errors}</div>
                      <div className="text-blue-600">پردازش شده: {crmImportProgress.processed}</div>
                    </div>
                  </div>
                )}

                {/* CRM Import Buttons */}
                <div className="flex gap-2 mt-4">
                  <Button
                    onClick={handleCrmImport}
                    disabled={isCrmImporting}
                    className="flex items-center gap-2"
                  >
                    {isCrmImporting && <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />}
                    <Database className="h-4 w-4" />
                    {isCrmImporting ? 'در حال وارد کردن...' : 'وارد کردن یادداشت‌های CRM'}
                  </Button>
                  
                  {isCrmImporting && !isCrmPaused && (
                    <Button
                      onClick={handleCrmPauseImport}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Pause className="h-4 w-4" />
                      توقف
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
