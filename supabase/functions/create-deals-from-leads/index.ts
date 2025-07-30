import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DatabaseError extends Error {
  code?: string;
  details?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting deals creation from leads...');

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the boundless-full course
    console.log('Finding boundless-full course...');
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, title, price')
      .ilike('slug', '%boundless%')
      .single();

    if (courseError || !course) {
      console.error('Error finding boundless course:', courseError);
      
      // Try to find by title if slug search fails
      const { data: courseByTitle, error: titleError } = await supabase
        .from('courses')
        .select('id, title, price')
        .ilike('title', '%بدون مرز%')
        .single();

      if (titleError || !courseByTitle) {
        console.error('Error finding course by title:', titleError);
        return new Response(
          JSON.stringify({ 
            error: 'Could not find boundless course',
            details: courseError?.message || titleError?.message
          }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      // Use the course found by title
      Object.assign(course, courseByTitle);
    }

    console.log('Found course:', course.title, 'with ID:', course.id);

    // Get all successful enrollments that don't already have deals
    console.log('Finding enrollments without deals...');
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('enrollments')
      .select(`
        id,
        full_name,
        email,
        phone,
        payment_amount,
        created_at,
        course_id
      `)
      .in('payment_status', ['success', 'completed'])
      .order('created_at', { ascending: false });

    if (enrollmentsError) {
      console.error('Error fetching enrollments:', enrollmentsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch enrollments', details: enrollmentsError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Found ${enrollments?.length || 0} total enrollments`);

    if (!enrollments || enrollments.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No enrollments found' }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Check which enrollments already have deals
    const enrollmentIds = enrollments.map(e => e.id);
    const { data: existingDeals, error: existingDealsError } = await supabase
      .from('deals')
      .select('enrollment_id')
      .in('enrollment_id', enrollmentIds);

    if (existingDealsError) {
      console.error('Error checking existing deals:', existingDealsError);
    }

    const existingEnrollmentIds = new Set(existingDeals?.map(d => d.enrollment_id) || []);
    const enrollmentsWithoutDeals = enrollments.filter(e => !existingEnrollmentIds.has(e.id));

    console.log(`Found ${enrollmentsWithoutDeals.length} enrollments without deals`);

    if (enrollmentsWithoutDeals.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'All enrollments already have deals',
          total_enrollments: enrollments.length,
          existing_deals: existingDeals?.length || 0
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get the first sales agent to assign deals to (or use admin)
    console.log('Finding sales agent...');
    const { data: salesAgent, error: agentError } = await supabase
      .from('sales_agents')
      .select(`
        id,
        user_id,
        chat_users!inner(id, name)
      `)
      .eq('is_active', true)
      .limit(1)
      .single();

    let assignedSalespersonId = 1; // Default to admin user ID
    
    if (salesAgent && !agentError) {
      assignedSalespersonId = salesAgent.user_id;
      console.log('Found sales agent:', salesAgent.chat_users.name, 'with user ID:', assignedSalespersonId);
    } else {
      console.log('No sales agent found, using admin (ID: 1)');
    }

    // Create deals for each enrollment
    console.log('Creating deals...');
    const dealsToCreate = enrollmentsWithoutDeals.map(enrollment => ({
      enrollment_id: enrollment.id,
      course_id: course.id,
      price: enrollment.payment_amount || course.price || 0,
      status: 'won', // Since these are completed enrollments
      assigned_salesperson_id: assignedSalespersonId,
      assigned_by_id: 1, // Admin assigned these
      closed_at: enrollment.created_at, // Use enrollment date as close date
      created_at: enrollment.created_at,
      updated_at: new Date().toISOString()
    }));

    console.log(`Attempting to create ${dealsToCreate.length} deals`);

    // Insert deals in batches to avoid timeout
    const batchSize = 100;
    const createdDeals = [];
    const errors = [];

    for (let i = 0; i < dealsToCreate.length; i += batchSize) {
      const batch = dealsToCreate.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(dealsToCreate.length / batchSize)}`);

      const { data: batchResult, error: batchError } = await supabase
        .from('deals')
        .insert(batch)
        .select('id, enrollment_id');

      if (batchError) {
        console.error(`Error in batch ${Math.floor(i / batchSize) + 1}:`, batchError);
        errors.push({
          batch: Math.floor(i / batchSize) + 1,
          error: batchError.message,
          enrollments: batch.map(b => b.enrollment_id)
        });
      } else {
        console.log(`Successfully created ${batchResult?.length || 0} deals in batch ${Math.floor(i / batchSize) + 1}`);
        createdDeals.push(...(batchResult || []));
      }
    }

    // Log summary
    console.log(`Deal creation completed:
      - Total enrollments: ${enrollments.length}
      - Enrollments without deals: ${enrollmentsWithoutDeals.length}
      - Successfully created deals: ${createdDeals.length}
      - Errors: ${errors.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Deals creation completed',
        summary: {
          total_enrollments: enrollments.length,
          enrollments_without_deals: enrollmentsWithoutDeals.length,
          deals_created: createdDeals.length,
          errors_count: errors.length,
          course_used: {
            id: course.id,
            title: course.title
          },
          assigned_salesperson_id: assignedSalespersonId
        },
        created_deals: createdDeals,
        errors: errors.length > 0 ? errors : undefined
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    const dbError = error as DatabaseError;
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: dbError.message,
        code: dbError.code,
        details: dbError.details
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});