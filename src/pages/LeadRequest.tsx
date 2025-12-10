import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Phone, User, ArrowLeft, CheckCircle, Sparkles, Loader2, Target, Briefcase, Heart, Wallet, PhoneCall } from 'lucide-react';
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

  // Total steps: 1=phone, 2=name, 3=goal, 4=status, 5=interests, 6=budget, 7=completion
  const totalSteps = 7;

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

  // Handle goal selection
  const handleGoalSelect = (goal: string) => {
    setAnswers(prev => ({ ...prev, goal }));
    setStep(4);
  };

  // Handle status selection
  const handleStatusSelect = (status: string) => {
    setAnswers(prev => ({ ...prev, current_status: status }));
    setStep(5);
  };

  // Handle interests and continue
  const handleInterestsSubmit = () => {
    setStep(6);
  };

  // Handle budget selection and submit
  const handleBudgetSubmit = async (budget: string) => {
    const finalAnswers = { ...answers, budget };
    setAnswers(finalAnswers);
    
    if (!leadId) return;
    
    setLoading(true);
    setAiLoading(true);
    
    try {
      await supabase
        .from('lead_requests')
        .update({ answers: finalAnswers as any })
        .eq('id', leadId);
      
      // Trigger webhook
      await triggerWebhook({ id: leadId, phone, name, answers: finalAnswers }, 'answers_added');
      
      // Get AI recommendation
      const recommendation = await getAiRecommendation(finalAnswers);
      
      if (recommendation) {
        await supabase
          .from('lead_requests')
          .update({ ai_recommendation: recommendation })
          .eq('id', leadId);
        
        setAiRecommendation(recommendation);
        
        // Trigger webhook with AI result
        await triggerWebhook({ id: leadId, phone, name, answers: finalAnswers, ai_recommendation: recommendation }, 'ai_completed');
      }
      
      setCompleted(true);
      setStep(7);
    } catch (error) {
      console.error('Error submitting questionnaire:', error);
    } finally {
      setLoading(false);
      setAiLoading(false);
    }
  };

  // Skip questionnaire and go to completion
  const handleSkipQuestionnaire = async () => {
    setCompleted(true);
    setStep(7);
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
  const getAiRecommendation = async (finalAnswers: LeadAnswers) => {
    try {
      const { data, error } = await supabase.functions.invoke('lead-request-ai', {
        body: { answers: finalAnswers }
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

  // Handle call button click
  const handleCallClick = async () => {
    if (leadId) {
      try {
        // Increment call_clicks using direct update
        const { data: currentLead } = await supabase
          .from('lead_requests')
          .select('call_clicks')
          .eq('id', leadId)
          .maybeSingle();
        
        await supabase
          .from('lead_requests')
          .update({ call_clicks: (currentLead?.call_clicks || 0) + 1 } as any)
          .eq('id', leadId);
      } catch (error) {
        console.error('Error tracking call click:', error);
      }
    }
    // Open phone dialer
    window.location.href = 'tel:+982128427131';
  };

  // Get budget question text with goal reference
  const getBudgetQuestion = () => {
    if (answers.goal) {
      return `بودجه شما برای ${answers.goal} چقدر است؟`;
    }
    return 'بودجه شما چقدر است؟';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md">
        {/* Progress indicators */}
        <div className="flex justify-center gap-1.5 mb-8">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i + 1 <= step ? 'bg-primary w-6' : 'bg-muted w-3'
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

          {/* Step 3: Goal */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-6"
            >
              <Card className="border-0 shadow-xl bg-card/80 backdrop-blur">
                <CardContent className="p-8">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Target className="w-8 h-8 text-purple-500" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground mb-2">
                      هدف شما چیست؟
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      با انتخاب هدف، بهترین پیشنهاد را برای شما پیدا می‌کنیم
                    </p>
                  </div>

                  <div className="space-y-3">
                    {['کسب درآمد آنلاین', 'یادگیری مهارت جدید', 'ارتقای شغلی', 'شروع کسب‌وکار'].map((option) => (
                      <Button
                        key={option}
                        variant="outline"
                        className={`w-full h-14 text-base justify-start px-4 ${
                          answers.goal === option ? 'border-primary bg-primary/5' : ''
                        }`}
                        onClick={() => handleGoalSelect(option)}
                      >
                        {option}
                      </Button>
                    ))}
                  </div>

                  <Button
                    variant="ghost"
                    onClick={handleSkipQuestionnaire}
                    className="w-full mt-4"
                  >
                    رد شو و ادامه بده
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 4: Current Status */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-6"
            >
              <Card className="border-0 shadow-xl bg-card/80 backdrop-blur">
                <CardContent className="p-8">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Briefcase className="w-8 h-8 text-blue-500" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground mb-2">
                      وضعیت فعلی شما؟
                    </h2>
                  </div>

                  <div className="space-y-3">
                    {['دانشجو', 'شاغل', 'بیکار', 'کارآفرین'].map((option) => (
                      <Button
                        key={option}
                        variant="outline"
                        className={`w-full h-14 text-base justify-start px-4 ${
                          answers.current_status === option ? 'border-primary bg-primary/5' : ''
                        }`}
                        onClick={() => handleStatusSelect(option)}
                      >
                        {option}
                      </Button>
                    ))}
                  </div>

                  <Button
                    variant="ghost"
                    onClick={handleSkipQuestionnaire}
                    className="w-full mt-4"
                  >
                    رد شو و ادامه بده
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 5: Interests */}
          {step === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-6"
            >
              <Card className="border-0 shadow-xl bg-card/80 backdrop-blur">
                <CardContent className="p-8">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-pink-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Heart className="w-8 h-8 text-pink-500" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground mb-2">
                      به چه موضوعاتی علاقه‌مندید؟
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      می‌توانید چند مورد انتخاب کنید
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {['هوش مصنوعی', 'کسب‌وکار آنلاین', 'فریلنسری', 'مهاجرت کاری', 'اینستاگرام', 'ویدیو مارکتینگ'].map((interest) => (
                      <div
                        key={interest}
                        onClick={() => handleInterestToggle(interest)}
                        className={`flex items-center gap-2 p-4 rounded-xl cursor-pointer transition-all border-2 ${
                          answers.interests?.includes(interest)
                            ? 'bg-primary/10 border-primary'
                            : 'bg-muted/50 border-transparent hover:border-muted-foreground/20'
                        }`}
                      >
                        <Checkbox checked={answers.interests?.includes(interest)} />
                        <span className="text-sm font-medium">{interest}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={handleInterestsSubmit}
                    className="w-full h-14 text-lg"
                  >
                    ادامه
                    <ArrowLeft className="w-5 h-5 mr-2" />
                  </Button>

                  <Button
                    variant="ghost"
                    onClick={handleSkipQuestionnaire}
                    className="w-full mt-2"
                  >
                    رد شو و ادامه بده
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 6: Budget */}
          {step === 6 && (
            <motion.div
              key="step6"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-6"
            >
              <Card className="border-0 shadow-xl bg-card/80 backdrop-blur">
                <CardContent className="p-8">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Wallet className="w-8 h-8 text-amber-500" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground mb-2">
                      {getBudgetQuestion()}
                    </h2>
                  </div>

                  <div className="space-y-3">
                    {['رایگان', 'تا ۵۰۰ هزار تومان', '۵۰۰ هزار تا ۲ میلیون', 'بالای ۲ میلیون'].map((option) => (
                      <Button
                        key={option}
                        variant="outline"
                        className="w-full h-14 text-base justify-start px-4"
                        onClick={() => handleBudgetSubmit(option)}
                        disabled={loading || aiLoading}
                      >
                        {aiLoading && answers.budget === option ? (
                          <Loader2 className="w-4 h-4 animate-spin ml-2" />
                        ) : null}
                        {option}
                      </Button>
                    ))}
                  </div>

                  {(loading || aiLoading) && (
                    <div className="text-center mt-4 text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin inline ml-2" />
                      در حال تحلیل پاسخ‌ها...
                    </div>
                  )}

                  <Button
                    variant="ghost"
                    onClick={handleSkipQuestionnaire}
                    className="w-full mt-4"
                    disabled={loading || aiLoading}
                  >
                    رد شو و ادامه بده
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 7: Completion */}
          {step === 7 && (
            <motion.div
              key="step7"
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
                        className="bg-primary/5 border border-primary/20 rounded-xl p-6 text-right mb-6"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <Sparkles className="w-5 h-5 text-primary" />
                          <span className="font-medium text-primary">
                            {aiRecommendation.type === 'course' ? 'دوره پیشنهادی' : 'خدمات پیشنهادی'}
                          </span>
                          {aiRecommendation.tier && (
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              aiRecommendation.tier === 'free' ? 'bg-green-500/20 text-green-600' :
                              aiRecommendation.tier === 'start' ? 'bg-blue-500/20 text-blue-600' :
                              'bg-yellow-500/20 text-yellow-600'
                            }`}>
                              {aiRecommendation.tier === 'free' ? 'رایگان' :
                               aiRecommendation.tier === 'start' ? 'شروع' : 'پریمیوم'}
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-bold text-foreground mb-2">
                          {aiRecommendation.name || aiRecommendation.recommendation}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          {aiRecommendation.explanation}
                        </p>
                        
                        {/* Selling Script */}
                        {aiRecommendation.sellingScript && (
                          <div className="bg-background/50 rounded-lg p-4 mb-4 border border-border/50">
                            <p className="text-sm text-foreground leading-relaxed">
                              {aiRecommendation.sellingScript}
                            </p>
                          </div>
                        )}
                        
                        {/* Course Link */}
                        {aiRecommendation.type === 'course' && aiRecommendation.slug && (
                          <a
                            href={`/course/${aiRecommendation.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium text-sm"
                          >
                            مشاهده دوره
                            <ArrowLeft className="w-4 h-4" />
                          </a>
                        )}
                      </motion.div>
                    )}

                    {/* Call Button */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                      className="space-y-4"
                    >
                      <p className="text-sm text-muted-foreground">
                        اگه عجله دارید، همین الان تماس بگیرید:
                      </p>
                      <Button
                        onClick={handleCallClick}
                        className="w-full h-16 text-lg bg-green-600 hover:bg-green-700"
                        size="lg"
                      >
                        <PhoneCall className="w-6 h-6 ml-3" />
                        <span dir="ltr" className="font-bold">+98 21 2842 7131</span>
                      </Button>
                    </motion.div>

                    <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        📞 در غیر این صورت، تماس ظرف ۲۴ ساعت آینده
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
