import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

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
    console.log('Received answers for analysis:', answers);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch available courses
    const { data: courses } = await supabase
      .from('courses')
      .select('id, title, slug, description, price')
      .eq('is_active', true);

    const courseList = courses?.map(c => `- ${c.title} (${c.slug}): ${c.description || 'برنامه جامع'}`).join('\n');

    const systemPrompt = `تو رضا رفیعی هستی، یک مربی حرفه‌ای و انگیزه‌بخش در حوزه تجارت آنلاین، فریلنسری، ایکامرس و محصولات دیجیتال. 

وظیفه‌ات: بر اساس پاسخ‌های کاربر، یک تحلیل عمیق و شخصی‌سازی شده ارائه بده و بهترین دوره رو برای اون پیشنهاد کن.

مسیرهای درآمدزایی که باید در تحلیل در نظر بگیری:
- فریلنسری و کار آزاد (Freelancing)
- ایکامرس و دراپشیپینگ (Dropshipping, E-commerce)
- محصولات دیجیتال (Digital Products, Courses, Templates)
- مارکتینگ دیجیتال و تبلیغات
- برنامه‌نویسی و توسعه وب
- طراحی و خلاقیت

دوره‌های موجود:
${courseList}

باید خروجی رو به صورت JSON بدی با این ساختار:
{
  "personality_analysis": "تحلیل شخصیت و مسیر (حداقل 150 کلمه، با لحن انگیزشی و عمیق - شامل تحلیل مسیرهای درآمدی مناسب: فریلنسری، ایکامرس، دراپشیپینگ، محصولات دیجیتال)",
  "recommended_course": "slug دوره پیشنهادی",
  "course_justification": "توضیح چرا این دوره؟ (100 کلمه - با ذکر مسیرهای درآمدی که این دوره باز می‌کند)",
  "next_action": "قدم بعدی چیه؟ (50 کلمه)",
  "score": عدد بین 0 تا 100 (احتمال موفقیت)
}

مهم: پاسخت باید فقط JSON باشه، بدون توضیح اضافی.`;

    const userPrompt = `اطلاعات کاربر:
- نام: ${answers.full_name}
- سن: ${answers.age}
- جنسیت: ${answers.gender}
- استان: ${answers.province}
- شغل فعلی: ${answers.current_job}
- درآمد ماهیانه: ${answers.monthly_income}
- راضی از شغل: ${answers.likes_job ? 'بله' : 'خیر'}
- تجربه فریلنسری: ${answers.freelance_experience ? 'دارد' : 'ندارد'}
- سطح انگلیسی: ${answers.english_level}
- تحصیلات: ${answers.education_level}
- اهداف: ${answers.goals?.join(', ')}
- زمان مطالعه روزانه: ${answers.daily_study_time}
- ترجیح یادگیری: ${answers.learning_preference?.join(', ')}
- بودجه آموزش: ${answers.education_budget}
- آماده سرمایه‌گذاری: ${answers.willing_to_invest ? 'بله' : 'خیر'}

لطفا یک تحلیل کامل و انگیزشی بده که شامل این موارد باشه:
- آیا برای فریلنسری مناسبه؟
- آیا برای ایکامرس و دراپشیپینگ پتانسیل داره؟
- آیا می‌تونه محصولات دیجیتال بسازه و بفروشه؟
- کدوم مسیر درآمدی براش بهتره؟

بهترین دوره رو بر اساس همه این جوانب پیشنهاد کن.`;

    console.log('Calling Lovable AI...');
    
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.8,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log('AI response received');
    
    const content = aiData.choices[0].message.content;
    console.log('AI content:', content);
    
    // Parse JSON from response
    let analysis;
    try {
      // Try to find JSON in the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        analysis = JSON.parse(content);
      }
    } catch (e) {
      console.error('Failed to parse AI response:', e);
      throw new Error('Failed to parse AI analysis');
    }

    // Find the course details
    const recommendedCourse = courses?.find(c => c.slug === analysis.recommended_course);

    return new Response(
      JSON.stringify({
        analysis,
        courseDetails: recommendedCourse || null
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in analyze-smart-test:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An error occurred' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});