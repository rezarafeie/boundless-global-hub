import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, ChevronRight, ChevronLeft } from 'lucide-react';

interface QuizAnswers {
  full_name: string;
  phone: string;
  age: number | null;
  gender: string;
  province: string;
  email: string;
  english_level: string;
  education_level: string;
  current_job: string;
  monthly_income: number | null;
  likes_job: boolean | null;
  freelance_experience: boolean | null;
  goals: string[];
  daily_study_time: string;
  learning_preference: string[];
  education_budget: number | null;
  willing_to_invest: boolean | null;
}

const SmartTest = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [answers, setAnswers] = useState<QuizAnswers>({
    full_name: user?.name || '',
    phone: user?.phone || '',
    age: null,
    gender: '',
    province: '',
    email: user?.email || '',
    english_level: '',
    education_level: '',
    current_job: '',
    monthly_income: null,
    likes_job: null,
    freelance_experience: null,
    goals: [],
    daily_study_time: '',
    learning_preference: [],
    education_budget: null,
    willing_to_invest: null,
  });

  const totalSteps = 12;
  const progress = ((step + 1) / totalSteps) * 100;

  const updateAnswer = (field: keyof QuizAnswers, value: any) => {
    setAnswers(prev => ({ ...prev, [field]: value }));
  };

  const toggleArrayValue = (field: 'goals' | 'learning_preference', value: string) => {
    setAnswers(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(v => v !== value)
        : [...prev[field], value]
    }));
  };

  const nextStep = () => {
    if (step < totalSteps - 1) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      // Call AI analysis
      const { data: analysisData, error: aiError } = await supabase.functions.invoke('analyze-smart-test', {
        body: { answers }
      });

      if (aiError) throw aiError;

      const { analysis, courseDetails } = analysisData;

      // Generate unique token
      const token = crypto.randomUUID();
      console.log('Generated token:', token);

      // Save to database
      const { data: insertData, error: dbError } = await supabase
        .from('smart_test_submissions')
        .insert({
          ...answers,
          ai_analysis: analysis,
          recommended_course_slug: analysis.recommended_course,
          recommended_course_title: courseDetails?.title || '',
          ai_response_text: analysis.personality_analysis,
          score: analysis.score,
          result_token: token,
        })
        .select()
        .single();

      if (dbError) {
        console.error('Database error:', dbError);
        throw dbError;
      }

      console.log('Saved to database:', insertData);
      console.log('Navigating to results with token:', token);

      // Navigate to results
      navigate(`/smart-test/results?token=${token}`);
      
    } catch (error) {
      console.error('Error submitting test:', error);
      toast.error('خطا در ارسال تست. لطفا دوباره تلاش کنید.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-foreground">سلام! 👋</h2>
            <p className="text-xl text-muted-foreground leading-relaxed">
              من رضا رفیعی هستم. خوشحالم که میخوای با هم صحبت کنیم.
              <br /><br />
              فقط ۵ دقیقه وقت میخوام تا باهم آینده‌ات رو بسازیم. آماده‌ای؟
            </p>
            <Input
              placeholder="اسمت چیه؟"
              value={answers.full_name}
              onChange={(e) => updateAnswer('full_name', e.target.value)}
              className="text-lg p-6"
            />
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-foreground">خوشوقتم {answers.full_name}! 😊</h2>
            <p className="text-xl text-muted-foreground">
              من هم رضا رفیعی هستم، مربی شما در این مسیر.
            </p>
            <Input
              placeholder="شماره تماست رو بده لطفا"
              value={answers.phone}
              onChange={(e) => updateAnswer('phone', e.target.value)}
              className="text-lg p-6 text-left"
              dir="ltr"
            />
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-foreground">عالی! 🎯</h2>
            <p className="text-xl text-muted-foreground">چند سالته؟</p>
            <Input
              type="number"
              placeholder="سن"
              value={answers.age || ''}
              onChange={(e) => updateAnswer('age', parseInt(e.target.value) || null)}
              className="text-lg p-6"
            />
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant={answers.gender === 'مرد' ? 'default' : 'outline'}
                onClick={() => updateAnswer('gender', 'مرد')}
                className="py-6 text-lg"
              >
                مرد
              </Button>
              <Button
                variant={answers.gender === 'زن' ? 'default' : 'outline'}
                onClick={() => updateAnswer('gender', 'زن')}
                className="py-6 text-lg"
              >
                زن
              </Button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-foreground">کجا زندگی میکنی؟ 🌍</h2>
            <Input
              placeholder="استان محل سکونت"
              value={answers.province}
              onChange={(e) => updateAnswer('province', e.target.value)}
              className="text-lg p-6"
            />
            <Input
              type="email"
              placeholder="ایمیل (اختیاری)"
              value={answers.email}
              onChange={(e) => updateAnswer('email', e.target.value)}
              className="text-lg p-6 text-left"
              dir="ltr"
            />
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-foreground">سطح انگلیسی‌ات چطوره؟ 🗣️</h2>
            <div className="grid grid-cols-1 gap-3">
              {['مبتدی', 'متوسط', 'پیشرفته', 'عالی'].map(level => (
                <Button
                  key={level}
                  variant={answers.english_level === level ? 'default' : 'outline'}
                  onClick={() => updateAnswer('english_level', level)}
                  className="py-6 text-lg"
                >
                  {level}
                </Button>
              ))}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-foreground">تحصیلاتت چیه؟ 📚</h2>
            <div className="grid grid-cols-1 gap-3">
              {['دیپلم', 'کاردانی', 'کارشناسی', 'کارشناسی ارشد', 'دکترا'].map(edu => (
                <Button
                  key={edu}
                  variant={answers.education_level === edu ? 'default' : 'outline'}
                  onClick={() => updateAnswer('education_level', edu)}
                  className="py-6 text-lg"
                >
                  {edu}
                </Button>
              ))}
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-foreground">الان چیکار میکنی؟ 💼</h2>
            <Input
              placeholder="شغل یا رشته تحصیلی فعلی"
              value={answers.current_job}
              onChange={(e) => updateAnswer('current_job', e.target.value)}
              className="text-lg p-6"
            />
            <div className="space-y-3">
              <p className="text-lg text-muted-foreground">درآمد ماهیانه‌ات چقدره؟</p>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { label: 'زیر ۵ میلیون تومان', value: 5000000 },
                  { label: '۵ تا ۱۰ میلیون تومان', value: 7500000 },
                  { label: '۱۰ تا ۲۰ میلیون تومان', value: 15000000 },
                  { label: '۲۰ تا ۵۰ میلیون تومان', value: 35000000 },
                  { label: 'بیشتر از ۵۰ میلیون تومان', value: 75000000 }
                ].map(option => (
                  <Button
                    key={option.value}
                    variant={answers.monthly_income === option.value ? 'default' : 'outline'}
                    onClick={() => updateAnswer('monthly_income', option.value)}
                    className="py-4 text-base"
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-foreground">از کارت راضی هستی؟ 🤔</h2>
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant={answers.likes_job === true ? 'default' : 'outline'}
                onClick={() => updateAnswer('likes_job', true)}
                className="py-8 text-xl"
              >
                بله ✅
              </Button>
              <Button
                variant={answers.likes_job === false ? 'default' : 'outline'}
                onClick={() => updateAnswer('likes_job', false)}
                className="py-8 text-xl"
              >
                خیر ❌
              </Button>
            </div>
            <div className="mt-6">
              <p className="text-lg text-muted-foreground mb-3">تجربه فریلنسری داری؟</p>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant={answers.freelance_experience === true ? 'default' : 'outline'}
                  onClick={() => updateAnswer('freelance_experience', true)}
                  className="py-6 text-lg"
                >
                  دارم
                </Button>
                <Button
                  variant={answers.freelance_experience === false ? 'default' : 'outline'}
                  onClick={() => updateAnswer('freelance_experience', false)}
                  className="py-6 text-lg"
                >
                  ندارم
                </Button>
              </div>
            </div>
          </div>
        );

      case 8:
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-foreground">هدفت از یادگیری چیه؟ 🎯</h2>
            <p className="text-muted-foreground">میتونی چند تا انتخاب کنی</p>
            <div className="grid grid-cols-1 gap-3">
              {[
                'کسب درآمد دلاری',
                'مهاجرت',
                'راه‌اندازی فروشگاه آنلاین (ایکامرس)',
                'دراپشیپینگ و تجارت بین‌المللی',
                'ساخت و فروش محصولات دیجیتال',
                'فریلنسری و کار آزاد',
                'رشد شخصی',
                'استقلال مالی',
                'تغییر شغل'
              ].map(goal => (
                <Button
                  key={goal}
                  variant={answers.goals.includes(goal) ? 'default' : 'outline'}
                  onClick={() => toggleArrayValue('goals', goal)}
                  className="py-6 text-lg justify-start"
                >
                  {answers.goals.includes(goal) && '✓ '}
                  {goal}
                </Button>
              ))}
            </div>
          </div>
        );

      case 9:
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-foreground">چقدر وقت داری؟ ⏰</h2>
            <p className="text-muted-foreground">روزی چند ساعت میتونی وقت بذاری؟</p>
            <div className="grid grid-cols-1 gap-3">
              {[
                { label: 'کمتر از ۱ ساعت (مشغله زیاد)', value: 'کمتر از 1 ساعت' },
                { label: '۱ تا ۳ ساعت (متوسط)', value: '1 تا 3 ساعت' },
                { label: '۳ تا ۵ ساعت (خوب)', value: '3 تا 5 ساعت' },
                { label: 'بیشتر از ۵ ساعت (تمام‌وقت)', value: 'بیشتر از 5 ساعت' }
              ].map(time => (
                <Button
                  key={time.value}
                  variant={answers.daily_study_time === time.value ? 'default' : 'outline'}
                  onClick={() => updateAnswer('daily_study_time', time.value)}
                  className="py-6 text-lg"
                >
                  {time.label}
                </Button>
              ))}
            </div>
          </div>
        );

      case 10:
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-foreground">چطوری دوست داری یاد بگیری؟ 📱</h2>
            <p className="text-muted-foreground">میتونی چند تا انتخاب کنی</p>
            <div className="grid grid-cols-1 gap-3">
              {[
                'ویدیوهای آموزشی',
                'چت با هوش مصنوعی',
                'تمرین‌های عملی',
                'جلسات زنده',
                'مطالعه متن و کتاب',
                'مشاوره یک‌به‌یک'
              ].map(pref => (
                <Button
                  key={pref}
                  variant={answers.learning_preference.includes(pref) ? 'default' : 'outline'}
                  onClick={() => toggleArrayValue('learning_preference', pref)}
                  className="py-6 text-lg justify-start"
                >
                  {answers.learning_preference.includes(pref) && '✓ '}
                  {pref}
                </Button>
              ))}
            </div>
          </div>
        );

      case 11:
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-foreground">آخرین سوال! 💰</h2>
            <div className="space-y-4">
              <div>
                <p className="text-lg text-muted-foreground mb-3">چقدر میتونی برای آموزشت سرمایه‌گذاری کنی؟</p>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { label: 'کمتر از ۱ میلیون تومان', value: 500000 },
                    { label: '۱ تا ۳ میلیون تومان', value: 2000000 },
                    { label: '۳ تا ۵ میلیون تومان', value: 4000000 },
                    { label: '۵ تا ۱۰ میلیون تومان', value: 7500000 },
                    { label: '۱۰ تا ۲۰ میلیون تومان', value: 15000000 },
                    { label: 'بیشتر از ۲۰ میلیون تومان', value: 25000000 }
                  ].map(option => (
                    <Button
                      key={option.value}
                      variant={answers.education_budget === option.value ? 'default' : 'outline'}
                      onClick={() => updateAnswer('education_budget', option.value)}
                      className="py-4 text-base"
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-lg text-muted-foreground mb-3">آماده‌ای برای سرمایه‌گذاری روی خودت؟</p>
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant={answers.willing_to_invest === true ? 'default' : 'outline'}
                    onClick={() => updateAnswer('willing_to_invest', true)}
                    className="py-6 text-lg"
                  >
                    بله، کاملا
                  </Button>
                  <Button
                    variant={answers.willing_to_invest === false ? 'default' : 'outline'}
                    onClick={() => updateAnswer('willing_to_invest', false)}
                    className="py-6 text-lg"
                  >
                    فعلا نه
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (step) {
      case 0: return answers.full_name.trim().length > 0;
      case 1: return answers.phone.trim().length > 0;
      case 2: return answers.age && answers.gender;
      case 3: return answers.province.trim().length > 0;
      case 4: return answers.english_level.length > 0;
      case 5: return answers.education_level.length > 0;
      case 6: return answers.current_job.trim().length > 0;
      case 7: return answers.likes_job !== null && answers.freelance_experience !== null;
      case 8: return answers.goals.length > 0;
      case 9: return answers.daily_study_time.length > 0;
      case 10: return answers.learning_preference.length > 0;
      case 11: return answers.willing_to_invest !== null;
      default: return true;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <Progress value={progress} className="h-1 rounded-none" />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4 pt-16">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-card border border-border rounded-2xl p-8 md:p-12 shadow-xl"
            >
              {renderStep()}

              {/* Navigation */}
              <div className="flex gap-4 mt-8">
                {step > 0 && (
                  <Button
                    variant="outline"
                    onClick={prevStep}
                    className="flex-1"
                    size="lg"
                  >
                    <ChevronLeft className="ml-2" />
                    قبلی
                  </Button>
                )}
                
                {step < totalSteps - 1 ? (
                  <Button
                    onClick={nextStep}
                    disabled={!canProceed()}
                    className="flex-1"
                    size="lg"
                  >
                    بعدی
                    <ChevronRight className="mr-2" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={!canProceed() || isLoading}
                    className="flex-1"
                    size="lg"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="ml-2 animate-spin" />
                        در حال تحلیل...
                      </>
                    ) : (
                      <>
                        مشاهده نتیجه
                        <ChevronRight className="mr-2" />
                      </>
                    )}
                  </Button>
                )}
              </div>

              {/* Step indicator */}
              <div className="text-center mt-6 text-sm text-muted-foreground">
                سوال {step + 1} از {totalSteps}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default SmartTest;