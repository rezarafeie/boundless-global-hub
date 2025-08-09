import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { supabase } from '@/integrations/supabase/client'
import { esanjService } from '@/lib/esanjService'
import { toast } from 'sonner'
import { Brain, Loader2, Download, Share2, ArrowLeft, CheckCircle } from 'lucide-react'

interface TestEnrollment {
  id: string
  esanj_uuid: string
  result_data: any
  esanj_employee_id: number
  tests: {
    title: string
    test_id: number
  }
}

const TestResult: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [enrollment, setEnrollment] = useState<TestEnrollment | null>(null)
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isLoadingResult, setIsLoadingResult] = useState(false)

  const enrollmentId = searchParams.get('enrollment')

  useEffect(() => {
    if (enrollmentId) {
      fetchEnrollment()
    } else {
      setLoading(false)
    }
  }, [enrollmentId])

  const fetchEnrollment = async () => {
    try {
      const { data, error } = await supabase
        .from('test_enrollments')
        .select(`
          *,
          tests!inner(
            title,
            test_id
          )
        `)
        .eq('id', enrollmentId)
        .single()

      if (error) {
        console.error('Error fetching enrollment:', error)
        toast.error('خطا در بارگذاری اطلاعات آزمون')
        return
      }

      setEnrollment(data)
      
      // If result is already cached, show it
      if (data.result_data) {
        setResult(data.result_data)
      } else {
        // Fetch result from Esanj
        await fetchTestResult(data.esanj_uuid)
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('خطا در بارگذاری اطلاعات')
    } finally {
      setLoading(false)
    }
  }

  const fetchTestResult = async (uuid: string) => {
    setIsLoadingResult(true)
    
    try {
      // Get result from Esanj directly using UUID
      const response = await esanjService.getTestResult(uuid, 'html')
      
      // Extract the actual result data from the response
      const resultData = response?.result || response
      
      setResult(resultData)

      // Cache result in database
      if (enrollment) {
        await supabase
          .from('test_enrollments')
          .update({
            result_data: resultData
          })
          .eq('id', enrollment.id)
      }

      toast.success('نتایج آزمون بارگذاری شد')
    } catch (error) {
      console.error('Error fetching result:', error)
      toast.error('خطا در بارگذاری نتایج آزمون')
    } finally {
      setIsLoadingResult(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `نتایج آزمون ${enrollment?.tests.title}`,
          text: 'نتایج آزمون شخصیت‌شناسی من',
          url: window.location.href
        })
      } catch (error) {
        console.log('Error sharing:', error)
      }
    } else {
      // Fallback: copy URL to clipboard
      navigator.clipboard.writeText(window.location.href)
      toast.success('لینک کپی شد')
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
            <h3 className="text-lg font-semibold mb-2">آزمون یافت نشد</h3>
            <p className="text-muted-foreground mb-4">
              اطلاعات آزمون شما یافت نشد.
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
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8 no-print">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/tests')}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">نتایج آزمون</h1>
            <p className="text-muted-foreground">{enrollment.tests.title}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              اشتراک‌گذاری
            </Button>
            <Button variant="outline" onClick={handlePrint}>
              <Download className="h-4 w-4 mr-2" />
              چاپ
            </Button>
          </div>
        </div>

        {/* Success Message */}
        <Card className="mb-6 border-green-200 dark:border-green-800">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/20">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-green-900 dark:text-green-100">
                  آزمون با موفقیت تکمیل شد
                </h3>
                <p className="text-sm text-green-700 dark:text-green-300">
                  نتایج تحلیل شخصیت شما آماده است
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Result Content */}
        {isLoadingResult ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">در حال پردازش نتایج...</h3>
              <p className="text-muted-foreground">
                لطفاً صبر کنید، نتایج آزمون در حال آماده‌سازی است.
              </p>
            </CardContent>
          </Card>
        ) : result ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                تحلیل نتایج آزمون
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Display result content */}
              <div className="space-y-6">
                {result?.result ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Personal Information */}
                    <div className="bg-card p-6 rounded-lg border">
                      <h3 className="text-lg font-semibold mb-4 text-primary">اطلاعات فردی</h3>
                      <div className="space-y-2">
                        <p><span className="font-medium">جنسیت:</span> {result.result.sex === 'male' ? 'مرد' : 'زن'}</p>
                        <p><span className="font-medium">سن:</span> {result.result.age} سال</p>
                        {result.result.petitioner && (
                          <p><span className="font-medium">شناسه متقاضی:</span> {result.result.petitioner}</p>
                        )}
                      </div>
                    </div>

                    {/* Test Scores Summary */}
                    <div className="bg-card p-6 rounded-lg border">
                      <h3 className="text-lg font-semibold mb-4 text-primary">خلاصه نتایج</h3>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          تعداد کل سوالات: {Object.keys(result.result).filter(key => key.startsWith('q')).length}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          آزمون با موفقیت تکمیل شده است
                        </p>
                      </div>
                    </div>
                  </div>
                ) : typeof result === 'string' ? (
                  <div dangerouslySetInnerHTML={{ __html: result }} />
                ) : (
                  <div className="bg-card p-6 rounded-lg border">
                    <h3 className="text-lg font-semibold mb-4">نتایج آزمون</h3>
                    <pre className="whitespace-pre-wrap bg-secondary p-4 rounded-lg text-sm overflow-auto max-h-96">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">نتایج در دسترس نیست</h3>
              <p className="text-muted-foreground mb-4">
                نتایج آزمون هنوز آماده نشده است. لطفاً بعداً مراجعه کنید.
              </p>
              <Button 
                onClick={() => fetchTestResult(enrollment.esanj_uuid)}
                disabled={isLoadingResult}
              >
                تلاش مجدد
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-muted-foreground no-print">
          <p>
            این نتایج توسط سیستم تحلیل Esanj تولید شده است.
          </p>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .container {
            max-width: none !important;
            padding: 0 !important;
          }
        }
      `}</style>
    </div>
  )
}

export default TestResult