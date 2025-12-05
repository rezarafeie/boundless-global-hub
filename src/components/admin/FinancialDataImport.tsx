import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, Eye, Database, DollarSign, FileSpreadsheet } from 'lucide-react';

interface InstallmentData {
  amount: number;
  due_date: string | null;
}

interface FinancialCSVRow {
  customer_phone: string | null;
  customer_name?: string | null;
  total_amount: string | null;
  paid_amount?: string | null;
  status?: string | null;
  payment_type?: string | null;
  is_installment?: string | null;
  notes?: string | null;
  due_date?: string | null;
  created_date?: string | null;
  course_name?: string | null;
  item_description?: string | null;
  // Installment fields (up to 7)
  installment_1_amount?: string | null;
  installment_1_due_date?: string | null;
  installment_2_amount?: string | null;
  installment_2_due_date?: string | null;
  installment_3_amount?: string | null;
  installment_3_due_date?: string | null;
  installment_4_amount?: string | null;
  installment_4_due_date?: string | null;
  installment_5_amount?: string | null;
  installment_5_due_date?: string | null;
  installment_6_amount?: string | null;
  installment_6_due_date?: string | null;
  installment_7_amount?: string | null;
  installment_7_due_date?: string | null;
}

interface FinancialPreviewAnalysis {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  existingCustomers: number;
  totalAmount: number;
  installmentRows: number;
  missingData: Array<{ row: number; reason: string }>;
}

interface ImportProgress {
  total: number;
  processed: number;
  created: number;
  errors: number;
  currentRow: string;
  isRunning: boolean;
}

