import React, { useState, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { supabase } from '@/integrations/supabase/client'
import { esanjService } from '@/lib/esanjService'
import { toast } from 'sonner'
import { Brain, Loader2, CheckCircle, ArrowLeft } from 'lucide-react'
import Header from '@/components/Layout/Header'

interface TestEnrollment {
  id: string
  test_id: string
  phone: string
  full_name: string
  enrollment_status: string
  esanj_employee_id: number | null
  esanj_uuid: string | null
  birth_year: number | null
  sex: string | null
  tests: {
    title: string
    test_id: number
    use_html_questionnaire: boolean
  }
}

interface Question {
  row: number
  title: string
  answers: Array<{
    row: number
    title: string
    value: string
  }>
}

interface Questionnaire {
  test: {
    id?: number
    title: string
    test_id?: number
  }
  questions?: Question[]
  isHtml?: boolean
  htmlContent?: string
}

const TestAccess: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [enrollment, setEnrollment] = useState<TestEnrollment | null>(null)
  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null)
  const [loading, setLoading] = useState(true)
  const [isLoadingTest, setIsLoadingTest] = useState(false)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [testStarted, setTestStarted] = useState(false)
  const htmlContainerRef = useRef<HTMLDivElement>(null)

  const testEnrollmentId = searchParams.get('test')
  const courseSlug = searchParams.get('course')
  const isDirectAccess = searchParams.has('direct')

  useEffect(() => {
    if (testEnrollmentId) {
      fetchEnrollment()
    } else if (courseSlug || isDirectAccess) {
      // Redirect to course access page with all URL parameters preserved
      const params = new URLSearchParams()
      
      // Copy all search params to preserve the complete URL structure
      searchParams.forEach((value, key) => {
        params.set(key, value)
      })
      
      navigate(`/course-access?${params.toString()}`)
      return
    } else {
      setLoading(false)
    }
  }, [testEnrollmentId, courseSlug, isDirectAccess, navigate, searchParams])

  const fetchEnrollment = async () => {
    try {
      const { data, error } = await supabase
        .from('test_enrollments')
        .select(`
          *,
          tests!inner(
            title,
            test_id,
            use_html_questionnaire
          )
        `)
        .eq('id', testEnrollmentId)
        .single()

      if (error) {
        console.error('Error fetching enrollment:', error)
        toast.error('خطا در بارگذاری اطلاعات آزمون')
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

  const handleStartTest = async () => {
    if (!enrollment) return

    // Check if Esanj data is missing - redirect to enrollment success to complete setup
    if (!enrollment.esanj_employee_id || !enrollment.esanj_uuid || !enrollment.birth_year || !enrollment.sex) {
      toast.error('اطلاعات آزمون کامل نیست. در حال انتقال به صفحه تکمیل اطلاعات...')
      setTimeout(() => {
        navigate(`/enroll/success?test=-ept&phone=${enrollment.phone}&enrollment=${enrollment.id}&status=OK&authority=FREE_TEST`)
      }, 1500)
      return
    }

    setIsLoadingTest(true)
    
    try {
      // Calculate age from birth year (stored as Gregorian year)
      const currentYear = new Date().getFullYear()
      const age = currentYear - enrollment.birth_year // Simple age calculation using Gregorian years
      
      console.log('Age calculation for Esanj:', {
        currentYear,
        birthYear: enrollment.birth_year,
        calculatedAge: age
      })

      // First check/start the test status
      try {
        console.log('Checking test status before fetching questionnaire...')
        await esanjService.checkTestStatus(enrollment.tests.test_id, enrollment.esanj_employee_id)
      } catch (statusError) {
        console.log('Test status check failed, continuing anyway:', statusError)
      }

      // Fetch questionnaire from Esanj - use HTML version if enabled
      let questionnaireData;
      if (enrollment.tests.use_html_questionnaire) {
        console.log('Using HTML questionnaire API...')
        try {
          const htmlContent = await esanjService.getHtmlQuestionnaire(
            enrollment.tests.test_id,
            age,
            enrollment.sex,
            enrollment.esanj_uuid,
            enrollment.esanj_employee_id
          )
          
          // Check if HTML content is valid and not empty
          const isValidHtml = htmlContent && 
                             htmlContent.trim().length > 50 && 
                             !htmlContent.includes('{"response":"') &&
                             htmlContent.includes('<') && 
                             htmlContent.includes('>')
          
          if (isValidHtml) {
            questionnaireData = {
              isHtml: true,
              htmlContent: htmlContent,
              test: {
                title: enrollment.tests.title,
                test_id: enrollment.tests.test_id
              }
            }
          } else {
            console.log('HTML content appears invalid, falling back to JSON questionnaire')
            console.log('HTML content preview:', htmlContent?.substring(0, 200))
            throw new Error('Invalid HTML content received')
          }
        } catch (htmlError) {
          console.log('HTML questionnaire failed, falling back to JSON:', htmlError)
          // Fallback to JSON questionnaire
          questionnaireData = await esanjService.getQuestionnaire(enrollment.tests.test_id)
        }
      } else {
        console.log('Using JSON questionnaire API...')
        questionnaireData = await esanjService.getQuestionnaire(enrollment.tests.test_id)
      }

      setQuestionnaire(questionnaireData)
      setTestStarted(true)

      // Update enrollment status
      await supabase
        .from('test_enrollments')
        .update({
          test_started_at: new Date().toISOString(),
          enrollment_status: 'in_progress'
        })
        .eq('id', enrollment.id)

    } catch (error) {
      console.error('Error starting test:', error)
      toast.error('خطا در شروع آزمون')
    } finally {
      setIsLoadingTest(false)
    }
  }

  const handleAnswerChange = (questionRow: number, answerValue: number) => {
    setAnswers(prev => ({
      ...prev,
      [`q${questionRow}`]: answerValue
    }))
  }

  useEffect(() => {
    if (!questionnaire?.isHtml || !testStarted) return
    const container = htmlContainerRef.current
    if (!container) return

    const form = container.querySelector('form') as HTMLFormElement | null
    if (!form) return

    const onSubmit = async (e: Event) => {
      e.preventDefault()
      if (!enrollment) return
      try {
        setIsSubmitting(true)

        // Collect all question groups like q1..qN and ensure each has a checked value
        const radioInputs = Array.from(container.querySelectorAll('input[type="radio"][name^="q"]')) as HTMLInputElement[]
        const groupNames = Array.from(new Set(radioInputs.map(i => i.name)))

        const esanjAnswers = [] as Array<{ row: number; value: number }>
        for (const name of groupNames) {
          const checked = container.querySelector(`input[type="radio"][name="${name}"]:checked`) as HTMLInputElement | null
          if (!checked) {
            toast.error('لطفاً به تمام سوالات پاسخ دهید')
            setIsSubmitting(false)
            return
          }
          const row = parseInt(name.replace('q', ''))
          const value = Number(checked.value)
          if (Number.isFinite(row) && Number.isFinite(value)) {
            esanjAnswers.push({ row, value })
          }
        }

        // Calculate age
        const currentYear = new Date().getFullYear()
        const age = currentYear - (enrollment.birth_year || currentYear)

        // Handle UUID reuse error by generating new UUID
        let uuid = enrollment.esanj_uuid
        let submitResult: any
        
        try {
          submitResult = await esanjService.submitTest(
            enrollment.tests.test_id,
            uuid,
            enrollment.esanj_employee_id || 0,
            age,
            enrollment.sex || 'male',
            esanjAnswers
          )
        } catch (error: any) {
          if (error.message?.includes('UUID IS Exists') || error.message?.includes('Tested before')) {
            // Generate new UUID and try again
            uuid = crypto.randomUUID()
            
            // Update enrollment with new UUID
            await supabase
              .from('test_enrollments')
              .update({ esanj_uuid: uuid })
              .eq('id', enrollment.id)
            
            // Retry with new UUID
            submitResult = await esanjService.submitTest(
              enrollment.tests.test_id,
              uuid,
              enrollment.esanj_employee_id || 0,
              age,
              enrollment.sex || 'male',
              esanjAnswers
            )
          } else {
            throw error
          }
        }

        await supabase
          .from('test_enrollments')
          .update({
            test_completed_at: new Date().toISOString(),
            enrollment_status: 'completed',
            result_data: submitResult.result
          })
          .eq('id', enrollment.id)

        toast.success('آزمون با موفقیت ارسال شد')
        navigate(`/test-result?enrollment=${enrollment.id}`)
      } catch (err) {
        console.error('HTML submit exception:', err)
        toast.error('خطا در ارسال آزمون')
      } finally {
        setIsSubmitting(false)
      }
    }

    form.addEventListener('submit', onSubmit)
    return () => {
      form.removeEventListener('submit', onSubmit)
    }
  }, [questionnaire?.isHtml, testStarted, enrollment, navigate])

  const handleSubmitTest = async () => {
    if (!enrollment || !questionnaire) return

    // For HTML questionnaire, we handle submission differently
    if (questionnaire.isHtml) {
      toast.info('برای آزمون HTML، از فرم درون صفحه استفاده کنید')
      return
    }

    // Check if all questions are answered (only for JSON questionnaire)
    const totalQuestions = questionnaire.questions?.length || 0
    const answeredQuestions = Object.keys(answers).length

    if (answeredQuestions < totalQuestions) {
      toast.error('لطفاً به تمام سوالات پاسخ دهید')
      return
    }

    setIsSubmitting(true)

    try {
      // Ensure we have all required data
      if (!enrollment.esanj_employee_id || !enrollment.esanj_uuid || !enrollment.birth_year || !enrollment.sex) {
        toast.error('اطلاعات آزمون ناقص است')
        return
      }

      // Calculate age from birth year (stored as Gregorian year)
      const currentYear = new Date().getFullYear()
      const age = currentYear - enrollment.birth_year // Simple age calculation using Gregorian years

      // Prepare answers for Esanj API
      const esanjAnswers = Object.entries(answers).map(([key, value]) => ({
        row: parseInt(key.replace('q', '')),
        value: Number(value)
      }))

      // Submit test using the service method
      let uuid = enrollment.esanj_uuid
      let submitResult: any
      
      try {
        submitResult = await esanjService.submitTest(
          enrollment.tests.test_id,
          uuid,
          enrollment.esanj_employee_id,
          age,
          enrollment.sex,
          esanjAnswers
        )
      } catch (error: any) {
        if (error.message?.includes('UUID IS Exists') || error.message?.includes('Tested before')) {
          // Generate new UUID and try again
          uuid = crypto.randomUUID()
          
          // Update enrollment with new UUID
          await supabase
            .from('test_enrollments')
            .update({ esanj_uuid: uuid })
            .eq('id', enrollment.id)
          
          // Retry with new UUID
          submitResult = await esanjService.submitTest(
            enrollment.tests.test_id,
            uuid,
            enrollment.esanj_employee_id,
            age,
            enrollment.sex,
            esanjAnswers
          )
        } else {
          throw error
        }
      }

      // Mark test as completed and store result UUID
      await supabase
        .from('test_enrollments')
        .update({
          test_completed_at: new Date().toISOString(),
          enrollment_status: 'completed',
          result_data: submitResult.result
        })
        .eq('id', enrollment.id)

      toast.success('آزمون با موفقیت ارسال شد')
      
      // Redirect to result page
      navigate(`/test-result?enrollment=${enrollment.id}`)

    } catch (error) {
      console.error('Error submitting test:', error)
      toast.error('خطا در ارسال آزمون')
    } finally {
      setIsSubmitting(false)
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

  if (!testStarted) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-20 pb-8">
          <div className="container mx-auto px-4 max-w-2xl">
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/tests')}
              className="rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">دسترسی به آزمون</h1>
              <p className="text-muted-foreground">آماده شروع آزمون هستید</p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                {enrollment.tests.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  نکات مهم قبل از شروع آزمون:
                </h3>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• در محیط آرام و بدون حواس‌پرتی آزمون را انجام دهید</li>
                  <li>• به تمام سوالات با دقت پاسخ دهید</li>
                  <li>• صادقانه و بر اساس احساس واقعی خود پاسخ دهید</li>
                  <li>• پس از شروع، امکان توقف آزمون وجود ندارد</li>
                </ul>
              </div>

              <div className="text-center">
                <Button 
                  onClick={handleStartTest}
                  disabled={isLoadingTest}
                  size="lg"
                  className="w-full"
                >
                  {isLoadingTest ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      در حال بارگذاری آزمون...
                    </>
                  ) : (
                    'شروع آزمون'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-20 pb-8">
        <div className="container mx-auto px-4 max-w-4xl">
        {/* Test Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {questionnaire?.test.title}
          </h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {questionnaire?.isHtml ? (
              <span>آزمون HTML</span>
            ) : (
              <>
                <span>سوال {Object.keys(answers).length} از {questionnaire?.questions?.length || 0}</span>
                <div className="flex-1 bg-secondary rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ 
                      width: `${(Object.keys(answers).length / (questionnaire?.questions?.length || 1)) * 100}%` 
                    }}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        {questionnaire?.isHtml ? (
          // Render HTML questionnaire
          <div className="space-y-6">
            <Card className="border-border">
              <CardContent className="p-6">
                <div 
                  ref={htmlContainerRef}
                  dangerouslySetInnerHTML={{ __html: questionnaire.htmlContent || '' }}
                  className="prose prose-sm max-w-none"
                />
              </CardContent>
            </Card>
          </div>
        ) : (
          // Render JSON questionnaire
          <div className="space-y-6">
            {questionnaire?.questions?.map((question, index) => (
              <Card key={question.row} className="border-border">
                <CardHeader>
                  <CardTitle className="text-lg font-medium">
                    {index + 1}. {question.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {question.answers.map((answer) => (
                      <label
                        key={answer.row}
                        className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent transition-colors"
                      >
                        <input
                          type="radio"
                          name={`question_${question.row}`}
                          value={parseInt(answer.value)}
                          checked={answers[`q${question.row}`] === parseInt(answer.value)}
                          onChange={() => handleAnswerChange(question.row, parseInt(answer.value))}
                          className="text-primary"
                        />
                        <span className="flex-1">{answer.title}</span>
                      </label>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )) || <div>بدون سوال</div>}
          </div>
        )}

        {/* Submit Button - Only show for JSON questionnaire */}
        {!questionnaire?.isHtml && (
          <div className="mt-8 text-center">
            <Button 
              onClick={handleSubmitTest}
              disabled={isSubmitting || Object.keys(answers).length < (questionnaire?.questions?.length || 0)}
              size="lg"
              className="w-full max-w-md"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  در حال ارسال...
                </>
              ) : (
                'ارسال آزمون'
              )}
            </Button>
          </div>
        )}
        </div>
      </div>
    </div>
  )
}

export default TestAccess