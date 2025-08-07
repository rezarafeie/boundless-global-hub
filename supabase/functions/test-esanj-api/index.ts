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

    // Step 2: Search for employee using phone as username
    console.log('Searching for employee with username:', phone);
    const employeeUrl = `https://esanj.org/api/v1/employees?username=${phone}`;
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

    if (!employeeResponse.ok) {
      return new Response(
        JSON.stringify({ 
          found: false, 
          message: 'Employee API request failed',
          status: employeeResponse.status,
          response: employeeResponseText
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    let employeeData: EsanjEmployeesResponse;
    try {
      employeeData = JSON.parse(employeeResponseText);
    } catch (parseError) {
      console.error('Failed to parse employee response:', parseError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to parse employee response',
          response: employeeResponseText
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    if (!employeeData.employees || employeeData.employees.length === 0) {
      console.log('No employees found for username:', phone);
      return new Response(
        JSON.stringify({ 
          found: false, 
          message: 'No employees found',
          responseData: employeeData
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const employee = employeeData.employees[0];
    console.log('Employee found:', employee);

    return new Response(
      JSON.stringify({
        found: true,
        employee: employee,
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