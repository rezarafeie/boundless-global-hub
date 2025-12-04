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

    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) {
      console.error('OPENAI_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Starting weekly financial analysis...');

    // Get date range for last 7 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    // Fetch invoices from last week
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (invoicesError) {
      console.error('Error fetching invoices:', invoicesError);
      throw invoicesError;
    }

    // Fetch enrollments from last week
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('enrollments')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (enrollmentsError) {
      console.error('Error fetching enrollments:', enrollmentsError);
    }

    // Fetch pending commissions
    const { data: pendingCommissions } = await supabase
      .from('earned_commissions')
      .select('*')
      .eq('status', 'pending');

    // Fetch overdue installments
    const { data: overdueInstallments } = await supabase
      .from('installments')
      .select('*')
      .neq('status', 'paid')
      .lt('due_date', new Date().toISOString());

    // Calculate metrics
    const totalInvoices = invoices?.length || 0;
    const paidInvoices = invoices?.filter(i => i.status === 'paid') || [];
    const unpaidInvoices = invoices?.filter(i => i.status === 'unpaid') || [];
    const totalRevenue = paidInvoices.reduce((sum, i) => sum + Number(i.paid_amount), 0);
    const unpaidAmount = unpaidInvoices.reduce((sum, i) => sum + Number(i.total_amount), 0);
    const totalEnrollments = enrollments?.length || 0;
    const paidEnrollments = enrollments?.filter(e => e.payment_status === 'completed' || e.payment_status === 'success') || [];
    const pendingCommissionAmount = pendingCommissions?.reduce((sum, c) => sum + Number(c.amount), 0) || 0;
    const overdueAmount = overdueInstallments?.reduce((sum, i) => sum + Number(i.amount), 0) || 0;

    // Prepare data summary for AI
    const dataSummary = {
      period: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
      invoices: {
        total: totalInvoices,
        paid: paidInvoices.length,
        unpaid: unpaidInvoices.length,
        totalRevenue,
        unpaidAmount
      },
      enrollments: {
        total: totalEnrollments,
        paid: paidEnrollments.length,
        conversionRate: totalEnrollments > 0 ? ((paidEnrollments.length / totalEnrollments) * 100).toFixed(1) : 0
      },
      commissions: {
        pending: pendingCommissions?.length || 0,
        pendingAmount: pendingCommissionAmount
      },
      installments: {
        overdue: overdueInstallments?.length || 0,
        overdueAmount
      }
    };

    console.log('Data summary:', JSON.stringify(dataSummary));

    // Call OpenAI for analysis
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a financial analyst for an online education business. Analyze the weekly financial data and provide insights in Persian (Farsi). 
            
Your response should be a JSON object with these fields:
- highlights: Array of 3-5 key positive highlights (in Persian)
- anomalies: Array of any issues or anomalies detected (in Persian)
- suggestions: Array of 2-4 actionable suggestions for improvement (in Persian)
- motivation: A brief motivational message for the team (in Persian)
- accuracy_score: A score from 1-100 rating the overall financial health`
          },
          {
            role: 'user',
            content: `Analyze this weekly financial data:\n${JSON.stringify(dataSummary, null, 2)}`
          }
        ],
        temperature: 0.7
      })
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${openaiResponse.status}`);
    }

    const aiResult = await openaiResponse.json();
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
        highlights: ['تحلیل دریافت شد'],
        anomalies: [],
        suggestions: ['لطفا داده‌های بیشتری وارد کنید'],
        motivation: 'به کار خود ادامه دهید!',
        accuracy_score: 50
      };
    }

    // Store the analysis using existing table schema
    const { data: savedAnalysis, error: saveError } = await supabase
      .from('report_ai_analysis')
      .insert({
        analysis_date: new Date().toISOString().split('T')[0],
        accuracy_score: analysis.accuracy_score || 50,
        highlights: analysis.highlights || [],
        anomalies: analysis.anomalies || [],
        suggestions: analysis.suggestions || [],
        motivation: analysis.motivation || '',
        raw_analysis: analysisContent,
        platform_metrics: dataSummary
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving analysis:', saveError);
      throw saveError;
    }

    console.log('Analysis saved successfully:', savedAnalysis.id);

    return new Response(
      JSON.stringify({
        success: true,
        analysis: savedAnalysis,
        data: dataSummary
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in AI weekly analysis:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
