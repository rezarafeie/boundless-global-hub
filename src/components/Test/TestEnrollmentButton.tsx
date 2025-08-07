import React from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { useRafieiAuth } from '@/hooks/useRafieiAuth'
import RafieiAuth from '@/components/Auth/RafieiAuth'
import { toast } from 'sonner'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'

interface TestEnrollmentButtonProps {
  testId: string
  testSlug: string
  testName: string
  price: number
  className?: string
  children?: React.ReactNode
}

const TestEnrollmentButton: React.FC<TestEnrollmentButtonProps> = ({
  testId,
  testSlug,
  testName,
  price,
  className,
  children
}) => {
  const { user } = useAuth()
  const { 
    isAuthOpen, 
    openAuth, 
    closeAuth, 
    handleAuthSuccess,
    isAuthenticated 
  } = useRafieiAuth({
    onSuccess: (user, token) => {
      handleEnrollment()
    },
    enrollmentMode: true
  })

  const handleEnrollment = async () => {
    if (!user) {
      toast.error('خطا در احراز هویت کاربر')
      return
    }

    try {
      // Create test enrollment record
      const { data: enrollment, error } = await supabase
        .from('test_enrollments')
        .insert({
          user_id: parseInt(user.id.toString()),
          test_id: testId,
          phone: user.messengerData?.phone || user.academyData?.phone || '',
          full_name: user.messengerData?.name || user.academyData?.first_name + ' ' + user.academyData?.last_name || '',
          email: user.messengerData?.email || user.academyData?.email || '',
          payment_amount: price,
          enrollment_status: price === 0 ? 'ready' : 'pending',
          payment_status: price === 0 ? 'completed' : 'pending'
        })
        .select()
        .single()

      if (error) {
        console.error('Enrollment error:', error)
        toast.error('خطا در ثبت‌نام آزمون')
        return
      }

      // Redirect based on price
      if (price === 0) {
        // Free test - redirect to success page
        window.location.href = `/enroll/success?test=${testSlug}&phone=${user.messengerData?.phone || user.academyData?.phone}&enrollment=${enrollment.id}`
      } else {
        // Paid test - redirect to payment
        window.location.href = `/enroll?test=${testSlug}`
      }
    } catch (error) {
      console.error('Enrollment error:', error)
      toast.error('خطا در ثبت‌نام آزمون')
    }
  }

  const handleClick = () => {
    if (isAuthenticated) {
      handleEnrollment()
    } else {
      openAuth()
    }
  }

  return (
    <>
      <Button onClick={handleClick} className={className}>
        {children || (price === 0 ? 'شروع آزمون رایگان' : 'ثبت‌نام در آزمون')}
      </Button>

      <Dialog open={isAuthOpen} onOpenChange={closeAuth}>
        <DialogContent className="p-0 max-w-md">
          <RafieiAuth
            onSuccess={handleAuthSuccess}
            onCancel={closeAuth}
            enrollmentMode={true}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}

export default TestEnrollmentButton