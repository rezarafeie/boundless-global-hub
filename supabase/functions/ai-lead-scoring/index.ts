import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { courseId, startDate, endDate } = await req.json();

    if (!courseId) {
      return new Response(
        JSON.stringify({ error: 'Course ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Build date filter
    let dateFilter = '';
    if (startDate && endDate) {
      dateFilter = `and(created_at.gte.${startDate},created_at.lte.${endDate})`;
    }

    // Fetch enrollments for the course
    const { data: enrollments, error: enrollError } = await supabase
      .from('enrollments')
      .select(`
        id,
        full_name,
        email,
        phone,
        created_at,
        payment_status,
        chat_user_id,
        courses!inner(title, slug)
      `)
      .eq('course_id', courseId)
      .in('payment_status', ['completed', 'success'])
      .order('created_at', { ascending: false });

    if (enrollError) {
      console.error('Error fetching enrollments:', enrollError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch enrollments' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!enrollments || enrollments.length === 0) {
      return new Response(
        JSON.stringify({ leads: [], message: 'No enrollments found for this course' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch user IDs from enrollments
    const chatUserIds = enrollments
      .map(e => e.chat_user_id)
      .filter(id => id !== null);

    // Fetch lesson progress for these users
    const { data: lessonProgress } = await supabase
      .from('user_lesson_progress')
      .select('user_id, course_id, is_completed, total_time_spent, last_viewed_at')
      .eq('course_id', courseId)
      .in('user_id', chatUserIds);

    // Fetch support conversations
    const { data: supportConvs } = await supabase
      .from('support_conversations')
      .select('user_id, status, created_at')
      .in('user_id', chatUserIds);

    // Fetch CRM notes
    const { data: crmNotes } = await supabase
      .from('crm_notes')
      .select('user_id, type, created_at')
      .in('user_id', chatUserIds);

    // Fetch test enrollments
    const { data: testEnrollments } = await supabase
      .from('test_enrollments')
      .select('user_id, status')
      .in('user_id', chatUserIds);

    // Fetch course licenses (for activation/downloads)
    const { data: licenses } = await supabase
      .from('course_licenses')
      .select('user_id, status, activated_at')
      .eq('course_id', courseId)
      .in('user_id', chatUserIds);

    // Build user behavior data with compact format
    const userBehaviorData = enrollments.map(enrollment => {
      const userId = enrollment.chat_user_id;
      
      const userLessons = lessonProgress?.filter(lp => lp.user_id === userId) || [];
      const userSupport = supportConvs?.filter(sc => sc.user_id === userId) || [];
      const userCRM = crmNotes?.filter(cn => cn.user_id === userId) || [];
      const userTests = testEnrollments?.filter(te => te.user_id === userId) || [];
      const userLicense = licenses?.find(l => l.user_id === userId);

      const completedLessons = userLessons.filter(l => l.is_completed).length;
      const totalLessons = userLessons.length;
      const totalTimeSpent = userLessons.reduce((sum, l) => sum + (l.total_time_spent || 0), 0);
      const lastActivity = userLessons.length > 0 
        ? Math.max(...userLessons.map(l => new Date(l.last_viewed_at || 0).getTime()))
        : 0;
      const hoursSinceLastActivity = lastActivity > 0 
        ? (Date.now() - lastActivity) / (1000 * 60 * 60)
        : 999;

      return {
        enrollment_id: enrollment.id,
        full_name: enrollment.full_name,
        email: enrollment.email,
        phone: enrollment.phone,
        enrollment_date: enrollment.created_at,
        course_name: enrollment.courses.title,
        metrics: {
          total_lessons_enrolled: totalLessons,
          completed_lessons: completedLessons,
          completion_percentage: totalLessons > 0 ? (completedLessons / totalLessons * 100).toFixed(1) : 0,
          total_time_minutes: Math.round(totalTimeSpent / 60),
          hours_since_last_activity: Math.round(hoursSinceLastActivity),
          has_support_conversation: userSupport.length > 0,
          crm_interactions: userCRM.length,
          test_taken: userTests.length > 0,
          license_activated: userLicense?.status === 'active',
        }
      };
    });

    // Create compact summary for AI (avoid token limit)
    const compactData = userBehaviorData.map(u => ({
      id: u.enrollment_id,
      name: u.full_name,
      m: u.metrics // Use single letter keys to reduce tokens
    }));

    // Call Lovable AI to analyze and score leads
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an AI lead scoring expert. Analyze user behavior data and assign a lead score (0-100) based on:
- Lesson engagement (completion %, time spent, total lessons enrolled)
- Recency (hours since last activity)
- Support activation
- CRM interactions
- Test participation
- License activation

Scoring guidelines:
- Completion ≥70%: +20 points
- Total time >40 minutes: +15 points
- Last activity <48 hours: +15 points
- Support conversation: +10 points
- CRM interactions: +5 points per interaction (max +10)
- Test taken: +10 points
- License activated: +10 points
- Total lessons enrolled ≥5: +10 points

Classify leads as:
- HOT (75-100): High engagement, recent activity
- WARM (50-74): Moderate engagement
- COLD (0-49): Low engagement or inactive

Return structured scores and reasoning for each lead.`
          },
          {
            role: 'user',
            content: `Analyze ${compactData.length} leads. Each has: id, name, m:{total_lessons_enrolled, completed_lessons, completion_percentage, total_time_minutes, hours_since_last_activity, has_support_conversation, crm_interactions, test_taken, license_activated}.\n\nData: ${JSON.stringify(compactData)}`
          }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'score_leads',
            description: 'Score and classify leads based on behavior',
            parameters: {
              type: 'object',
              properties: {
                scored_leads: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      enrollment_id: { type: 'string' },
                      score: { type: 'number', minimum: 0, maximum: 100 },
                      status: { type: 'string', enum: ['HOT', 'WARM', 'COLD'] },
                      reasoning: { type: 'string' }
                    },
                    required: ['enrollment_id', 'score', 'status', 'reasoning']
                  }
                }
              },
              required: ['scored_leads']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'score_leads' } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI gateway error:', aiResponse.status, errorText);
      
      let errorMessage = 'خطا در تحلیل AI';
      if (aiResponse.status === 503) {
        errorMessage = 'سرویس AI موقتاً در دسترس نیست. لطفاً چند دقیقه دیگر مجدداً تلاش کنید.';
      } else if (aiResponse.status === 429) {
        errorMessage = 'تعداد درخواست‌ها بیش از حد مجاز است. لطفاً کمی صبر کنید.';
      } else if (errorText.includes('context length')) {
        errorMessage = 'حجم داده برای تحلیل بیش از حد است. لطفاً بازه زمانی کوچک‌تری انتخاب کنید.';
      }
      
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      );
    }
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add more credits to your workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'AI analysis failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResult = await aiResponse.json();
    console.log('AI Response:', JSON.stringify(aiResult, null, 2));

    // Extract scores from AI response
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    let scoredLeads = [];

    if (toolCall?.function?.arguments) {
      const args = typeof toolCall.function.arguments === 'string' 
        ? JSON.parse(toolCall.function.arguments)
        : toolCall.function.arguments;
      scoredLeads = args.scored_leads || [];
    }

    // Merge AI scores with original data
    const rankedLeads = userBehaviorData.map(userData => {
      const aiScore = scoredLeads.find(sl => sl.enrollment_id === userData.enrollment_id);
      return {
        ...userData,
        score: aiScore?.score || 0,
        status: aiScore?.status || 'COLD',
        reasoning: aiScore?.reasoning || 'No AI analysis available'
      };
    }).sort((a, b) => b.score - a.score);

    return new Response(
      JSON.stringify({ 
        leads: rankedLeads,
        total_analyzed: rankedLeads.length,
        hot_leads: rankedLeads.filter(l => l.status === 'HOT').length,
        warm_leads: rankedLeads.filter(l => l.status === 'WARM').length,
        cold_leads: rankedLeads.filter(l => l.status === 'COLD').length
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in ai-lead-scoring function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
