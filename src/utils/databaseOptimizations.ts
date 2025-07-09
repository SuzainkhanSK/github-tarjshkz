export class DatabaseMonitor {
  private healthCache: { healthy: boolean; responseTime: number; timestamp: number } | null = null
  private readonly CACHE_DURATION = 120000 // 2 minutes - longer cache to reduce requests
  private isChecking = false

  async checkHealth(): Promise<{ healthy: boolean; responseTime: number }> {
    // Prevent concurrent health checks
    if (this.isChecking) {
      return this.healthCache || { healthy: false, responseTime: 0 }
    }

    // Return cached result if still valid
    if (this.healthCache && Date.now() - this.healthCache.timestamp < this.CACHE_DURATION) {
      return {
        healthy: this.healthCache.healthy,
        responseTime: this.healthCache.responseTime
      }
    }

    this.isChecking = true
    const startTime = Date.now()
    
    try {
      // Import supabase dynamically to avoid issues if not configured
      const { supabase, isSupabaseConfigured } = await import('../lib/supabase')
      
      // Don't attempt connection if not configured
      if (!isSupabaseConfigured) {
        const result = { healthy: false, responseTime: 0 }
        this.healthCache = { ...result, timestamp: Date.now() }
        return result
      }

      // Check network connectivity first
      if (!navigator.onLine) {
        const result = { healthy: false, responseTime: 0 }
        this.healthCache = { ...result, timestamp: Date.now() }
        return result
      }

      // Fast health check with short timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Database health check timeout')), 2000)
      })

      // Simple health check query - just check if we can connect
      const healthPromise = supabase
        .from('profiles')
        .select('id')
        .limit(1)
        .maybeSingle()

      const result = await Promise.race([healthPromise, timeoutPromise])
      const { error } = result as any
      
      const responseTime = Date.now() - startTime
      
      // Consider it healthy if we can connect, even if no data
      const healthy = !error || (error.code && error.code !== 'PGRST301')
      
      const healthResult = { healthy, responseTime }
      this.healthCache = { ...healthResult, timestamp: Date.now() }
      return healthResult
      
    } catch (error: any) {
      const responseTime = Date.now() - startTime
      
      // Don't log configuration errors as they're expected
      if (!error.message?.includes('not configured')) {
        console.warn('Database health check failed (non-critical):', error.message)
      }
      
      const result = { healthy: false, responseTime }
      this.healthCache = { ...result, timestamp: Date.now() }
      return result
    } finally {
      this.isChecking = false
    }
  }

  async optimizeQuery(query: any, options: { timeout?: number } = {}) {
    const { timeout = 5000 } = options
    
    try {
      // Check if Supabase is configured before attempting query
      const { isSupabaseConfigured } = await import('../lib/supabase')
      if (!isSupabaseConfigured) {
        throw new Error('Database not configured')
      }

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Query timeout')), timeout)
      })

      const result = await Promise.race([query, timeoutPromise])
      return result
    } catch (error) {
      console.warn('Query optimization failed:', error)
      throw error
    }
  }

  clearCache() {
    this.healthCache = null
    this.isChecking = false
  }
}

export const databaseMonitor = new DatabaseMonitor()

// Query optimization utilities
export const optimizeQuery = (query: any, options: { timeout?: number } = {}) => {
  return databaseMonitor.optimizeQuery(query, options)
}

// Batch operations for better performance
export const batchQueries = async (queries: Promise<any>[], options: { timeout?: number } = {}) => {
  const { timeout = 10000 } = options
  
  try {
    // Check if Supabase is configured before attempting queries
    const { isSupabaseConfigured } = await import('../lib/supabase')
    if (!isSupabaseConfigured) {
      throw new Error('Database not configured')
    }

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Batch query timeout')), timeout)
    })

    const results = await Promise.race([
      Promise.allSettled(queries),
      timeoutPromise
    ]) as PromiseSettledResult<any>[]

    return results
  } catch (error) {
    console.warn('Batch query failed (non-critical):', error)
    throw error
  }
}

// Connection retry utility with exponential backoff
export const retryConnection = async (
  operation: () => Promise<any>, 
  maxRetries: number = 2,
  delay: number = 500
): Promise<any> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error: any) {
      if (attempt === maxRetries) {
        throw error
      }
      
      // Don't retry configuration errors
      if (error.message?.includes('not configured')) {
        throw error
      }
      
      console.warn(`Connection attempt ${attempt} failed, retrying in ${delay}ms...`)
      await new Promise(resolve => setTimeout(resolve, delay))
      delay *= 1.5
    }
  }
}