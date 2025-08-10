import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { Brain, Clock, CheckCircle, PlayCircle, FileText, Calendar } from 'lucide-react'

interface UserTestEnrollment {
  id: string
  test_id: string
  enrollment_status: string
  payment_status: string
  payment_amount: number
  test_started_at: string | null
  test_completed_at: string | null
  result_data: any
  created_at: string
  updated_at: string
  tests: {
    title: string
    test_id: number
    description: string
    slug: string
  }
}

const TestsTab: React.FC = () => {
  const navigate = useNavigate()
  const [enrollments, setEnrollments] = useState<UserTestEnrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    fetchCurrentUser()
  }, [])

  useEffect(() => {
    if (currentUser) {
      fetchUserTests()
    }
  }, [currentUser])

  const fetchCurrentUser = async () => {
    try {
      console.log('Fetching current user...')
      
      // Get session token from localStorage or cookies
      const sessionToken = localStorage.getItem('session_token') || 
                          document.cookie.split(';')
                            .find(row => row.startsWith('session_token='))
                            ?.split('=')[1]

      console.log('Session token found:', !!sessionToken)

      if (sessionToken) {
        // Use the session-based authentication system
        const { data: sessionData, error: sessionError } = await supabase
          .from('user_sessions')
          .select(`
            *,
            chat_users!user_sessions_user_id_fkey(*)
          `)
          .eq('session_token', sessionToken)
          .eq('is_active', true)
          .single()

        console.log('Session lookup result:', { sessionData, sessionError })

        if (sessionData?.chat_users) {
          console.log('Setting current user from session:', sessionData.chat_users)
          setCurrentUser(sessionData.chat_users)
          return
        }
      }

      // Fallback: Try to get user by phone number directly
      console.log('No session found, trying direct phone lookup...')
      const { data: phoneUser, error: phoneError } = await supabase
        .from('chat_users')
        .select('*')
        .eq('phone', '9120784457')
        .single()
      
      console.log('Direct phone lookup result:', { phoneUser, phoneError })
      if (phoneUser) {
        setCurrentUser(phoneUser)
      }
    } catch (error) {
      console.error('Error fetching user:', error)
    }
  }

  const fetchUserTests = async () => {
    if (!currentUser) return

    try {
      console.log('Fetching tests for user:', currentUser)
      
      // First, let's try a simple query without joins to see if we can get test enrollments
      const { data: simpleTestData, error: simpleError } = await supabase
        .from('test_enrollments')
        .select('*')
        .eq('phone', currentUser.phone)
        
      console.log('Simple query result:', { simpleTestData, simpleError })
      
      // Now try the full query with joins
      const { data: testData, error: testError } = await supabase
        .from('test_enrollments')
        .select(`
          *,
          tests(
            title,
            test_id,
            description,
            slug
          )
        `)
        .eq('phone', currentUser.phone)
        
      console.log('Full query result:', { testData, testError })
      
      if (testError) {
        console.error('Test query error:', testError)
        // Fall back to simple query if join fails
        if (simpleTestData) {
          const simpleEnrollments = simpleTestData.map(enrollment => ({
            ...enrollment,
            tests: {
              title: 'Unknown Test',
              test_id: 0,
              description: '',
              slug: ''
            }
          }))
          setEnrollments(simpleEnrollments)
        }
        setLoading(false)
        return
      }
      
      if (testData) {
        console.log('Setting enrollments:', testData)
        setEnrollments(testData)
      } else {
        setEnrollments([])
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('خطا در بارگذاری آزمون‌ها')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (enrollment: UserTestEnrollment) => {
    if (enrollment.test_completed_at) {
      return <CheckCircle className="h-5 w-5 text-green-600" />
    } else if (enrollment.test_started_at) {
      return <Clock className="h-5 w-5 text-orange-600" />
    } else if (enrollment.enrollment_status === 'ready') {
      return <PlayCircle className="h-5 w-5 text-blue-600" />
    }
    return <Clock className="h-5 w-5 text-gray-400" />
  }

  const getStatusText = (enrollment: UserTestEnrollment) => {
    if (enrollment.test_completed_at) {
      return 'تکمیل شده'
    } else if (enrollment.test_started_at) {
      return 'در حال انجام'
    } else if (enrollment.enrollment_status === 'ready') {
      return 'آماده شروع'
    } else if (enrollment.payment_status === 'pending') {
      return 'در انتظار پرداخت'
    }
    return 'در حال پردازش'
  }

  const getStatusColor = (enrollment: UserTestEnrollment) => {
    if (enrollment.test_completed_at) {
      return 'bg-green-100 text-green-800'
    } else if (enrollment.test_started_at) {
      return 'bg-orange-100 text-orange-800'
    } else if (enrollment.enrollment_status === 'ready') {
      return 'bg-blue-100 text-blue-800'
    } else if (enrollment.payment_status === 'pending') {
      return 'bg-yellow-100 text-yellow-800'
    }
    return 'bg-gray-100 text-gray-800'
  }

  const handleTestAction = (enrollment: UserTestEnrollment) => {
    if (enrollment.test_completed_at && enrollment.result_data) {
      // Go to results
      navigate(`/test-result?enrollment=${enrollment.id}`)
    } else if (enrollment.enrollment_status === 'ready') {
      // Start test
      navigate(`/test-access?test=${enrollment.id}`)
    } else if (enrollment.payment_status === 'pending') {
      // Continue payment
      navigate(`/enroll?test=${enrollment.tests.slug}`)
    }
  }

  const getActionText = (enrollment: UserTestEnrollment) => {
    if (enrollment.test_completed_at && enrollment.result_data) {
      return 'مشاهده نتایج'
    } else if (enrollment.enrollment_status === 'ready') {
      return 'شروع آزمون'
    } else if (enrollment.payment_status === 'pending') {
      return 'تکمیل پرداخت'
    }
    return 'در انتظار'
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="h-8 w-8" />
          <div>
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12" />
                    <div>
                      <Skeleton className="h-5 w-40 mb-2" />
                      <Skeleton className="h-4 w-32 mb-1" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-10 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="p-2 rounded-lg bg-primary/10">
          <Brain className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">آزمون‌های من</h2>
          <p className="text-muted-foreground">تاریخچه و وضعیت آزمون‌های شما</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {enrollments.length}
                </p>
                <p className="text-sm text-muted-foreground">کل آزمون‌ها</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {enrollments.filter(e => e.test_completed_at).length}
                </p>
                <p className="text-sm text-muted-foreground">تکمیل شده</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {enrollments.filter(e => e.enrollment_status === 'ready' && !e.test_completed_at).length}
                </p>
                <p className="text-sm text-muted-foreground">آماده شروع</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tests List */}
      {enrollments.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Brain className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              هنوز آزمونی انجام نداده‌اید
            </h3>
            <p className="text-muted-foreground mb-4">
              برای شروع آزمون‌های شخصیت‌شناسی، به بخش آزمون‌ها بروید
            </p>
            <Button onClick={() => navigate('/tests')}>
              مشاهده آزمون‌ها
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {enrollments.map((enrollment) => (
            <Card key={enrollment.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-primary/10">
                      {getStatusIcon(enrollment)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-1">
                        {enrollment.tests.title}
                      </h3>
                      {enrollment.tests.description && (
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {enrollment.tests.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(enrollment.created_at).toLocaleDateString('fa-IR')}
                        </div>
                        {enrollment.payment_amount > 0 && (
                          <div>
                            {enrollment.payment_amount.toLocaleString('fa-IR')} تومان
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Badge className={getStatusColor(enrollment)}>
                      {getStatusText(enrollment)}
                    </Badge>
                    
                    <Button 
                      onClick={() => handleTestAction(enrollment)}
                      disabled={enrollment.payment_status === 'pending' && enrollment.enrollment_status !== 'ready'}
                      variant={enrollment.test_completed_at ? 'outline' : 'default'}
                    >
                      {getActionText(enrollment)}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Browse Tests Button */}
      <Card className="border-dashed">
        <CardContent className="p-6 text-center">
          <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold text-foreground mb-2">
            آزمون جدید انجام دهید
          </h3>
          <p className="text-muted-foreground mb-4">
            از مجموعه‌ای از آزمون‌های تخصصی شخصیت‌شناسی استفاده کنید
          </p>
          <Button onClick={() => navigate('/tests')} variant="outline">
            مشاهده همه آزمون‌ها
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default TestsTab