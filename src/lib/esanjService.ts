import { supabase } from '@/integrations/supabase/client'

interface EsanjAuthResponse {
  success: boolean
  token?: string
  expiresAt?: string
  error?: string
}

interface EsanjEmployee {
  id: number
  username: string
  name: string
  phone_number: string
  birth_year: number
  sex: string
  is_active: number
}

class EsanjService {
  private token: string | null = null
  private tokenExpiry: Date | null = null

  async authenticate(): Promise<string> {
    // Check if we have a valid cached token
    if (this.token && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.token
    }

    try {
      const { data, error } = await supabase.functions.invoke('esanj-auth', {
        body: { username: 'rafeie', password: 'reza1234' }
      })

      if (error || !data.success) {
        throw new Error(data?.error || 'Authentication failed')
      }

      this.token = data.token
      this.tokenExpiry = new Date(data.expiresAt)
      
      return this.token
    } catch (error) {
      console.error('Esanj authentication error:', error)
      throw error
    }
  }

  async syncTestBank(): Promise<any> {
    const token = await this.authenticate()
    
    const { data, error } = await supabase.functions.invoke('esanj-test-bank', {
      body: { esanjToken: token }
    })

    if (error || !data.success) {
      throw new Error(data?.error || 'Failed to sync test bank')
    }

    return data.tests
  }

  async findOrCreateEmployee(
    username: string, 
    userData?: {
      name: string
      phone_number: string
      birth_year: number
      sex: string
    }
  ): Promise<EsanjEmployee> {
    const token = await this.authenticate()

    // First try to find existing employee
    const { data: findData, error: findError } = await supabase.functions.invoke('esanj-employee', {
      body: { 
        esanjToken: token, 
        action: 'find', 
        username 
      }
    })

    if (findError) {
      throw new Error('Failed to search for employee')
    }

    if (findData.success && findData.found) {
      return findData.employee
    }

    // If not found and userData provided, create new employee
    if (userData) {
      const { data: createData, error: createError } = await supabase.functions.invoke('esanj-employee', {
        body: { 
          esanjToken: token, 
          action: 'create', 
          employeeData: {
            username,
            ...userData
          }
        }
      })

      if (createError || !createData.success) {
        throw new Error(createData?.error || 'Failed to create employee')
      }

      return createData.employee
    }

    throw new Error('Employee not found and no data provided for creation')
  }

  async getQuestionnaire(testId: number): Promise<any> {
    const token = await this.authenticate()

    const { data, error } = await supabase.functions.invoke('esanj-questionnaire', {
      body: { 
        esanjToken: token, 
        testId
      }
    })

    if (error || !data.success) {
      throw new Error(data?.error || 'Failed to fetch questionnaire')
    }

    return data.questionnaire
  }

  async getHtmlQuestionnaire(
    testId: number,
    age: number,
    sex: string,
    uuid: string,
    employeeId?: number,
    moreInformation?: string[]
  ): Promise<string> {
    const token = await this.authenticate()

    const { data, error } = await supabase.functions.invoke('esanj-html-questionnaire', {
      body: { 
        esanjToken: token, 
        testId,
        age,
        sex,
        uuid,
        employeeId,
        moreInformation
      }
    })

    if (error || !data.success) {
      throw new Error(data?.error || 'Failed to fetch HTML questionnaire')
    }

    return data.htmlContent
  }

  async checkTestStatus(testId: number, employeeId: number): Promise<any> {
    const token = await this.authenticate()

    const { data, error } = await supabase.functions.invoke('esanj-test-status', {
      body: { 
        esanjToken: token, 
        testId, 
        employeeId 
      }
    })

    if (error || !data.success) {
      throw new Error(data?.error || 'Failed to check test status')
    }

    return data.status
  }

  async getTestResult(uuid: string, type: string = 'grading'): Promise<any> {
    const token = await this.authenticate()

    const { data, error } = await supabase.functions.invoke('esanj-result', {
      body: { 
        esanjToken: token, 
        uuid, 
        type 
      }
    })

    if (error || !data.success) {
      throw new Error(data?.error || 'Failed to fetch test result')
    }

    return data.result
  }
}

export const esanjService = new EsanjService()