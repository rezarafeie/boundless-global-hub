import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/integrations/supabase/client'
import { esanjService } from '@/lib/esanjService'
import { toast } from 'sonner'
import { CheckCircle, Brain, User, Phone, CreditCard, Loader2 } from 'lucide-react'

interface TestEnrollment {
  id: string
  test_id: string
  phone: string
  full_name: string
  email: string
  payment_status: string
  payment_amount: number
  enrollment_status: string
  esanj_employee_id?: number
  esanj_uuid?: string
  birth_year?: number
  sex?: string
  tests: {
    title: string
    test_id: number
    price: number
  }
}

const TestEnrollmentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [enrollment, setEnrollment] = useState<TestEnrollment | null>(null)
  const [loading, setLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showEmployeeForm, setShowEmployeeForm] = useState(false)
  const [birthYear, setBirthYear] = useState('')
  const [sex, setSex] = useState('')
  const [processingMessage, setProcessingMessage] = useState('آزمون شما در حال آماده‌سازی است...')

  const testSlug = searchParams.get('test')
  const phone = searchParams.get('phone')
  const enrollmentId = searchParams.get('enrollment')

  useEffect(() => {
    if (enrollmentId) {
      fetchEnrollment()
    } else {
      setLoading(false)
    }
  }, [enrollmentId])

  useEffect(() => {
    if (enrollment && enrollment.enrollment_status !== 'ready') {
      checkAndProcessAutomatically()
    }
  }, [enrollment])

  const fetchEnrollment = async () => {
    try {
      const { data, error } = await supabase
        .from('test_enrollments')
        .select(`
          *,
          tests!inner(
            title,
            test_id,
            price
          )
        `)
        .eq('id', enrollmentId)
        .single()

      if (error) {
        console.error('Error fetching enrollment:', error)
        toast.error('خطا در بارگذاری اطلاعات ثبت‌نام')
        return
      }

      setEnrollment(data)
    } catch (error) {
      console.error('Error:', error)
      toast.error('خطا در بارگذاری اطلاعات')
    } finally {
      setLoading(false)
    }
  }

  const checkAndProcessAutomatically = async () => {
    if (!enrollment || !phone) return
    
    setIsProcessing(true)
    
    try {
      // First check if user has birth_year and sex in chat_users
      setProcessingMessage('بررسی اطلاعات کاربر...')
      const { data: userData } = await supabase
        .from('chat_users')
        .select('birth_year, sex')
        .eq('phone', phone)
        .single()

      if (userData?.birth_year && userData?.sex) {
        // User has complete data, process automatically
        setProcessingMessage('آماده‌سازی آزمون...')
        await processEsanjTest(userData.birth_year, userData.sex)
        return
      }

      // Check if user exists in Esanj database
      setProcessingMessage('جستجو در پایگاه داده...')
      try {
        const employee = await esanjService.findOrCreateEmployee(phone)
        
        if (employee.birth_year && employee.sex) {
          // Found in Esanj, update local database and process
          setProcessingMessage('بروزرسانی اطلاعات...')
          
          // Update chat_users
          await supabase
            .from('chat_users')
            .update({
              birth_year: employee.birth_year,
              sex: employee.sex
            })
            .eq('phone', phone)

          // Process the test
          setProcessingMessage('آماده‌سازی آزمون...')
          await processEsanjTest(employee.birth_year, employee.sex)
          return
        }
      } catch (error) {
        console.log('User not found in Esanj database, will show form')
      }

      // Show form to collect information
      setIsProcessing(false)
      setShowEmployeeForm(true)
      
    } catch (error) {
      console.error('Error in automatic processing:', error)
      setIsProcessing(false)
      setShowEmployeeForm(true)
    }
  }

  const processEsanjTest = async (userBirthYear: number, userSex: string) => {
    if (!enrollment) return

    try {
      // Find or create employee in Esanj
      const employee = await esanjService.findOrCreateEmployee(
        enrollment.phone,
        {
          name: enrollment.full_name,
          phone_number: enrollment.phone,
          birth_year: userBirthYear,
          sex: userSex
        }
      )

      // Generate UUID for this test session
      const testUuid = crypto.randomUUID()

      console.log('Updating enrollment with data:', {
        enrollment_id: enrollment.id,
        esanj_employee_id: employee.id,
        esanj_uuid: testUuid,
        birth_year: userBirthYear,
        sex: userSex,
        enrollment_status: 'ready'
      })

      // Update enrollment with Esanj details
      const { error: updateError } = await supabase
        .from('test_enrollments')
        .update({
          esanj_employee_id: employee.id,
          esanj_uuid: testUuid,
          birth_year: userBirthYear,
          sex: userSex,
          enrollment_status: 'ready'
        })
        .eq('id', enrollment.id)

      if (updateError) {
        console.error('Error updating test enrollment:', updateError)
        throw updateError
      }

      // Update chat_users with birth_year and sex if not already set
      await supabase
        .from('chat_users')
        .update({
          birth_year: userBirthYear,
          sex: userSex
        })
        .eq('phone', enrollment.phone)

      setProcessingMessage('آزمون آماده شد!')
      
      // Verify the data was actually saved by fetching the updated record
      const { data: verifyData, error: verifyError } = await supabase
        .from('test_enrollments')
        .select('esanj_employee_id, esanj_uuid, birth_year, sex, enrollment_status')
        .eq('id', enrollment.id)
        .single()

      if (verifyError) {
        console.error('Error verifying enrollment update:', verifyError)
      } else {
        console.log('Verified enrollment data after update:', verifyData)
      }
      
      // Refresh enrollment data
      await fetchEnrollment()
      setIsProcessing(false)
      toast.success('آزمون با موفقیت آماده شد')
      
    } catch (error) {
      console.error('Error processing Esanj test:', error)
      setIsProcessing(false)
      toast.error('خطا در آماده‌سازی آزمون')
      setShowEmployeeForm(true)
    }
  }

  const handleCreateEsanjTest = async () => {
    if (!enrollment || !birthYear || !sex) {
      toast.error('لطفاً تمام اطلاعات را وارد کنید')
      return
    }

    setIsProcessing(true)
    
    try {
      await processEsanjTest(parseInt(birthYear), sex)
      setShowEmployeeForm(false)
    } catch (error) {
      console.error('Error creating Esanj test:', error)
      toast.error('خطا در آماده‌سازی آزمون')
      setIsProcessing(false)
    }
  }

  const handleStartTest = () => {
    if (enrollment?.enrollment_status === 'ready') {
      console.log('Starting test with enrollment data:', {
        enrollment_status: enrollment.enrollment_status,
        esanj_employee_id: enrollment.esanj_employee_id,
        esanj_uuid: enrollment.esanj_uuid,
        birth_year: enrollment.birth_year,
        sex: enrollment.sex
      })
      navigate(`/access?test=${enrollment.id}`)
    } else {
      setShowEmployeeForm(true)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>در حال بارگذاری...</span>
        </div>
      </div>
    )
  }

  if (!enrollment) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <h3 className="text-lg font-semibold mb-2">ثبت‌نام یافت نشد</h3>
            <p className="text-muted-foreground mb-4">
              اطلاعات ثبت‌نام شما یافت نشد.
            </p>
            <Button onClick={() => navigate('/tests')}>
              بازگشت به لیست آزمون‌ها
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full bg-green-100 dark:bg-green-900/20">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            ثبت‌نام موفقیت‌آمیز
          </h1>
          <p className="text-muted-foreground">
            ثبت‌نام شما در آزمون با موفقیت انجام شد
          </p>
        </div>

        {/* Enrollment Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              جزئیات ثبت‌نام آزمون
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">نام:</span>
                <span className="font-medium">{enrollment.full_name}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">تلفن:</span>
                <span className="font-medium">{enrollment.phone}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">آزمون:</span>
                <span className="font-medium">{enrollment.tests.title}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">مبلغ:</span>
                <span className="font-medium">
                  {enrollment.tests.price === 0 ? 'رایگان' : `${enrollment.tests.price.toLocaleString('fa-IR')} تومان`}
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Badge 
                variant={enrollment.payment_status === 'completed' ? 'default' : 'secondary'}
              >
                {enrollment.payment_status === 'completed' ? 'پرداخت موفق' : 'در انتظار پرداخت'}
              </Badge>
              <Badge 
                variant={enrollment.enrollment_status === 'ready' ? 'default' : 'secondary'}
              >
                {enrollment.enrollment_status === 'ready' ? 'آماده شروع' : 'در حال آماده‌سازی'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Action Section */}
        <Card>
          <CardHeader>
            <CardTitle>شروع آزمون</CardTitle>
          </CardHeader>
          <CardContent>
            {enrollment.enrollment_status === 'ready' ? (
              <div className="text-center space-y-4">
                <p className="text-green-600 font-medium">
                  آزمون شما آماده است! می‌توانید الان شروع کنید.
                </p>
                <Button onClick={handleStartTest} size="lg" className="w-full">
                  شروع آزمون
                </Button>
              </div>
            ) : isProcessing ? (
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-muted-foreground">{processingMessage}</span>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <p className="text-muted-foreground">
                  برای شروع آزمون، ابتدا باید اطلاعات تکمیلی را وارد کنید.
                </p>
                <Button onClick={handleStartTest} size="lg" className="w-full">
                  آماده‌سازی آزمون
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Employee Form Modal */}
        <Dialog open={showEmployeeForm} onOpenChange={setShowEmployeeForm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>تکمیل اطلاعات آزمون</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="birthYear">سال تولد (شمسی)</Label>
                <Input
                  id="birthYear"
                  type="number"
                  placeholder="مثال: 1375"
                  value={birthYear}
                  onChange={(e) => setBirthYear(e.target.value)}
                  min="1300"
                  max="1420"
                />
              </div>
              
              <div>
                <Label htmlFor="sex">جنسیت</Label>
                <Select value={sex} onValueChange={setSex}>
                  <SelectTrigger>
                    <SelectValue placeholder="انتخاب کنید" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">مرد</SelectItem>
                    <SelectItem value="female">زن</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                onClick={handleCreateEsanjTest}
                disabled={isProcessing || !birthYear || !sex}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    در حال آماده‌سازی...
                  </>
                ) : (
                  'آماده‌سازی آزمون'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default TestEnrollmentSuccess