export function FinancialDataImport() {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<FinancialCSVRow[]>([]);
  const [previewAnalysis, setPreviewAnalysis] = useState<FinancialPreviewAnalysis | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);
  const [importErrors, setImportErrors] = useState<string[]>([]);

  const parseFinancialCSV = (csvText: string): FinancialCSVRow[] => {
    const lines = csvText.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
    
    const safeGetValue = (values: string[], headerIndex: number): string | null => {
      if (headerIndex === -1) return null;
      const value = values[headerIndex]?.trim().replace(/"/g, '');
      return value && value.length > 0 ? value : null;
    };

    // Validate required headers
    const hasPhone = headers.includes('customer_phone') || headers.includes('phone');
    const hasAmount = headers.includes('total_amount') || headers.includes('amount');
    
    if (!hasPhone || !hasAmount) {
      throw new Error('فیلدهای مورد نیاز یافت نشد: customer_phone و total_amount');
    }

    const rows: FinancialCSVRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      
      const phoneIndex = headers.indexOf('customer_phone') !== -1 ? headers.indexOf('customer_phone') : headers.indexOf('phone');
      const amountIndex = headers.indexOf('total_amount') !== -1 ? headers.indexOf('total_amount') : headers.indexOf('amount');
      
      const row: FinancialCSVRow = {
        customer_phone: safeGetValue(values, phoneIndex),
        customer_name: safeGetValue(values, headers.indexOf('customer_name')),
        total_amount: safeGetValue(values, amountIndex),
        paid_amount: safeGetValue(values, headers.indexOf('paid_amount')),
        status: safeGetValue(values, headers.indexOf('status')),
        payment_type: safeGetValue(values, headers.indexOf('payment_type')),
        is_installment: safeGetValue(values, headers.indexOf('is_installment')),
        notes: safeGetValue(values, headers.indexOf('notes')),
        due_date: safeGetValue(values, headers.indexOf('due_date')),
        created_date: safeGetValue(values, headers.indexOf('created_date')),
        course_name: safeGetValue(values, headers.indexOf('course_name')),
        item_description: safeGetValue(values, headers.indexOf('item_description')),
        // Parse installment fields (1-7)
        installment_1_amount: safeGetValue(values, headers.indexOf('installment_1_amount')),
        installment_1_due_date: safeGetValue(values, headers.indexOf('installment_1_due_date')),
        installment_2_amount: safeGetValue(values, headers.indexOf('installment_2_amount')),
        installment_2_due_date: safeGetValue(values, headers.indexOf('installment_2_due_date')),
        installment_3_amount: safeGetValue(values, headers.indexOf('installment_3_amount')),
        installment_3_due_date: safeGetValue(values, headers.indexOf('installment_3_due_date')),
        installment_4_amount: safeGetValue(values, headers.indexOf('installment_4_amount')),
        installment_4_due_date: safeGetValue(values, headers.indexOf('installment_4_due_date')),
        installment_5_amount: safeGetValue(values, headers.indexOf('installment_5_amount')),
        installment_5_due_date: safeGetValue(values, headers.indexOf('installment_5_due_date')),
        installment_6_amount: safeGetValue(values, headers.indexOf('installment_6_amount')),
        installment_6_due_date: safeGetValue(values, headers.indexOf('installment_6_due_date')),
        installment_7_amount: safeGetValue(values, headers.indexOf('installment_7_amount')),
        installment_7_due_date: safeGetValue(values, headers.indexOf('installment_7_due_date')),
      };
      
      if (row.customer_phone && row.total_amount) {
        rows.push(row);
      }
    }

    return rows;
  };

  const getInstallmentsFromRow = (row: FinancialCSVRow): InstallmentData[] => {
    const installments: InstallmentData[] = [];
    
    for (let i = 1; i <= 7; i++) {
      const amountKey = `installment_${i}_amount` as keyof FinancialCSVRow;
      const dueDateKey = `installment_${i}_due_date` as keyof FinancialCSVRow;
      
      const amount = row[amountKey];
      const dueDate = row[dueDateKey];
      
      if (amount && !isNaN(parseFloat(amount))) {
        let parsedDueDate: string | null = null;
        if (dueDate) {
          try {
            const parsed = new Date(dueDate);
            if (!isNaN(parsed.getTime())) {
              parsedDueDate = parsed.toISOString();
            }
          } catch {}
        }
        
        installments.push({
          amount: parseFloat(amount),
          due_date: parsedDueDate
        });
      }
    }
    
    return installments;
  };

  const hasInstallments = (row: FinancialCSVRow): boolean => {
    return getInstallmentsFromRow(row).length > 0;
  };

  const analyzeFinancialData = async (rows: FinancialCSVRow[]): Promise<FinancialPreviewAnalysis> => {
    const missingData: Array<{ row: number; reason: string }> = [];
    let validRows = 0;
    let existingCustomers = 0;
    let totalAmount = 0;
    let installmentRows = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      if (!row.customer_phone) {
        missingData.push({ row: i + 2, reason: 'شماره تلفن ندارد' });
        continue;
      }
      
      if (!row.total_amount || isNaN(parseFloat(row.total_amount))) {
        missingData.push({ row: i + 2, reason: 'مبلغ نامعتبر' });
        continue;
      }

      // Check if customer exists
      const { data: customer } = await supabase
        .from('chat_users')
        .select('id')
        .eq('phone', row.customer_phone)
        .maybeSingle();

      if (customer) {
        existingCustomers++;
      }

      // Check for installments
      if (hasInstallments(row) || row.is_installment?.toLowerCase() === 'true' || row.is_installment === '1') {
        installmentRows++;
      }

      validRows++;
      totalAmount += parseFloat(row.total_amount);
    }

    return {
      totalRows: rows.length,
      validRows,
      invalidRows: missingData.length,
      existingCustomers,
      totalAmount,
      installmentRows,
      missingData
    };
  };

  const handleFileUpload = async (file: File | null) => {
    if (!file) {
      setCsvFile(null);
      setPreviewData([]);
      setPreviewAnalysis(null);
      setShowPreview(false);
      return;
    }

    setCsvFile(file);
    setIsProcessing(true);
    setImportErrors([]);

    try {
      const text = await file.text();
      const rows = parseFinancialCSV(text);
      
      if (rows.length === 0) {
        toast.error('فایل CSV خالی است یا فرمت نادرست دارد');
        setIsProcessing(false);
        return;
      }

      setPreviewData(rows);
      
      const analysis = await analyzeFinancialData(rows);
      setPreviewAnalysis(analysis);
      setShowPreview(true);
      
      toast.success(`${rows.length} ردیف مالی پیدا شد`);
    } catch (error: any) {
      console.error('Error parsing CSV:', error);
      toast.error(error.message || 'خطا در پردازش فایل CSV');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async () => {
    if (previewData.length === 0) {
      toast.error('داده‌ای برای وارد کردن وجود ندارد');
      return;
    }

    setIsImporting(true);
    setImportErrors([]);
    
    let created = 0;
    let errors = 0;

    setImportProgress({
      total: previewData.length,
      processed: 0,
      created: 0,
      errors: 0,
      currentRow: '',
      isRunning: true
    });

    for (let i = 0; i < previewData.length; i++) {
      const row = previewData[i];

      setImportProgress(prev => prev ? {
        ...prev,
        processed: i + 1,
        currentRow: row.customer_phone || ''
      } : null);

      try {
        if (!row.customer_phone || !row.total_amount) {
          errors++;
          setImportErrors(prev => [...prev, `ردیف ${i + 2}: داده ناقص`]);
          continue;
        }

        // Find or create customer
        let customerId: number | null = null;
        
        const { data: existingCustomer } = await supabase
          .from('chat_users')
          .select('id')
          .eq('phone', row.customer_phone)
          .maybeSingle();

        if (existingCustomer) {
          customerId = existingCustomer.id;
        } else if (row.customer_name) {
          // Create new customer
          const { data: newCustomer, error: createError } = await supabase
            .from('chat_users')
            .insert({
              phone: row.customer_phone,
              name: row.customer_name,
              is_approved: true,
              signup_source: 'financial_import'
            })
            .select('id')
            .single();

          if (createError) {
            errors++;
            setImportErrors(prev => [...prev, `ردیف ${i + 2}: خطا در ایجاد مشتری - ${createError.message}`]);
            continue;
          }
          customerId = newCustomer.id;
        } else {
          errors++;
          setImportErrors(prev => [...prev, `ردیف ${i + 2}: مشتری با شماره ${row.customer_phone} یافت نشد و نام برای ایجاد موجود نیست`]);
          continue;
        }

        // Parse dates
        let createdAt = new Date().toISOString();
        if (row.created_date) {
          try {
            const parsed = new Date(row.created_date);
            if (!isNaN(parsed.getTime())) {
              createdAt = parsed.toISOString();
            }
          } catch {}
        }

        let dueDate = null;
        if (row.due_date) {
          try {
            const parsed = new Date(row.due_date);
            if (!isNaN(parsed.getTime())) {
              dueDate = parsed.toISOString();
            }
          } catch {}
        }

        // Determine status
        const totalAmount = parseFloat(row.total_amount);
        const paidAmount = row.paid_amount ? parseFloat(row.paid_amount) : 0;
        let status = row.status || 'unpaid';
        if (!row.status) {
          if (paidAmount >= totalAmount) {
            status = 'paid';
          } else if (paidAmount > 0) {
            status = 'partially_paid';
          }
        }

        // Check if this row has installment data
        const installments = getInstallmentsFromRow(row);
        const isInstallmentInvoice = installments.length > 0 || row.is_installment?.toLowerCase() === 'true' || row.is_installment === '1';

        // Generate invoice number (YYMM + sequence)
        const now = new Date();
        const yearMonth = now.toISOString().slice(2, 4) + now.toISOString().slice(5, 7);
        const randomSeq = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        const invoiceNumber = `${yearMonth}${randomSeq}`;

        // Create invoice
        const { data: invoice, error: invoiceError } = await supabase
          .from('invoices')
          .insert({
            invoice_number: invoiceNumber,
            customer_id: customerId,
            total_amount: totalAmount,
            paid_amount: paidAmount,
            status,
            payment_type: row.payment_type || 'manual',
            is_installment: isInstallmentInvoice,
            notes: row.notes,
            due_date: dueDate
          })
          .select('id')
          .single();

        if (invoiceError) {
          errors++;
          setImportErrors(prev => [...prev, `ردیف ${i + 2}: خطا در ایجاد فاکتور - ${invoiceError.message}`]);
          continue;
        }

        // Create invoice item if course or description is provided
        if (invoice && (row.course_name || row.item_description)) {
          let courseId = null;
          if (row.course_name) {
            const { data: course } = await supabase
              .from('courses')
              .select('id')
              .ilike('title', `%${row.course_name}%`)
              .maybeSingle();
            
            if (course) {
              courseId = course.id;
            }
          }

          await supabase
            .from('invoice_items')
            .insert({
              invoice_id: invoice.id,
              course_id: courseId,
              description: row.item_description || row.course_name || 'محصول',
              quantity: 1,
              unit_price: totalAmount,
              total_price: totalAmount
            });
        }

        // Create installments if any
        if (invoice && installments.length > 0) {
          for (let j = 0; j < installments.length; j++) {
            const installment = installments[j];
            
            // Default due date: 30 days apart starting from now if not specified
            const defaultDueDate = new Date();
            defaultDueDate.setDate(defaultDueDate.getDate() + (30 * (j + 1)));
            
            await supabase
              .from('installments')
              .insert({
                invoice_id: invoice.id,
                installment_number: j + 1,
                amount: installment.amount,
                due_date: installment.due_date || defaultDueDate.toISOString(),
                status: 'pending'
              });
          }
        }

        created++;
        setImportProgress(prev => prev ? { ...prev, created } : null);

      } catch (error: any) {
        errors++;
        setImportErrors(prev => [...prev, `ردیف ${i + 2}: ${error.message}`]);
      }

      // Small delay to prevent rate limiting
      if (i > 0 && i % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    setImportProgress(prev => prev ? { ...prev, isRunning: false, errors } : null);
    setIsImporting(false);

    if (created > 0) {
      toast.success(`${created} فاکتور با موفقیت ایجاد شد`);
    }
    if (errors > 0) {
      toast.error(`${errors} خطا در وارد کردن داده‌ها`);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fa-IR').format(amount) + ' تومان';
  };

  const downloadTemplate = () => {
    const headers = [
      'customer_phone',
      'customer_name',
      'total_amount',
      'paid_amount',
      'status',
      'payment_type',
      'is_installment',
      'notes',
      'due_date',
      'created_date',
      'course_name',
      'item_description',
      'installment_1_amount',
      'installment_1_due_date',
      'installment_2_amount',
      'installment_2_due_date',
      'installment_3_amount',
      'installment_3_due_date',
      'installment_4_amount',
      'installment_4_due_date',
      'installment_5_amount',
      'installment_5_due_date',
      'installment_6_amount',
      'installment_6_due_date',
      'installment_7_amount',
      'installment_7_due_date'
    ];
    
    const sampleRow1 = [
      '09123456789',
      'علی محمدی',
      '1500000',
      '1500000',
      'paid',
      'card_to_card',
      'false',
      'پرداخت کامل',
      '',
      '2024-01-15',
      'دوره آموزشی',
      'شرح محصول',
      '', '', '', '', '', '', '', '', '', '', '', '', '', ''
    ];
    
    const sampleRow2 = [
      '09129876543',
      'فاطمه احمدی',
      '3000000',
      '500000',
      'partially_paid',
      'manual',
      'true',
      'پرداخت اقساطی',
      '',
      '2024-02-01',
      'دوره جامع',
      'ثبت نام با اقساط',
      '500000',
      '2024-02-15',
      '500000',
      '2024-03-15',
      '500000',
      '2024-04-15',
      '500000',
      '2024-05-15',
      '500000',
      '2024-06-15',
      '', '',
      '', ''
    ];
    
    const template = [
      headers.join(','),
      sampleRow1.join(','),
      sampleRow2.join(',')
    ].join('\n');
    
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'financial_import_template.csv';
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Upload Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            وارد کردن داده‌های مالی از فایل CSV/Excel
          </CardTitle>
          <CardDescription>
            فایل CSV داده‌های مالی خود را برای ایجاد فاکتورها بارگذاری کنید
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="financial-csv-file">فایل CSV داده‌های مالی</Label>
            <Input
              id="financial-csv-file"
              type="file"
              accept=".csv"
              onChange={(e) => handleFileUpload(e.target.files?.[0] || null)}
              className="cursor-pointer"
              disabled={isProcessing}
            />
            <div className="text-sm text-muted-foreground space-y-1">
              <p><strong>فیلدهای ضروری:</strong> customer_phone, total_amount</p>
              <p><strong>فیلدهای اختیاری:</strong> customer_name, paid_amount, status (paid/unpaid/partially_paid), payment_type (online/card_to_card/manual), is_installment (true/false), notes, due_date, created_date, course_name, item_description</p>
              <p><strong>فیلدهای اقساط (تا ۷ قسط):</strong> installment_1_amount, installment_1_due_date, ... installment_7_amount, installment_7_due_date</p>
              <p><strong>فرمت تاریخ:</strong> YYYY-MM-DD یا DD/MM/YYYY</p>
            </div>
            {isProcessing && (
              <p className="text-sm text-blue-600">در حال پردازش فایل...</p>
            )}
          </div>

          {/* Download Template */}
          <Button
            variant="outline"
            size="sm"
            onClick={downloadTemplate}
            className="flex items-center gap-2"
          >
            <FileSpreadsheet className="h-4 w-4" />
            دانلود قالب CSV
          </Button>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {previewAnalysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              تجزیه و تحلیل داده‌های مالی
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-4">
              <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{previewAnalysis.totalRows}</div>
                <div className="text-sm text-blue-600">کل ردیف‌ها</div>
              </div>
              <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{previewAnalysis.validRows}</div>
                <div className="text-sm text-green-600">ردیف‌های معتبر</div>
              </div>
              <div className="bg-red-50 dark:bg-red-950 p-3 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{previewAnalysis.invalidRows}</div>
                <div className="text-sm text-red-600">ردیف‌های نامعتبر</div>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-950 p-3 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{previewAnalysis.existingCustomers}</div>
                <div className="text-sm text-yellow-600">مشتریان موجود</div>
              </div>
              <div className="bg-orange-50 dark:bg-orange-950 p-3 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{previewAnalysis.installmentRows}</div>
                <div className="text-sm text-orange-600">فاکتور اقساطی</div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-950 p-3 rounded-lg">
                <div className="text-lg font-bold text-purple-600">{formatCurrency(previewAnalysis.totalAmount)}</div>
                <div className="text-sm text-purple-600">مجموع مبالغ</div>
              </div>
            </div>

            {previewAnalysis.missingData.length > 0 && (
              <div className="bg-red-50 dark:bg-red-950 border-r-4 border-red-400 p-4 rounded">
                <p className="text-sm text-red-700 dark:text-red-300 font-medium mb-2">داده‌های ناقص:</p>
                <div className="max-h-32 overflow-y-auto">
                  {previewAnalysis.missingData.slice(0, 5).map((item, index) => (
                    <p key={index} className="text-xs text-red-600 dark:text-red-400">
                      ردیف {item.row}: {item.reason}
                    </p>
                  ))}
                  {previewAnalysis.missingData.length > 5 && (
                    <p className="text-xs text-red-500 mt-1">
                      و {previewAnalysis.missingData.length - 5} مورد دیگر...
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Data Preview */}
      {showPreview && previewData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              پیش‌نمایش داده‌ها ({Math.min(previewData.length, 10)} از {previewData.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>تلفن</TableHead>
                    <TableHead>نام</TableHead>
                    <TableHead>مبلغ کل</TableHead>
                    <TableHead>پرداخت شده</TableHead>
                    <TableHead>وضعیت</TableHead>
                    <TableHead>اقساط</TableHead>
                    <TableHead>دوره</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.slice(0, 10).map((row, index) => {
                    const installments = getInstallmentsFromRow(row);
                    return (
                      <TableRow key={index}>
                        <TableCell className="font-mono">{row.customer_phone}</TableCell>
                        <TableCell>{row.customer_name || '-'}</TableCell>
                        <TableCell>{row.total_amount ? formatCurrency(parseFloat(row.total_amount)) : '-'}</TableCell>
                        <TableCell>{row.paid_amount ? formatCurrency(parseFloat(row.paid_amount)) : '0'}</TableCell>
                        <TableCell>{row.status || 'unpaid'}</TableCell>
                        <TableCell>
                          {installments.length > 0 ? (
                            <span className="text-orange-600">{installments.length} قسط</span>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>{row.course_name || '-'}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import Progress */}
      {importProgress && (
        <Card>
          <CardHeader>
            <CardTitle>پیشرفت وارد کردن</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={(importProgress.processed / importProgress.total) * 100} />
            <div className="flex justify-between text-sm">
              <span>{importProgress.processed} از {importProgress.total}</span>
              <span className="text-green-600">{importProgress.created} ایجاد شده</span>
              {importProgress.errors > 0 && (
                <span className="text-red-600">{importProgress.errors} خطا</span>
              )}
            </div>
            {importProgress.currentRow && (
              <p className="text-sm text-muted-foreground">
                در حال پردازش: {importProgress.currentRow}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Import Errors */}
      {importErrors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">خطاهای وارد کردن</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {importErrors.map((error, index) => (
                <p key={index} className="text-sm text-red-600">{error}</p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import Button */}
      {previewAnalysis && previewAnalysis.validRows > 0 && (
        <Button
          onClick={handleImport}
          disabled={isImporting}
          className="w-full"
          size="lg"
        >
          {isImporting ? (
            <>در حال وارد کردن...</>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              وارد کردن {previewAnalysis.validRows} فاکتور
            </>
          )}
        </Button>
      )}
    </div>
  );
}
