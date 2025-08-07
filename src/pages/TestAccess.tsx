import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { supabase } from '@/integrations/supabase/client'
import { esanjService } from '@/lib/esanjService'
import { toast } from 'sonner'
import { Brain, Loader2, CheckCircle, ArrowLeft } from 'lucide-react'

interface TestEnrollment {
  id: string
  test_id: string
  phone: string
  full_name: string
  enrollment_status: string
  esanj_employee_id: number
  esanj_uuid: string
  birth_year: number
  sex: string
  tests: {
    title: string
    test_id: number
  }
}

interface Question {
  row: number
  title: string
  answers: Array<{
    id: number
    text: string
  }>
}

interface Questionnaire {
  test: {
    id: number
    title: string
    questions: Question[]
  }
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

  const testEnrollmentId = searchParams.get('test')

  useEffect(() => {
    if (testEnrollmentId) {
      fetchEnrollment()
    } else {
      setLoading(false)
    }
  }, [testEnrollmentId])

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

    setIsLoadingTest(true)
    
    try {
      // Calculate age from birth year
      const currentYear = new Date().getFullYear()
      const persianYear = currentYear - 621 // Approximate conversion
      const age = persianYear - enrollment.birth_year

      // Fetch questionnaire from Esanj
      const questionnaireData = await esanjService.getQuestionnaire(
        enrollment.tests.test_id,
        enrollment.esanj_uuid,
        age,
        enrollment.sex,
        enrollment.esanj_employee_id
      )

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

  const handleAnswerChange = (questionRow: number, answerId: number) => {
    setAnswers(prev => ({
      ...prev,
      [`q${questionRow}`]: answerId
    }))
  }

  const handleSubmitTest = async () => {
    if (!enrollment || !questionnaire) return

    // Check if all questions are answered
    const totalQuestions = questionnaire.test.questions.length
    const answeredQuestions = Object.keys(answers).length

    if (answeredQuestions < totalQuestions) {
      toast.error('لطفاً به تمام سوالات پاسخ دهید')
      return
    }

    setIsSubmitting(true)

    try {
      // Calculate age from birth year
      const currentYear = new Date().getFullYear()
      const persianYear = currentYear - 621
      const age = persianYear - enrollment.birth_year

      // Submit answers to Esanj (this would be via a POST to interpretation endpoint)
      // For now, we'll just check test status and get results
      
      // Mark test as completed
      await supabase
        .from('test_enrollments')
        .update({
          test_completed_at: new Date().toISOString(),
          enrollment_status: 'completed'
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
      <div className="min-h-screen bg-background py-8">
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
    )
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Test Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {questionnaire?.test.title}
          </h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>سوال {Object.keys(answers).length} از {questionnaire?.test.questions.length}</span>
            <div className="flex-1 bg-secondary rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all"
                style={{ 
                  width: `${(Object.keys(answers).length / (questionnaire?.test.questions.length || 1)) * 100}%` 
                }}
              />
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-6">
          {questionnaire?.test.questions.map((question, index) => (
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
                      key={answer.id}
                      className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent transition-colors"
                    >
                      <input
                        type="radio"
                        name={`question_${question.row}`}
                        value={answer.id}
                        checked={answers[`q${question.row}`] === answer.id}
                        onChange={() => handleAnswerChange(question.row, answer.id)}
                        className="text-primary"
                      />
                      <span className="flex-1">{answer.text}</span>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Submit Button */}
        <div className="mt-8 text-center">
          <Button 
            onClick={handleSubmitTest}
            disabled={isSubmitting || Object.keys(answers).length < (questionnaire?.test.questions.length || 0)}
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
      </div>
    </div>
  )
}

export default TestAccess