import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { answers } = await req.json();
    console.log('Received answers for AI recommendation:', answers);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      return new Response(JSON.stringify({
        recommendation: {
          recommendation: 'مشاوره تخصصی',
          explanation: 'با توجه به اطلاعات شما، پیشنهاد می‌کنیم با کارشناسان ما صحبت کنید.'
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const systemPrompt = `تو یک مشاور آموزشی هستی که بر اساس پاسخ‌های کاربر، بهترین دوره یا خدمات آموزشی را پیشنهاد می‌دهی.

دوره‌ها و خدمات موجود:
1. دوره هوش مصنوعی و درآمد آنلاین - برای کسانی که می‌خواهند با AI درآمدزایی کنند
2. دوره فریلنسری و کار آزاد - برای شروع کار فریلنسری
3. دوره کسب‌وکار اینستاگرام - برای کسانی که می‌خواهند در اینستاگرام فعالیت کنند
4. برنامه بدون مرز - برای مهاجرت کاری و کار با شرکت‌های خارجی
5. مشاوره تخصصی - برای کسانی که نیاز به راهنمایی شخصی دارند

بر اساس هدف، وضعیت فعلی، علاقه‌مندی‌ها و بودجه کاربر، یک پیشنهاد مناسب بده.

پاسخ خود را به صورت JSON با این فرمت برگردان:
{
  "recommendation": "نام دوره یا خدمات پیشنهادی",
  "explanation": "توضیح کوتاه و انگیزه‌بخش در ۲-۳ جمله"
}`;

    const userMessage = `اطلاعات کاربر:
- هدف: ${answers?.goal || 'مشخص نشده'}
- وضعیت فعلی: ${answers?.current_status || 'مشخص نشده'}
- علاقه‌مندی‌ها: ${answers?.interests?.join('، ') || 'مشخص نشده'}
- بودجه: ${answers?.budget || 'مشخص نشده'}

بهترین پیشنهاد را ارائه بده.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        response_format: { type: 'json_object' }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error('AI API error');
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;
    
    let recommendation;
    try {
      recommendation = JSON.parse(content);
    } catch (e) {
      console.error('Failed to parse AI response:', content);
      recommendation = {
        recommendation: 'مشاوره تخصصی',
        explanation: 'با توجه به اطلاعات شما، پیشنهاد می‌کنیم با کارشناسان ما صحبت کنید تا بهترین مسیر را برایتان مشخص کنیم.'
      };
    }

    console.log('AI recommendation:', recommendation);

    return new Response(JSON.stringify({ recommendation }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in lead-request-ai:', error);
    return new Response(JSON.stringify({
      recommendation: {
        recommendation: 'مشاوره تخصصی',
        explanation: 'با توجه به اطلاعات شما، پیشنهاد می‌کنیم با کارشناسان ما صحبت کنید.'
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
