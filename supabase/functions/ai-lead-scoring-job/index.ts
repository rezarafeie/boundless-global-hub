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
    const { jobId, action } = await req.json();

    if (!jobId) {
      return new Response(
        JSON.stringify({ error: 'Job ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Handle different actions
    if (action === 'cancel') {
      const { error } = await supabase
        .from('lead_analysis_jobs')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', jobId);

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, message: 'Job cancelled' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'pause') {
      const { error } = await supabase
        .from('lead_analysis_jobs')
        .update({ status: 'paused', updated_at: new Date().toISOString() })
        .eq('id', jobId);

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, message: 'Job paused' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'resume' || action === 'retry' || !action) {
      // Get job details
      const { data: job, error: jobError } = await supabase
        .from('lead_analysis_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (jobError || !job) {
        return new Response(
          JSON.stringify({ error: 'Job not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update job status to running
      await supabase
        .from('lead_analysis_jobs')
        .update({ 
          status: 'running', 
          updated_at: new Date().toISOString(),
          error_message: null 
        })
        .eq('id', jobId);

      // Process the job
      try {
        const batchSize = 20;
        let offset = action === 'resume' ? job.progress_current : 0;
        let allLeads: any[] = action === 'resume' && job.results?.leads ? job.results.leads : [];

        // Build the base query with date filters
        let countQuery = supabase
          .from('enrollments')
          .select('*', { count: 'exact', head: true })
          .eq('course_id', job.course_id)
          .in('payment_status', ['completed', 'success']);

        if (job.start_date && job.end_date) {
          countQuery = countQuery.gte('created_at', job.start_date).lte('created_at', job.end_date);
        }

        const { count: totalCount } = await countQuery;

        // Update total count
        await supabase
          .from('lead_analysis_jobs')
          .update({ progress_total: totalCount || 0 })
          .eq('id', jobId);

        while (offset < (totalCount || 0)) {
          // Check if job was cancelled or paused
          const { data: currentJob } = await supabase
            .from('lead_analysis_jobs')
            .select('status')
            .eq('id', jobId)
            .single();

          if (currentJob?.status === 'cancelled' || currentJob?.status === 'paused') {
            return new Response(
              JSON.stringify({ success: true, message: `Job ${currentJob.status}` }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          // Fetch enrollments batch
          let enrollmentsQuery = supabase
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
            .eq('course_id', job.course_id)
            .in('payment_status', ['completed', 'success']);

          if (job.start_date && job.end_date) {
            enrollmentsQuery = enrollmentsQuery.gte('created_at', job.start_date).lte('created_at', job.end_date);
          }

          const { data: enrollments, error: enrollError } = await enrollmentsQuery
            .order('created_at', { ascending: false })
            .range(offset, offset + batchSize - 1);

          if (enrollError || !enrollments || enrollments.length === 0) break;

          // Fetch user IDs from enrollments
          const chatUserIds = enrollments
            .map(e => e.chat_user_id)
            .filter((id): id is number => id !== null);

          console.log(`Fetching progress for ${chatUserIds.length} users in course ${job.course_id}`);

          // Fetch lesson progress for these users
          const { data: lessonProgress, error: progressError } = await supabase
            .from('user_lesson_progress')
            .select('user_id, course_id, is_completed, total_time_spent, last_viewed_at')
            .eq('course_id', job.course_id)
            .in('user_id', chatUserIds);

          console.log(`Lesson progress fetched: ${lessonProgress?.length || 0} records, error:`, progressError);

          // Fetch support conversations
          const { data: supportConvs, error: supportError } = await supabase
            .from('support_conversations')
            .select('user_id, status, created_at')
            .in('user_id', chatUserIds);

          console.log(`Support conversations fetched: ${supportConvs?.length || 0} records, error:`, supportError);

          // Fetch CRM notes
          const { data: crmNotes, error: crmError } = await supabase
            .from('crm_notes')
            .select('user_id, type, created_at')
            .eq('course_id', job.course_id)
            .in('user_id', chatUserIds);

          console.log(`CRM notes fetched: ${crmNotes?.length || 0} records, error:`, crmError);

          // Build user behavior data
          const userBehaviorData = enrollments.map((enrollment, idx) => {
            const userId = enrollment.chat_user_id;
            
            const userLessons = lessonProgress?.filter(lp => lp.user_id === userId) || [];
            const userSupport = supportConvs?.filter(sc => sc.user_id === userId) || [];
            const userCRM = crmNotes?.filter(cn => cn.user_id === userId) || [];

            if (idx === 0) {
              console.log(`Sample user data - userId: ${userId}, lessons: ${userLessons.length}, support: ${userSupport.length}, crm: ${userCRM.length}`);
              if (userLessons.length > 0) {
                console.log('Sample lesson:', JSON.stringify(userLessons[0]));
              }
            }

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
              chat_user_id: userId,
              metrics: {
                total_lessons_enrolled: totalLessons,
                completed_lessons: completedLessons,
                completion_percentage: totalLessons > 0 ? (completedLessons / totalLessons * 100).toFixed(1) : 0,
                total_time_minutes: Math.round(totalTimeSpent / 60),
                hours_since_last_activity: Math.round(hoursSinceLastActivity),
                has_support_conversation: userSupport.length > 0,
                crm_interactions: userCRM.length,
              }
            };
          });

          console.log(`Built behavior data for ${userBehaviorData.length} users. Sample metrics:`, userBehaviorData[0]?.metrics);

          // Create ultra-compact summary for AI
          const compactData = userBehaviorData.map((u, idx) => [
            idx,
            u.metrics.total_lessons_enrolled,
            u.metrics.completed_lessons,
            Math.round(parseFloat(u.metrics.completion_percentage)),
            u.metrics.total_time_minutes,
            Math.min(u.metrics.hours_since_last_activity, 999),
            u.metrics.has_support_conversation ? 1 : 0,
            u.metrics.crm_interactions
          ]);

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
                  content: `Score leads 0-100. HOT(75-100), WARM(50-74), COLD(0-49). Score based on: completion%, time, recency, support, CRM interactions.`
                },
                {
                  role: 'user',
                  content: `Score ${compactData.length} leads. Array format: [idx,total_lessons,completed,completion%,minutes,hrs_inactive,support,crm]\n${JSON.stringify(compactData)}`
                }
              ],
              tools: [{
                type: 'function',
                function: {
                  name: 'score_leads',
                  description: 'Return lead scores',
                  parameters: {
                    type: 'object',
                    properties: {
                      scores: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            idx: { type: 'number' },
                            score: { type: 'number' },
                            status: { type: 'string' },
                            reason: { type: 'string' }
                          },
                          required: ['idx', 'score', 'status', 'reason']
                        }
                      }
                    },
                    required: ['scores']
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
              errorMessage = 'سرویس AI موقتاً در دسترس نیست';
            } else if (aiResponse.status === 429) {
              errorMessage = 'تعداد درخواست‌ها بیش از حد مجاز است';
            } else if (aiResponse.status === 402) {
              errorMessage = 'اعتبار AI تمام شده است';
            }
            
            throw new Error(errorMessage);
          }

          const aiResult = await aiResponse.json();

          // Extract scores from AI response
          const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
          let scoredLeads = [];

          if (toolCall?.function?.arguments) {
            const args = typeof toolCall.function.arguments === 'string' 
              ? JSON.parse(toolCall.function.arguments)
              : toolCall.function.arguments;
            scoredLeads = args.scores || args.scored_leads || [];
          }

          // Merge AI scores with original data using index
          const batchLeads = userBehaviorData.map((userData, idx) => {
            const aiScore = scoredLeads.find(sl => sl.idx === idx || sl.enrollment_id === userData.enrollment_id);
            return {
              ...userData,
              score: aiScore?.score || 0,
              status: aiScore?.status || 'COLD',
              reasoning: aiScore?.reason || aiScore?.reasoning || 'No AI analysis'
            };
          });

          allLeads = [...allLeads, ...batchLeads];
          offset += batchSize;

          // Update progress
          const sortedLeads = allLeads.sort((a, b) => b.score - a.score);
          await supabase
            .from('lead_analysis_jobs')
            .update({ 
              progress_current: offset,
              results: {
                leads: sortedLeads,
                total_analyzed: sortedLeads.length,
                hot_leads: sortedLeads.filter(l => l.status === 'HOT').length,
                warm_leads: sortedLeads.filter(l => l.status === 'WARM').length,
                cold_leads: sortedLeads.filter(l => l.status === 'COLD').length
              },
              updated_at: new Date().toISOString()
            })
            .eq('id', jobId);
        }

        // Mark job as completed
        await supabase
          .from('lead_analysis_jobs')
          .update({ 
            status: 'completed',
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', jobId);

        return new Response(
          JSON.stringify({ success: true, message: 'Job completed successfully' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      } catch (error: any) {
        console.error('Error processing job:', error);
        
        // Mark job as failed
        await supabase
          .from('lead_analysis_jobs')
          .update({ 
            status: 'failed',
            error_message: error.message,
            updated_at: new Date().toISOString()
          })
          .eq('id', jobId);

        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-lead-scoring-job function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
