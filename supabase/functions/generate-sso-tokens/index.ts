import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { enrollmentId, userEmail } = await req.json()

    if (!enrollmentId || !userEmail) {
      throw new Error('Missing required parameters: enrollmentId and userEmail')
    }

    console.log('Generating SSO tokens for enrollment:', enrollmentId, 'email:', userEmail)

    // Get enrollment and course data
    const { data: enrollment, error: enrollmentError } = await supabaseAdmin
      .from('enrollments')
      .select(`
        *,
        courses (
          slug,
          title,
          woocommerce_create_access,
          enable_course_access
        )
      `)
      .eq('id', enrollmentId)
      .single()

    if (enrollmentError) {
      console.error('Error fetching enrollment:', enrollmentError)
      throw new Error('Enrollment not found')
    }

    console.log('Enrollment data:', enrollment)

    // Generate unique tokens for each access type
    const generateToken = () => {
      return 'sso_' + crypto.randomUUID().replace(/-/g, '') + '_' + Date.now()
    }

    const tokens: { type: string; token: string; url: string }[] = []

    // Generate academy SSO token if enabled
    if (enrollment.courses.enable_course_access) {
      const academyToken = generateToken()
      
      const { error: academyTokenError } = await supabaseAdmin
        .from('sso_tokens')
        .insert({
          user_email: userEmail,
          course_slug: enrollment.courses.slug,
          token: academyToken,
          type: 'academy',
          enrollment_id: enrollmentId
        })

      if (academyTokenError) {
        console.error('Error creating academy SSO token:', academyTokenError)
        throw new Error('Failed to create academy SSO token')
      }

      tokens.push({
        type: 'academy',
        token: academyToken,
        url: `https://academy.rafiei.co/sso-access?token=${academyToken}`
      })

      console.log('Created academy SSO token:', academyToken)
    }

    // Generate WooCommerce SSO token if enabled
    if (enrollment.courses.woocommerce_create_access !== false) {
      const woocommerceToken = generateToken()
      
      const { error: wooTokenError } = await supabaseAdmin
        .from('sso_tokens')
        .insert({
          user_email: userEmail,
          course_slug: enrollment.courses.slug,
          token: woocommerceToken,
          type: 'woocommerce',
          enrollment_id: enrollmentId
        })

      if (wooTokenError) {
        console.error('Error creating WooCommerce SSO token:', wooTokenError)
        throw new Error('Failed to create WooCommerce SSO token')
      }

      tokens.push({
        type: 'woocommerce',
        token: woocommerceToken,
        url: `https://auth.rafiei.co/sso-login?token=${woocommerceToken}`
      })

      console.log('Created WooCommerce SSO token:', woocommerceToken)
    }

    // Clean up expired tokens
    await supabaseAdmin.rpc('cleanup_expired_sso_tokens')

    console.log('Generated SSO tokens successfully:', tokens)

    return new Response(
      JSON.stringify({
        success: true,
        tokens,
        enrollment: {
          id: enrollment.id,
          course_slug: enrollment.courses.slug,
          course_title: enrollment.courses.title
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error generating SSO tokens:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})