import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EsanjAuthResponse {
  token: string;
}

interface EsanjEmployee {
  id: number;
  user_id: number;
  username: string;
  name: string;
  phone_number: string;
  sex: string;
  birth_year: number;
  is_active: number;
  created_at: string;
}

interface EsanjEmployeesResponse {
  employees: EsanjEmployee[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone } = await req.json();
    console.log('Testing Esanj API for phone:', phone);

    // Step 1: Authenticate with Esanj API
    console.log('Authenticating with Esanj API...');
    const authResponse = await fetch('https://esanj.org/api/v1/login', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'rafeie',
        password: 'reza1234'
      })
    });

    console.log('Auth response status:', authResponse.status);
    
    if (!authResponse.ok) {
      const authError = await authResponse.text();
      console.error('Esanj authentication failed:', authResponse.status, authError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to authenticate with Esanj',
          status: authResponse.status,
          details: authError
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const authData: EsanjAuthResponse = await authResponse.json();
    console.log('Esanj authentication successful, token received:', authData.token?.substring(0, 10) + '...');

    // Step 2: Try different phone number formats
    const phoneFormats = [
      phone,                    // 9120784457
      `0${phone}`,             // 09120784457  
      `+98${phone}`,           // +989120784457
      `0098${phone}`,          // 00989120784457
      phone.startsWith('0') ? phone.substring(1) : `0${phone}` // Toggle 0 prefix
    ];
    
    console.log('Testing phone formats:', phoneFormats);
    
    let foundEmployee = null;
    let lastResponse = null;
    
    for (const phoneFormat of phoneFormats) {
      console.log('Trying phone format:', phoneFormat);
      
      const employeeUrl = `https://esanj.org/api/v1/employees?username=${phoneFormat}`;
      console.log('Employee API URL:', employeeUrl);
      
      const employeeResponse = await fetch(employeeUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${authData.token}`
        }
      });

      console.log('Employee response status:', employeeResponse.status);
      const employeeResponseText = await employeeResponse.text();
      console.log('Employee response body:', employeeResponseText);
      lastResponse = employeeResponseText;

      if (employeeResponse.ok) {
        try {
          const employeeData: EsanjEmployeesResponse = JSON.parse(employeeResponseText);
          if (employeeData.employees && employeeData.employees.length > 0) {
            foundEmployee = employeeData.employees[0];
            console.log('Employee found with format:', phoneFormat, foundEmployee);
            break;
          }
        } catch (parseError) {
          console.error('Failed to parse employee response:', parseError);
        }
      }
    }
    
    if (!foundEmployee) {
      console.log('No employees found with any phone format');
      return new Response(
        JSON.stringify({ 
          found: false, 
          message: 'No employees found with any phone format',
          phoneFormats: phoneFormats,
          lastResponse: lastResponse
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Employee found:', foundEmployee);

    return new Response(
      JSON.stringify({
        found: true,
        employee: foundEmployee,
        message: 'Employee data retrieved successfully'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in test-esanj-api function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});