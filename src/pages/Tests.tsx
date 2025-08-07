import React from 'react'
import { useNavigate } from 'react-router-dom'
import MainLayout from '@/components/Layout/MainLayout'
import { useTests } from '@/hooks/useTests'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Brain, Users, Clock, ArrowLeft } from 'lucide-react'

const Tests: React.FC = () => {
  const navigate = useNavigate()
  const { tests, loading, error } = useTests()

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="flex items-center gap-4 mb-8">
            <Skeleton className="h-10 w-10" />
            <div>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="border-border">
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-6 w-20" />
                    </div>
                    <Skeleton className="h-10 w-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </MainLayout>
    )
  }

  if (error) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="text-center py-12">
            <div className="text-destructive text-lg mb-4">خطا در بارگذاری آزمون‌ها</div>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>تلاش مجدد</Button>
          </div>
        </div>
      </MainLayout>
    )
  }

  const handleStartTest = (testSlug: string) => {
    navigate(`/enroll?test=${testSlug}`)
  }

  const formatPrice = (price: number) => {
    if (price === 0) return 'رایگان'
    return `${price.toLocaleString('fa-IR')} تومان`
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Brain className="h-8 w-8 text-primary" />
              مرکز سنجش
            </h1>
            <p className="text-muted-foreground mt-2">
              آزمون‌های تخصصی شخصیت‌شناسی و روان‌شناسی
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Brain className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{tests.length}</p>
                  <p className="text-sm text-muted-foreground">آزمون موجود</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {tests.reduce((sum, test) => sum + test.count_used, 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">آزمون انجام شده</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {tests.filter(test => test.price === 0).length}
                  </p>
                  <p className="text-sm text-muted-foreground">آزمون رایگان</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tests Grid */}
        {tests.length === 0 ? (
          <div className="text-center py-12">
            <Brain className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              هیچ آزمونی موجود نیست
            </h3>
            <p className="text-muted-foreground">
              در حال حاضر آزمونی برای انجام وجود ندارد.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tests.map((test) => (
              <Card key={test.id} className="border-border hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg text-foreground line-clamp-2">
                    {test.title}
                  </CardTitle>
                  {test.description && (
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {test.description}
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Test Info */}
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="text-xs">
                        <Users className="h-3 w-3 mr-1" />
                        {test.count_ready} آزمون آماده
                      </Badge>
                      {test.count_used > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {test.count_used} انجام شده
                        </Badge>
                      )}
                    </div>

                    {/* Price */}
                    <div className="flex items-center justify-between">
                      <div className="text-lg font-bold text-primary">
                        {formatPrice(test.price)}
                      </div>
                      {test.price === 0 && (
                        <Badge variant="default" className="bg-green-600">
                          رایگان
                        </Badge>
                      )}
                    </div>

                    {/* Start Button */}
                    <Button 
                      onClick={() => handleStartTest(test.slug)}
                      className="w-full"
                      disabled={test.count_ready === 0}
                    >
                      {test.count_ready === 0 ? 'آزمون ناموجود' : 'شروع آزمون'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  )
}

export default Tests