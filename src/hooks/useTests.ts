import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { esanjService } from '@/lib/esanjService'

interface Test {
  id: string
  test_id: number
  title: string
  description?: string
  price: number
  slug: string
  count_ready: number
  count_used: number
  is_active: boolean
}

export const useTests = () => {
  const [tests, setTests] = useState<Test[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTests = async () => {
    try {
      setLoading(true)
      setError(null)

      // Only fetch from local database - no API sync
      const { data, error: dbError } = await supabase
        .from('tests')
        .select('*')
        .eq('is_active', true)
        .order('title')

      if (dbError) {
        throw dbError
      }

      setTests(data || [])
    } catch (err) {
      console.error('Error fetching tests:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch tests')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTests()
  }, [])

  return {
    tests,
    loading,
    error,
    refetch: fetchTests
  }
}