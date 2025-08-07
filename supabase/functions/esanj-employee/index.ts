import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { esanjToken, action, username, employeeData } = await req.json()
    
    if (!esanjToken) {
      throw new Error('Esanj token is required')
    }

    if (action === 'find') {
      // Search for existing employee
      console.log('Searching for employee:', username)
      
      const searchResponse = await fetch(`https://esanj.org/api/v1/employees?username=${username}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${esanjToken}`
        }
      })

      if (searchResponse.ok) {
        const searchResult = await searchResponse.json()
        console.log('Employee search result:', searchResult)
        
        return new Response(
          JSON.stringify({ 
            success: true,
            found: searchResult.employees && searchResult.employees.length > 0,
            employee: searchResult.employees?.[0] || null
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        )
      } else {
        throw new Error(`Employee search failed: ${searchResponse.status}`)
      }
    } 
    
    if (action === 'create') {
      // Create new employee
      if (!employeeData) {
        throw new Error('Employee data is required for creation')
      }

      console.log('Creating new employee:', employeeData)
      
      const createResponse = await fetch('https://esanj.org/api/v1/employee/create', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${esanjToken}`
        },
        body: JSON.stringify({
          username: employeeData.username,
          name: employeeData.name,
          phone_number: employeeData.phone_number,
          birth_year: employeeData.birth_year,
          sex: employeeData.sex,
          is_active: 1
        })
      })

      if (createResponse.ok) {
        const createResult = await createResponse.json()
        console.log('Employee created successfully:', createResult)
        
        return new Response(
          JSON.stringify({ 
            success: true,
            employee: createResult.employee
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        )
      } else {
        const errorText = await createResponse.text()
        console.error('Employee creation failed:', createResponse.status, errorText)
        throw new Error(`Employee creation failed: ${createResponse.status}`)
      }
    }

    throw new Error('Invalid action specified')
    
  } catch (error) {
    console.error('Employee management error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})