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
    const { phone, enrollmentId } = await req.json();
    
    if (!phone || !enrollmentId) {
      console.error('Missing required parameters:', { phone, enrollmentId });
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Checking Esanj employee for phone:', phone);

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

    if (!authResponse.ok) {
      console.error('Esanj authentication failed:', authResponse.status);
      return new Response(
        JSON.stringify({ error: 'Failed to authenticate with Esanj' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const authData: EsanjAuthResponse = await authResponse.json();
    console.log('Esanj authentication successful, token received');

    // Step 2: Search for employee using phone as username
    console.log('Searching for employee with username:', phone);
    const employeeResponse = await fetch(`https://esanj.org/api/v1/employees?username=${phone}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${authData.token}`
      }
    });

    if (!employeeResponse.ok) {
      console.log('Employee not found in Esanj database');
      return new Response(
        JSON.stringify({ found: false, message: 'Employee not found in Esanj database' }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const employeeData: EsanjEmployeesResponse = await employeeResponse.json();
    
    if (!employeeData.employees || employeeData.employees.length === 0) {
      console.log('No employees found for username:', phone);
      return new Response(
        JSON.stringify({ found: false, message: 'No employees found' }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const employee = employeeData.employees[0];
    console.log('Employee found:', { id: employee.id, name: employee.name, birth_year: employee.birth_year, sex: employee.sex });

    // Step 3: Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Step 4: Update chat_users table
    console.log('Updating chat_users table...');
    const { error: userUpdateError } = await supabase
      .from('chat_users')
      .update({
        birth_year: employee.birth_year,
        sex: employee.sex
      })
      .eq('phone', phone);

    if (userUpdateError) {
      console.error('Error updating chat_users:', userUpdateError);
    } else {
      console.log('Successfully updated chat_users table');
    }

    // Step 5: Update test_enrollments table
    console.log('Updating test_enrollments table...');
    const { error: enrollmentUpdateError } = await supabase
      .from('test_enrollments')
      .update({
        birth_year: employee.birth_year,
        sex: employee.sex,
        esanj_employee_id: employee.id
      })
      .eq('id', enrollmentId);

    if (enrollmentUpdateError) {
      console.error('Error updating test_enrollments:', enrollmentUpdateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update enrollment data' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Successfully updated test_enrollments table');

    return new Response(
      JSON.stringify({
        found: true,
        employee: {
          id: employee.id,
          name: employee.name,
          birth_year: employee.birth_year,
          sex: employee.sex
        },
        message: 'Employee data retrieved and saved successfully'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in check-esanj-employee function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});