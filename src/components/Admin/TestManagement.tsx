import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { supabase } from '@/integrations/supabase/client'
import { esanjService } from '@/lib/esanjService'
import { toast } from 'sonner'
import { Brain, RefreshCw, Settings, Plus, Edit, Trash2, Eye } from 'lucide-react'

interface Test {
  id: string
  test_id: number
  title: string
  description: string
  price: number
  slug: string
  count_ready: number
  count_used: number
  is_active: boolean
  created_at: string
  updated_at: string
}

interface TestEnrollment {
  id: string
  user_id: number
  test_id: string
  phone: string
  full_name: string
  email: string
  payment_status: string
  payment_amount: number
  enrollment_status: string
  esanj_employee_id: number
  esanj_uuid: string
  birth_year: number
  sex: string
  test_started_at: string
  test_completed_at: string
  created_at: string
  updated_at: string
  tests: {
    title: string
    test_id: number
  }
}

const TestManagement: React.FC = () => {
  const [tests, setTests] = useState<Test[]>([])
  const [enrollments, setEnrollments] = useState<TestEnrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [syncingTests, setSyncingTests] = useState(false)
  const [editingTest, setEditingTest] = useState<Test | null>(null)
  const [activeTab, setActiveTab] = useState<'tests' | 'enrollments'>('tests')

  useEffect(() => {
    fetchTests()
    fetchEnrollments()
  }, [])

  const fetchTests = async () => {
    try {
      const { data, error } = await supabase
        .from('tests')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching tests:', error)
        toast.error('خطا در بارگذاری آزمون‌ها')
        return
      }

      setTests(data || [])
    } catch (error) {
      console.error('Error:', error)
      toast.error('خطا در بارگذاری آزمون‌ها')
    } finally {
      setLoading(false)
    }
  }

  const fetchEnrollments = async () => {
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
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching enrollments:', error)
        return
      }

      setEnrollments(data || [])
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const syncTestsFromEsanj = async () => {
    setSyncingTests(true)
    try {
      await esanjService.syncTestBank()
      toast.success('آزمون‌ها با موفقیت همگام‌سازی شد')
      await fetchTests()
    } catch (error) {
      console.error('Error syncing tests:', error)
      toast.error('خطا در همگام‌سازی آزمون‌ها')
    } finally {
      setSyncingTests(false)
    }
  }

  const updateTest = async (test: Test) => {
    try {
      const { error } = await supabase
        .from('tests')
        .update({
          price: test.price,
          slug: test.slug,
          description: test.description,
          is_active: test.is_active
        })
        .eq('id', test.id)

      if (error) {
        console.error('Error updating test:', error)
        toast.error('خطا در بروزرسانی آزمون')
        return
      }

      toast.success('آزمون با موفقیت بروزرسانی شد')
      await fetchTests()
      setEditingTest(null)
    } catch (error) {
      console.error('Error:', error)
      toast.error('خطا در بروزرسانی آزمون')
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'در انتظار' },
      ready: { color: 'bg-blue-100 text-blue-800', label: 'آماده' },
      in_progress: { color: 'bg-orange-100 text-orange-800', label: 'در حال انجام' },
      completed: { color: 'bg-green-100 text-green-800', label: 'تکمیل شده' },
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || 
                  { color: 'bg-gray-100 text-gray-800', label: status }
    
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    )
  }

  const getPaymentBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'در انتظار پرداخت' },
      success: { color: 'bg-green-100 text-green-800', label: 'پرداخت موفق' },
      completed: { color: 'bg-green-100 text-green-800', label: 'تکمیل شده' },
      failed: { color: 'bg-red-100 text-red-800', label: 'پرداخت ناموفق' },
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || 
                  { color: 'bg-gray-100 text-gray-800', label: status }
    
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>در حال بارگذاری...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            مدیریت آزمون‌ها
          </h1>
          <p className="text-muted-foreground">
            مدیریت آزمون‌های Esanj و ثبت‌نام‌ها
          </p>
        </div>
        <Button onClick={syncTestsFromEsanj} disabled={syncingTests}>
          {syncingTests ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              در حال همگام‌سازی...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              همگام‌سازی از Esanj
            </>
          )}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
        <Button
          variant={activeTab === 'tests' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('tests')}
        >
          آزمون‌ها ({tests.length})
        </Button>
        <Button
          variant={activeTab === 'enrollments' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('enrollments')}
        >
          ثبت‌نام‌ها ({enrollments.length})
        </Button>
      </div>

      {/* Tests Tab */}
      {activeTab === 'tests' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              لیست آزمون‌ها
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>عنوان آزمون</TableHead>
                    <TableHead>قیمت</TableHead>
                    <TableHead>موجود</TableHead>
                    <TableHead>استفاده شده</TableHead>
                    <TableHead>وضعیت</TableHead>
                    <TableHead>عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tests.map((test) => (
                    <TableRow key={test.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{test.title}</div>
                          <div className="text-sm text-muted-foreground">
                            آزمون #{test.test_id} • {test.slug}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {test.price === 0 ? (
                          <Badge variant="outline" className="bg-green-50">رایگان</Badge>
                        ) : (
                          `${test.price.toLocaleString('fa-IR')} تومان`
                        )}
                      </TableCell>
                      <TableCell>{test.count_ready}</TableCell>
                      <TableCell>{test.count_used}</TableCell>
                      <TableCell>
                        <Badge variant={test.is_active ? 'default' : 'outline'}>
                          {test.is_active ? 'فعال' : 'غیرفعال'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setEditingTest(test)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>ویرایش آزمون</DialogTitle>
                              </DialogHeader>
                              {editingTest && (
                                <TestEditForm 
                                  test={editingTest}
                                  onSave={updateTest}
                                  onCancel={() => setEditingTest(null)}
                                />
                              )}
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enrollments Tab */}
      {activeTab === 'enrollments' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              ثبت‌نام‌های آزمون
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>کاربر</TableHead>
                    <TableHead>آزمون</TableHead>
                    <TableHead>مبلغ پرداخت</TableHead>
                    <TableHead>وضعیت پرداخت</TableHead>
                    <TableHead>وضعیت آزمون</TableHead>
                    <TableHead>تاریخ ثبت‌نام</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrollments.map((enrollment) => (
                    <TableRow key={enrollment.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{enrollment.full_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {enrollment.phone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{enrollment.tests.title}</TableCell>
                      <TableCell>
                        {enrollment.payment_amount === 0 ? (
                          <Badge variant="outline" className="bg-green-50">رایگان</Badge>
                        ) : (
                          `${enrollment.payment_amount.toLocaleString('fa-IR')} تومان`
                        )}
                      </TableCell>
                      <TableCell>{getPaymentBadge(enrollment.payment_status)}</TableCell>
                      <TableCell>{getStatusBadge(enrollment.enrollment_status)}</TableCell>
                      <TableCell>
                        {new Date(enrollment.created_at).toLocaleDateString('fa-IR')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

interface TestEditFormProps {
  test: Test
  onSave: (test: Test) => void
  onCancel: () => void
}

const TestEditForm: React.FC<TestEditFormProps> = ({ test, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    price: test.price,
    slug: test.slug,
    description: test.description || '',
    is_active: test.is_active
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({ ...test, ...formData })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="price">قیمت (تومان)</Label>
        <Input
          id="price"
          type="number"
          min="0"
          value={formData.price}
          onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
        />
      </div>

      <div>
        <Label htmlFor="slug">نامک (Slug)</Label>
        <Input
          id="slug"
          value={formData.slug}
          onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
          placeholder="test-slug"
        />
      </div>

      <div>
        <Label htmlFor="description">توضیحات</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="توضیحات آزمون"
        />
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="is_active"
          checked={formData.is_active}
          onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
        />
        <Label htmlFor="is_active">فعال</Label>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          انصراف
        </Button>
        <Button type="submit">
          ذخیره
        </Button>
      </div>
    </form>
  )
}

export default TestManagement