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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { date } = await req.json().catch(() => ({}));
    const analysisDate = date || new Date().toISOString().split('T')[0];

    console.log(`Running analysis for date: ${analysisDate}`);

    // Fetch daily reports for the date
    const { data: reports, error: reportsError } = await supabase
      .from('daily_reports')
      .select('*')
      .eq('report_date', analysisDate);

    if (reportsError) throw reportsError;

    // Fetch platform metrics for the same date
    const startOfDay = `${analysisDate}T00:00:00`;
    const endOfDay = `${analysisDate}T23:59:59`;

    const [enrollments, crmNotes, messages] = await Promise.all([
      supabase
        .from('enrollments')
        .select('id, payment_status', { count: 'exact' })
        .gte('created_at', startOfDay)
        .lte('created_at', endOfDay),
      supabase
        .from('crm_notes')
        .select('id', { count: 'exact' })
        .gte('created_at', startOfDay)
        .lte('created_at', endOfDay),
      supabase
        .from('messenger_messages')
        .select('id', { count: 'exact' })
        .gte('created_at', startOfDay)
        .lte('created_at', endOfDay)
    ]);

    const platformMetrics = {
      newEnrollments: enrollments.count || 0,
      successfulEnrollments: enrollments.data?.filter(e => e.payment_status === 'completed' || e.payment_status === 'success').length || 0,
      newCrmNotes: crmNotes.count || 0,
      supportMessages: messages.count || 0,
    };

    // Calculate reported totals
    const salesReports = reports?.filter(r => r.role === 'sales') || [];
    const supportReports = reports?.filter(r => r.role === 'support') || [];

    const reportedMetrics = {
      totalCalls: salesReports.reduce((sum, r) => sum + (r.data?.calls_made || 0), 0),
      totalCrmEntries: salesReports.reduce((sum, r) => sum + (r.data?.crm_entries || 0), 0),
      totalConversions: salesReports.reduce((sum, r) => sum + (r.data?.successful_conversions || 0), 0),
      totalFailedLeads: salesReports.reduce((sum, r) => sum + (r.data?.failed_leads || 0), 0),
      totalFollowups: salesReports.reduce((sum, r) => sum + (r.data?.followups_scheduled || 0), 0),
      totalTelegramAcademy: supportReports.reduce((sum, r) => sum + (r.data?.telegram_academy_replies || 0), 0),
      totalTelegramBoundless: supportReports.reduce((sum, r) => sum + (r.data?.telegram_boundless_replies || 0), 0),
      totalWebsiteSupport: supportReports.reduce((sum, r) => sum + (r.data?.website_support_replies || 0), 0),
    };

    // Generate AI Analysis
    const highlights: string[] = [];
    const anomalies: string[] = [];
    const suggestions: string[] = [];
    let accuracyScore = 100;

    // Analyze CRM entries vs actual
    if (platformMetrics.newCrmNotes > 0) {
      const crmAccuracy = Math.min(100, (reportedMetrics.totalCrmEntries / platformMetrics.newCrmNotes) * 100);
      if (crmAccuracy < 80) {
        anomalies.push(`تعداد ورودی‌های CRM گزارش شده (${reportedMetrics.totalCrmEntries}) کمتر از مقدار واقعی (${platformMetrics.newCrmNotes}) است`);
        accuracyScore -= 15;
      } else if (crmAccuracy > 120) {
        anomalies.push(`تعداد ورودی‌های CRM گزارش شده (${reportedMetrics.totalCrmEntries}) بیشتر از مقدار واقعی (${platformMetrics.newCrmNotes}) است`);
        accuracyScore -= 10;
      } else {
        highlights.push(`گزارش CRM با داده‌های سیستم همخوانی دارد`);
      }
    }

    // Analyze conversions vs enrollments
    if (platformMetrics.successfulEnrollments > 0) {
      if (reportedMetrics.totalConversions >= platformMetrics.successfulEnrollments * 0.8) {
        highlights.push(`نرخ تبدیل گزارش شده با ثبت‌نام‌های موفق همخوانی دارد`);
      } else {
        anomalies.push(`تبدیل‌های گزارش شده (${reportedMetrics.totalConversions}) با ثبت‌نام‌های موفق (${platformMetrics.successfulEnrollments}) تفاوت زیادی دارد`);
        accuracyScore -= 20;
      }
    }

    // Analyze support messages
    const totalSupportReported = reportedMetrics.totalTelegramAcademy + reportedMetrics.totalTelegramBoundless + reportedMetrics.totalWebsiteSupport;
    if (totalSupportReported > 50) {
      highlights.push(`عملکرد عالی تیم پشتیبانی با ${totalSupportReported} پیام پاسخ داده شده`);
    }

    // Check for missing reports
    if (salesReports.length === 0) {
      anomalies.push(`هیچ گزارش فروشی برای این روز ثبت نشده است`);
      suggestions.push(`از تیم فروش بخواهید گزارش روزانه خود را ثبت کنند`);
    }

    if (supportReports.length === 0) {
      anomalies.push(`هیچ گزارش پشتیبانی برای این روز ثبت نشده است`);
      suggestions.push(`از تیم پشتیبانی بخواهید گزارش روزانه خود را ثبت کنند`);
    }

    // Call rate analysis
    if (reportedMetrics.totalCalls > 0) {
      const conversionRate = (reportedMetrics.totalConversions / reportedMetrics.totalCalls) * 100;
      if (conversionRate > 10) {
        highlights.push(`نرخ تبدیل تماس به فروش (${conversionRate.toFixed(1)}%) عالی است`);
      } else if (conversionRate < 5) {
        suggestions.push(`نرخ تبدیل تماس به فروش (${conversionRate.toFixed(1)}%) نیاز به بهبود دارد - پیشنهاد: بازنگری اسکریپت تماس`);
      }
    }

    // Generate motivation
    let motivation = '';
    if (accuracyScore >= 80) {
      motivation = '🌟 عملکرد عالی! تیم در مسیر درستی قرار دارد. ادامه بدهید!';
    } else if (accuracyScore >= 60) {
      motivation = '💪 عملکرد قابل قبول است اما جای پیشرفت وجود دارد. با تمرکز بیشتر می‌توانید بهتر شوید!';
    } else {
      motivation = '⚠️ نیاز به توجه بیشتر! لطفاً گزارشات را با دقت بیشتری ثبت کنید و با داده‌های واقعی تطبیق دهید.';
    }

    // Ensure accuracy score is within bounds
    accuracyScore = Math.max(0, Math.min(100, accuracyScore));

    // Save analysis to database
    const { error: insertError } = await supabase
      .from('report_ai_analysis')
      .insert({
        user_id: null, // Global analysis
        analysis_date: analysisDate,
        accuracy_score: accuracyScore,
        highlights,
        anomalies,
        suggestions,
        motivation,
        platform_metrics: {
          ...platformMetrics,
          reported: reportedMetrics,
        },
        raw_analysis: JSON.stringify({
          reports_count: reports?.length || 0,
          sales_reports: salesReports.length,
          support_reports: supportReports.length,
        }),
      });

    if (insertError) throw insertError;

    console.log(`Analysis completed with accuracy: ${accuracyScore}%`);

    return new Response(JSON.stringify({
      success: true,
      accuracy_score: accuracyScore,
      highlights,
      anomalies,
      suggestions,
      motivation,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-daily-reports:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
