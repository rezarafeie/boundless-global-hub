import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Phone, User, ArrowLeft, ArrowRight, CheckCircle, Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface LeadAnswers {
  goal?: string;
  current_status?: string;
  interests?: string[];
  budget?: string;
}

const LeadRequest: React.FC = () => {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [answers, setAnswers] = useState<LeadAnswers>({
    interests: []
  });
  const [aiRecommendation, setAiRecommendation] = useState<any>(null);
  const [completed, setCompleted] = useState(false);

  // Normalize phone number
  const normalizePhone = (p: string) => {
    let normalized = p.replace(/[\s\-\(\)]/g, '');
    if (normalized.startsWith('+98')) {
      normalized = '0' + normalized.slice(3);
    } else if (normalized.startsWith('98') && normalized.length === 12) {
      normalized = '0' + normalized.slice(2);
    }
    if (!normalized.startsWith('0') && normalized.length === 10) {
      normalized = '0' + normalized;
    }
    return normalized;
  };

  // Step 1: Phone submission
  const handlePhoneSubmit = async () => {
    if (!phone.trim()) {
      toast({ title: 'خطا', description: 'لطفاً شماره تماس خود را وارد کنید', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const normalizedPhone = normalizePhone(phone);
      
      // Create lead record
      const { data, error } = await supabase
        .from('lead_requests')
        .insert({ phone: normalizedPhone, status: 'new' })
        .select()
        .single();

      if (error) throw error;

      setLeadId(data.id);
      
      // Trigger webhook
      await triggerWebhook(data, 'created');
      
      toast({ title: 'عالی!', description: 'اطلاعات شما ثبت شد' });
      setStep(2);
    } catch (error) {
      console.error('Error creating lead:', error);
      toast({ title: 'خطا', description: 'مشکلی پیش آمد، لطفاً دوباره تلاش کنید', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Name submission
  const handleNameSubmit = async (skip = false) => {
    if (!leadId) return;
    
    setLoading(true);
    try {
      if (!skip && name.trim()) {
        await supabase
          .from('lead_requests')
          .update({ name: name.trim() } as any)
          .eq('id', leadId);
        
        // Trigger webhook
        await triggerWebhook({ id: leadId, phone, name: name.trim() }, 'name_added');
      }
      
      setStep(3);
    } catch (error) {
      console.error('Error updating name:', error);
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Questionnaire submission
  const handleQuestionnaireSubmit = async (skip = false) => {
    if (!leadId) return;
    
    setLoading(true);
    try {
      if (!skip) {
        await supabase
          .from('lead_requests')
          .update({ answers: answers as any })
          .eq('id', leadId);
        
        // Trigger webhook
        await triggerWebhook({ id: leadId, phone, name, answers }, 'answers_added');
        
        // Get AI recommendation
        setAiLoading(true);
        const recommendation = await getAiRecommendation();
        
        if (recommendation) {
          await supabase
            .from('lead_requests')
            .update({ ai_recommendation: recommendation })
            .eq('id', leadId);
          
          setAiRecommendation(recommendation);
          
          // Trigger webhook with AI result
          await triggerWebhook({ id: leadId, phone, name, answers, ai_recommendation: recommendation }, 'ai_completed');
        }
      }
      
      setCompleted(true);
      setStep(4);
    } catch (error) {
      console.error('Error submitting questionnaire:', error);
    } finally {
      setLoading(false);
      setAiLoading(false);
    }
  };

  // Trigger webhook
  const triggerWebhook = async (data: any, event: string) => {
    try {
      await supabase.functions.invoke('send-lead-request-webhook', {
        body: { leadData: data, event }
      });
    } catch (error) {
      console.error('Webhook error:', error);
    }
  };

  // Get AI recommendation
  const getAiRecommendation = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('lead-request-ai', {
        body: { answers }
      });
      
      if (error) throw error;
      return data?.recommendation;
    } catch (error) {
      console.error('AI recommendation error:', error);
      return null;
    }
  };

  const handleInterestToggle = (interest: string) => {
    setAnswers(prev => ({
      ...prev,
      interests: prev.interests?.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...(prev.interests || []), interest]
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md">
        {/* Progress indicators */}
        <div className="flex justify-center gap-2 mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all duration-300 ${
                s <= step ? 'bg-primary w-8' : 'bg-muted w-4'
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Phone */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-6"
            >
              <Card className="border-0 shadow-xl bg-card/80 backdrop-blur">
                <CardContent className="p-8">
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Phone className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold text-foreground mb-2">
                      مشاوره رایگان
                    </h1>
                    <p className="text-muted-foreground">
                      شماره تماس خود را وارد کنید تا با شما تماس بگیریم
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="phone" className="text-foreground">شماره تماس</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="09123456789"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="text-center text-lg h-14 mt-2"
                        dir="ltr"
                      />
                    </div>

                    <Button
                      onClick={handlePhoneSubmit}
                      disabled={loading}
                      className="w-full h-14 text-lg"
                    >
                      {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          ادامه
                          <ArrowLeft className="w-5 h-5 mr-2" />
                        </>
                      )}
                    </Button>
                  </div>

                  <p className="text-xs text-center text-muted-foreground mt-6">
                    اطلاعات شما نزد ما محفوظ است
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 2: Name */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-6"
            >
              <Card className="border-0 shadow-xl bg-card/80 backdrop-blur">
                <CardContent className="p-8">
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <User className="w-8 h-8 text-green-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">
                      عالی! با چه نامی صداتون کنیم؟
                    </h2>
                    <p className="text-muted-foreground">
                      نام شما به ما کمک می‌کند بهتر راهنماییتان کنیم
                    </p>
                  </div>

                  <div className="space-y-4">
                    <Input
                      type="text"
                      placeholder="نام و نام خانوادگی"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="text-center text-lg h-14"
                    />

                    <Button
                      onClick={() => handleNameSubmit(false)}
                      disabled={loading}
                      className="w-full h-14 text-lg"
                    >
                      {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          ادامه
                          <ArrowLeft className="w-5 h-5 mr-2" />
                        </>
                      )}
                    </Button>

                    <Button
                      variant="ghost"
                      onClick={() => handleNameSubmit(true)}
                      className="w-full"
                    >
                      فعلاً رد شو
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 3: Questionnaire */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-6"
            >
              <Card className="border-0 shadow-xl bg-card/80 backdrop-blur">
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Sparkles className="w-8 h-8 text-purple-500" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground mb-2">
                      چند سوال کوتاه
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      با پاسخ به این سوالات، بهترین پیشنهاد را برای شما پیدا می‌کنیم
                    </p>
                  </div>

                  <div className="space-y-6">
                    {/* Goal */}
                    <div className="space-y-3">
                      <Label className="text-foreground font-medium">هدف شما چیست؟</Label>
                      <RadioGroup
                        value={answers.goal}
                        onValueChange={(v) => setAnswers({ ...answers, goal: v })}
                        className="space-y-2"
                      >
                        {['کسب درآمد آنلاین', 'یادگیری مهارت جدید', 'ارتقای شغلی', 'شروع کسب‌وکار'].map((option) => (
                          <div key={option} className="flex items-center space-x-2 space-x-reverse bg-muted/50 p-3 rounded-lg">
                            <RadioGroupItem value={option} id={option} />
                            <Label htmlFor={option} className="cursor-pointer flex-1">{option}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>

                    {/* Current Status */}
                    <div className="space-y-3">
                      <Label className="text-foreground font-medium">وضعیت فعلی شما؟</Label>
                      <RadioGroup
                        value={answers.current_status}
                        onValueChange={(v) => setAnswers({ ...answers, current_status: v })}
                        className="space-y-2"
                      >
                        {['دانشجو', 'شاغل', 'بیکار', 'کارآفرین'].map((option) => (
                          <div key={option} className="flex items-center space-x-2 space-x-reverse bg-muted/50 p-3 rounded-lg">
                            <RadioGroupItem value={option} id={`status-${option}`} />
                            <Label htmlFor={`status-${option}`} className="cursor-pointer flex-1">{option}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>

                    {/* Interests */}
                    <div className="space-y-3">
                      <Label className="text-foreground font-medium">به چه موضوعاتی علاقه‌مندید؟</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {['هوش مصنوعی', 'کسب‌وکار آنلاین', 'فریلنسری', 'مهاجرت کاری', 'اینستاگرام', 'ویدیو مارکتینگ'].map((interest) => (
                          <div
                            key={interest}
                            onClick={() => handleInterestToggle(interest)}
                            className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-all ${
                              answers.interests?.includes(interest)
                                ? 'bg-primary/10 border-2 border-primary'
                                : 'bg-muted/50 border-2 border-transparent'
                            }`}
                          >
                            <Checkbox checked={answers.interests?.includes(interest)} />
                            <span className="text-sm">{interest}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Budget */}
                    <div className="space-y-3">
                      <Label className="text-foreground font-medium">بودجه آموزشی شما؟</Label>
                      <RadioGroup
                        value={answers.budget}
                        onValueChange={(v) => setAnswers({ ...answers, budget: v })}
                        className="space-y-2"
                      >
                        {['رایگان', 'تا ۵۰۰ هزار تومان', '۵۰۰ هزار تا ۲ میلیون', 'بالای ۲ میلیون'].map((option) => (
                          <div key={option} className="flex items-center space-x-2 space-x-reverse bg-muted/50 p-3 rounded-lg">
                            <RadioGroupItem value={option} id={`budget-${option}`} />
                            <Label htmlFor={`budget-${option}`} className="cursor-pointer flex-1">{option}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button
                        onClick={() => handleQuestionnaireSubmit(false)}
                        disabled={loading || aiLoading}
                        className="flex-1 h-12"
                      >
                        {aiLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin ml-2" />
                            در حال تحلیل...
                          </>
                        ) : loading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          'دریافت پیشنهاد'
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleQuestionnaireSubmit(true)}
                        disabled={loading || aiLoading}
                        className="h-12"
                      >
                        رد شو
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 4: Completion */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              <Card className="border-0 shadow-xl bg-card/80 backdrop-blur">
                <CardContent className="p-8">
                  <div className="text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', delay: 0.2 }}
                      className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6"
                    >
                      <CheckCircle className="w-10 h-10 text-green-500" />
                    </motion.div>
                    
                    <h2 className="text-2xl font-bold text-foreground mb-2">
                      ممنون {name ? name.split(' ')[0] : ''}!
                    </h2>
                    <p className="text-muted-foreground mb-6">
                      اطلاعات شما با موفقیت ثبت شد. کارشناسان ما به زودی با شما تماس خواهند گرفت.
                    </p>

                    {aiRecommendation && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-primary/5 border border-primary/20 rounded-xl p-6 text-right mt-6"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <Sparkles className="w-5 h-5 text-primary" />
                          <span className="font-medium text-primary">پیشنهاد ما برای شما</span>
                        </div>
                        <h3 className="text-lg font-bold text-foreground mb-2">
                          {aiRecommendation.recommendation}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {aiRecommendation.explanation}
                        </p>
                      </motion.div>
                    )}

                    <div className="mt-8 p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        📞 تماس ظرف ۲۴ ساعت آینده
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default LeadRequest;
