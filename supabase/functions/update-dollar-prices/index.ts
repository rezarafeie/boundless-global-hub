import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TetherlandResponse {
  status: string;
  price_USDT_IRT: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Update dollar prices function called');
    
    // Create Supabase client with service role for elevated privileges
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Fetch current exchange rate from Tetherland
    console.log('📈 Fetching exchange rate from Tetherland...');
    const tetherlandResponse = await fetch('https://api.tetherland.com/currencies');
    
    if (!tetherlandResponse.ok) {
      throw new Error('Failed to fetch exchange rate from Tetherland');
    }
    
    const tetherlandData: TetherlandResponse[] = await tetherlandResponse.json();
    const usdtRate = tetherlandData.find((currency: any) => currency.status === 'USDT');
    
    if (!usdtRate) {
      throw new Error('USDT rate not found in Tetherland response');
    }
    
    const exchangeRate = usdtRate.price_USDT_IRT;
    console.log(`📊 Current USDT to IRR rate: ${exchangeRate}`);

    // Get all courses that use dollar pricing
    const { data: dollarCourses, error: coursesError } = await supabase
      .from('courses')
      .select('id, slug, title, usd_price, use_dollar_price')
      .eq('use_dollar_price', true)
      .eq('is_active', true)
      .not('usd_price', 'is', null);

    if (coursesError) {
      throw new Error(`Failed to fetch courses: ${coursesError.message}`);
    }

    if (!dollarCourses || dollarCourses.length === 0) {
      console.log('ℹ️ No courses with dollar pricing found');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No courses with dollar pricing found',
          updatedCourses: 0,
          exchangeRate
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    console.log(`🔄 Updating ${dollarCourses.length} courses with new prices...`);

    // Update each course with new Rial price
    const updatePromises = dollarCourses.map(async (course) => {
      const newRialPrice = Math.round(course.usd_price * exchangeRate);
      
      const { error: updateError } = await supabase
        .from('courses')
        .update({ price: newRialPrice })
        .eq('id', course.id);

      if (updateError) {
        console.error(`❌ Failed to update course ${course.slug}:`, updateError);
        return { course: course.slug, success: false, error: updateError.message };
      }

      console.log(`✅ Updated ${course.slug}: $${course.usd_price} → ${newRialPrice.toLocaleString()} IRR`);
      return { 
        course: course.slug, 
        success: true, 
        oldPrice: course.usd_price,
        newRialPrice: newRialPrice
      };
    });

    const updateResults = await Promise.all(updatePromises);
    const successfulUpdates = updateResults.filter(result => result.success);
    const failedUpdates = updateResults.filter(result => !result.success);

    console.log(`✅ Successfully updated ${successfulUpdates.length} courses`);
    if (failedUpdates.length > 0) {
      console.log(`❌ Failed to update ${failedUpdates.length} courses`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Updated ${successfulUpdates.length} courses with new dollar prices`,
        exchangeRate,
        updatedCourses: successfulUpdates.length,
        failedCourses: failedUpdates.length,
        results: updateResults
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('❌ Function error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error occurred',
        details: error
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});