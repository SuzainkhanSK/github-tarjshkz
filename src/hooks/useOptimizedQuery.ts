import { useState, useEffect, useCallback } from 'react'
import { dbOptimizer, performanceMonitor } from '../utils/performance'
import toast from 'react-hot-toast'

interface QueryOptions {
  enabled?: boolean
  refetchOnWindowFocus?: boolean
  staleTime?: number
  cacheTime?: number
  retry?: number
  retryDelay?: number
}

interface QueryResult<T> {
  data: T | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useOptimizedQuery<T>(
  queryKey: string,
  queryFn: () => Promise<T>,
  options: QueryOptions = {}
): QueryResult<T> {
  const {
    enabled = true,
    refetchOnWindowFocus = false,
    staleTime = 5 * 60 * 1000, // 5 minutes
    cacheTime = 10 * 60 * 1000, // 10 minutes
    retry = 3,
    retryDelay = 1000
  } = options

  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const executeQuery = useCallback(async (retryCount = 0) => {
    if (!enabled) return

    setLoading(true)
    setError(null)

    try {
      const result = await dbOptimizer.executeQuery(
        queryKey,
        queryFn,
        cacheTime
      )
      setData(result)
    } catch (err) {
      const error = err as Error
      
      if (retryCount < retry) {
        // Exponential backoff
        const delay = retryDelay * Math.pow(2, retryCount)
        setTimeout(() => {
          executeQuery(retryCount + 1)
        }, delay)
        return
      }
      
      setError(error)
      
      // Show user-friendly error message
      if (error.message.includes('timeout')) {
        toast.error('Request timed out. Please check your connection and try again.')
      } else if (error.message.includes('network')) {
        toast.error('Network error. Please check your internet connection.')
      } else {
        toast.error('Something went wrong. Please try again.')
      }
      
      console.error(`Query ${queryKey} failed:`, error)
    } finally {
      setLoading(false)
    }
  }, [queryKey, queryFn, enabled, cacheTime, retry, retryDelay])

  const refetch = useCallback(async () => {
    // Clear cache for this query
    dbOptimizer.clearCache(queryKey)
    await executeQuery()
  }, [executeQuery, queryKey])

  useEffect(() => {
    executeQuery()
  }, [executeQuery])

  useEffect(() => {
    if (!refetchOnWindowFocus) return

    const handleFocus = () => {
      // Only refetch if data is stale
      const cached = (dbOptimizer as any).queryCache.get(queryKey)
      if (!cached || Date.now() - cached.timestamp > staleTime) {
        refetch()
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [refetchOnWindowFocus, queryKey, staleTime, refetch])

  return { data, loading, error, refetch }
}