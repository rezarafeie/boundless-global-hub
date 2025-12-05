import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'AI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { adminName, viewMode = 'daily' } = await req.json();

    console.log('Starting AI admin analysis...');

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const twoWeeksAgo = new Date(today);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    // 1. Enrollments Data
    const { data: todayEnrollments } = await supabase
      .from('enrollments')
      .select('*')
      .gte('created_at', today.toISOString());

    const { data: yesterdayEnrollments } = await supabase
      .from('enrollments')
      .select('*')
      .gte('created_at', yesterday.toISOString())
      .lt('created_at', today.toISOString());

    const { data: weekEnrollments } = await supabase
      .from('enrollments')
      .select('*, courses(title)')
      .gte('created_at', weekAgo.toISOString());

    const { data: prevWeekEnrollments } = await supabase
      .from('enrollments')
      .select('*')
      .gte('created_at', twoWeeksAgo.toISOString())
      .lt('created_at', weekAgo.toISOString());

    // 2. Leads Data (from enrollments with pending status)
    const { data: allLeads } = await supabase
      .from('enrollments')
      .select('*')
      .in('payment_status', ['pending', 'failed']);

    const { data: assignedLeads } = await supabase
      .from('lead_assignments')
      .select('enrollment_id');

    const { data: convertedLeads } = await supabase
      .from('enrollments')
      .select('*')
      .in('payment_status', ['success', 'completed'])
      .gte('created_at', weekAgo.toISOString());

    // 3. Sales/Revenue Data
    const { data: todaySales } = await supabase
      .from('enrollments')
      .select('payment_amount')
      .in('payment_status', ['success', 'completed'])
      .gte('created_at', today.toISOString());

    const { data: weekSales } = await supabase
      .from('enrollments')
      .select('payment_amount, courses(title)')
      .in('payment_status', ['success', 'completed'])
      .gte('created_at', weekAgo.toISOString());

    // 4. Deals Data
    const { data: successfulDeals } = await supabase
      .from('deals')
      .select('*')
      .eq('status', 'won')
      .gte('created_at', weekAgo.toISOString());

    const { data: failedDeals } = await supabase
      .from('deals')
      .select('*')
      .eq('status', 'lost')
      .gte('created_at', weekAgo.toISOString());

    // 5. Free Course Funnel
    const { data: freeEnrollments } = await supabase
      .from('enrollments')
      .select('*, courses!inner(is_free_access)')
      .eq('courses.is_free_access', true)
      .gte('created_at', weekAgo.toISOString());

    // 6. Installments
    const { data: activeInstallments } = await supabase
      .from('installments')
      .select('*')
      .eq('status', 'pending');

    const { data: overdueInstallments } = await supabase
      .from('installments')
      .select('*')
      .neq('status', 'paid')
      .lt('due_date', now.toISOString());

    const { data: completedInstallments } = await supabase
      .from('installments')
      .select('*')
      .eq('status', 'paid')
      .gte('paid_at', weekAgo.toISOString());

    // 7. Page Views (Analytics)
    const { data: pageViews } = await supabase
      .from('analytics_events')
      .select('path, created_at')
      .eq('event_type', 'pageview')
      .gte('created_at', weekAgo.toISOString());

    const { data: dailyReport } = await supabase
      .from('analytics_daily_reports')
      .select('*')
      .order('report_date', { ascending: false })
      .limit(7);

    // 8. CRM & Agent Activity
    const { data: crmNotes } = await supabase
      .from('crm_notes')
      .select('*, created_by')
      .gte('created_at', weekAgo.toISOString());

    const { data: salesAgents } = await supabase
      .from('chat_users')
      .select('id, name, role')
      .eq('role', 'sales_agent');

    const { data: followups } = await supabase
      .from('crm_followups')
      .select('*')
      .gte('due_at', weekAgo.toISOString());

    // Calculate metrics
    const todayEnrollCount = todayEnrollments?.length || 0;
    const yesterdayEnrollCount = yesterdayEnrollments?.length || 0;
    const enrollGrowth = yesterdayEnrollCount > 0 
      ? Math.round(((todayEnrollCount - yesterdayEnrollCount) / yesterdayEnrollCount) * 100) 
      : todayEnrollCount > 0 ? 100 : 0;

    const weekEnrollCount = weekEnrollments?.length || 0;
    const prevWeekEnrollCount = prevWeekEnrollments?.length || 0;
    const weekGrowth = prevWeekEnrollCount > 0 
      ? Math.round(((weekEnrollCount - prevWeekEnrollCount) / prevWeekEnrollCount) * 100) 
      : weekEnrollCount > 0 ? 100 : 0;

    const assignedLeadIds = new Set(assignedLeads?.map(l => l.enrollment_id) || []);
    const unassignedLeads = allLeads?.filter(l => !assignedLeadIds.has(l.id))?.length || 0;

    const todayRevenue = todaySales?.reduce((sum, s) => sum + Number(s.payment_amount), 0) || 0;
    const weekRevenue = weekSales?.reduce((sum, s) => sum + Number(s.payment_amount), 0) || 0;

    // Group enrollments by course
    const enrollmentsByCourse: Record<string, number> = {};
    weekEnrollments?.forEach(e => {
      const title = e.courses?.title || 'نامشخص';
      enrollmentsByCourse[title] = (enrollmentsByCourse[title] || 0) + 1;
    });

    const topCourse = Object.entries(enrollmentsByCourse)
      .sort((a, b) => b[1] - a[1])[0];

    // Page views analysis
    const pageViewCounts: Record<string, number> = {};
    pageViews?.forEach(pv => {
      pageViewCounts[pv.path] = (pageViewCounts[pv.path] || 0) + 1;
    });
    const topPages = Object.entries(pageViewCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Agent activity
    const agentActivity: Record<string, number> = {};
    crmNotes?.forEach(note => {
      agentActivity[note.created_by] = (agentActivity[note.created_by] || 0) + 1;
    });

    // Compile data summary
    const dataSummary = {
      enrollments: {
        today: todayEnrollCount,
        yesterday: yesterdayEnrollCount,
        week: weekEnrollCount,
        dailyGrowth: enrollGrowth,
        weeklyGrowth: weekGrowth,
        byCourse: enrollmentsByCourse,
        topCourse: topCourse ? { name: topCourse[0], count: topCourse[1] } : null
      },
      leads: {
        total: allLeads?.length || 0,
        unassigned: unassignedLeads,
        assigned: assignedLeadIds.size,
        converted: convertedLeads?.length || 0,
        conversionRate: allLeads?.length ? Math.round((convertedLeads?.length || 0) / allLeads.length * 100) : 0
      },
      sales: {
        todayRevenue,
        weekRevenue,
        successfulDeals: successfulDeals?.length || 0,
        failedDeals: failedDeals?.length || 0
      },
      installments: {
        active: activeInstallments?.length || 0,
        overdue: overdueInstallments?.length || 0,
        overdueAmount: overdueInstallments?.reduce((sum, i) => sum + Number(i.amount), 0) || 0,
        completedThisWeek: completedInstallments?.length || 0
      },
      analytics: {
        totalPageViews: pageViews?.length || 0,
        topPages,
        avgBounceRate: dailyReport?.[0]?.bounce_rate || 0,
        visitors: dailyReport?.reduce((sum, d) => sum + d.visitors, 0) || 0
      },
      crm: {
        totalNotes: crmNotes?.length || 0,
        agentActivity,
        followupsDue: followups?.filter(f => f.status === 'open')?.length || 0,
        followupsCompleted: followups?.filter(f => f.status === 'completed')?.length || 0
      }
    };

    console.log('Data summary:', JSON.stringify(dataSummary));

    // Call AI for analysis
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `شما یک تحلیلگر هوشمند برای یک پلتفرم آموزشی آنلاین هستید. وظیفه شما ارائه گزارش روزانه به مدیر است.

پاسخ شما باید یک JSON معتبر با این ساختار باشد:
{
  "greeting": "پیام خوشامدگویی شخصی‌سازی شده (۱ جمله)",
  "summary": "خلاصه کلی وضعیت (۱-۲ جمله)",
  "highlights": ["نقطه قوت ۱", "نقطه قوت ۲", "نقطه قوت ۳"],
  "warnings": ["هشدار ۱ اگر وجود دارد"],
  "suggestions": ["پیشنهاد ۱", "پیشنهاد ۲"],
  "motivation": "یک جمله انگیزشی کوتاه"
}

نکات مهم:
- از ایموجی در ابتدای هر آیتم استفاده کن
- اعداد را به فارسی بنویس
- لحن دوستانه و حرفه‌ای داشته باش
- اگر رشد مثبت داری، آن را هایلایت کن
- اگر مشکلی وجود دارد، راه‌حل عملی پیشنهاد بده`
          },
          {
            role: 'user',
            content: `نام مدیر: ${adminName || 'مدیر'}
بازه زمانی: ${viewMode === 'daily' ? 'روزانه' : viewMode === 'weekly' ? 'هفتگی' : 'ماهانه'}

داده‌های پلتفرم:
${JSON.stringify(dataSummary, null, 2)}

لطفا تحلیل هوشمند ارائه بده.`
          }
        ],
        temperature: 0.7
      })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiResult = await aiResponse.json();
    const analysisContent = aiResult.choices[0]?.message?.content;

    console.log('AI analysis received:', analysisContent);

    // Parse AI response
    let analysis;
    try {
      const jsonMatch = analysisContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      analysis = {
        greeting: `👋 سلام ${adminName || 'مدیر'}!`,
        summary: 'گزارش امروز آماده است.',
        highlights: ['📊 سیستم در حال جمع‌آوری داده‌هاست'],
        warnings: [],
        suggestions: ['💡 داده‌های بیشتری وارد کنید'],
        motivation: '🚀 موفق باشید!'
      };
    }

    // Save to database
    const { data: savedReport, error: saveError } = await supabase
      .from('ai_admin_reports')
      .insert({
        admin_name: adminName || 'مدیر',
        view_mode: viewMode,
        greeting: analysis.greeting,
        summary: analysis.summary,
        highlights: analysis.highlights || [],
        warnings: analysis.warnings || [],
        suggestions: analysis.suggestions || [],
        motivation: analysis.motivation,
        raw_data: dataSummary,
        raw_analysis: analysisContent
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving report:', saveError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        analysis,
        data: dataSummary,
        reportId: savedReport?.id,
        generatedAt: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in AI admin greeting:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
