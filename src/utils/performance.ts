// Performance monitoring and optimization utilities
import React from 'react'
import { supabase } from '../lib/supabase'

// Performance metrics collection
export interface PerformanceMetrics {
  pageLoadTime: number
  databaseResponseTime: number
  renderTime: number
  memoryUsage: number
  timestamp: number
  userId?: string
  page: string
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = []
  private observer: PerformanceObserver | null = null

  constructor() {
    this.initializeObserver()
  }

  private initializeObserver() {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      this.observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry) => {
          if (entry.entryType === 'navigation') {
            this.recordPageLoad(entry as PerformanceNavigationTiming)
          }
        })
      })
      
      this.observer.observe({ entryTypes: ['navigation', 'measure'] })
    }
  }

  private recordPageLoad(entry: PerformanceNavigationTiming) {
    const metrics: PerformanceMetrics = {
      pageLoadTime: entry.loadEventEnd - entry.navigationStart,
      databaseResponseTime: 0, // Will be set by database operations
      renderTime: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
      memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
      timestamp: Date.now(),
      page: window.location.pathname
    }
    
    this.metrics.push(metrics)
    this.sendMetricsToServer(metrics)
  }

  public recordDatabaseOperation(startTime: number, endTime: number) {
    const responseTime = endTime - startTime
    const lastMetric = this.metrics[this.metrics.length - 1]
    if (lastMetric) {
      lastMetric.databaseResponseTime = responseTime
    }
  }

  private async sendMetricsToServer(metrics: PerformanceMetrics) {
    try {
      // Only send if performance is concerning (>3 seconds load time)
      if (metrics.pageLoadTime > 3000) {
        console.warn('Slow page load detected:', metrics)
        // In production, send to analytics service
      }
    } catch (error) {
      console.error('Failed to send performance metrics:', error)
    }
  }

  public getMetrics(): PerformanceMetrics[] {
    return this.metrics
  }

  public clearMetrics() {
    this.metrics = []
  }
}

export const performanceMonitor = new PerformanceMonitor()

// Database query optimization
export class DatabaseOptimizer {
  private queryCache = new Map<string, { data: any; timestamp: number; ttl: number }>()
  private readonly DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes

  async executeQuery<T>(
    queryKey: string,
    queryFn: () => Promise<T>,
    ttl: number = this.DEFAULT_TTL
  ): Promise<T> {
    const startTime = performance.now()
    
    // Check cache first
    const cached = this.queryCache.get(queryKey)
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      const endTime = performance.now()
      performanceMonitor.recordDatabaseOperation(startTime, endTime)
      return cached.data
    }

    try {
      const data = await queryFn()
      
      // Cache the result
      this.queryCache.set(queryKey, {
        data,
        timestamp: Date.now(),
        ttl
      })
      
      const endTime = performance.now()
      performanceMonitor.recordDatabaseOperation(startTime, endTime)
      
      return data
    } catch (error) {
      const endTime = performance.now()
      performanceMonitor.recordDatabaseOperation(startTime, endTime)
      throw error
    }
  }

  clearCache(pattern?: string) {
    if (pattern) {
      for (const key of this.queryCache.keys()) {
        if (key.includes(pattern)) {
          this.queryCache.delete(key)
        }
      }
    } else {
      this.queryCache.clear()
    }
  }
}

export const dbOptimizer = new DatabaseOptimizer()

// Image optimization utilities
export const optimizeImage = (src: string, width?: number, height?: number, quality: number = 80): string => {
  // For external images (Pexels), add optimization parameters
  if (src.includes('pexels.com')) {
    const url = new URL(src)
    if (width) url.searchParams.set('w', width.toString())
    if (height) url.searchParams.set('h', height.toString())
    url.searchParams.set('auto', 'compress')
    url.searchParams.set('cs', 'tinysrgb')
    return url.toString()
  }
  
  return src
}

// Lazy loading hook
export const useLazyLoading = () => {
  const observerRef = React.useRef<IntersectionObserver | null>(null)
  
  const observe = React.useCallback((element: HTMLElement, callback: () => void) => {
    if (!observerRef.current) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              callback()
              observerRef.current?.unobserve(entry.target)
            }
          })
        },
        { threshold: 0.1 }
      )
    }
    
    observerRef.current.observe(element)
  }, [])
  
  React.useEffect(() => {
    return () => {
      observerRef.current?.disconnect()
    }
  }, [])
  
  return { observe }
}

// Memory management
export const memoryManager = {
  cleanup: () => {
    // Clear caches
    dbOptimizer.clearCache()
    performanceMonitor.clearMetrics()
    
    // Force garbage collection if available
    if ((window as any).gc) {
      (window as any).gc()
    }
  },
  
  getMemoryUsage: () => {
    if ((performance as any).memory) {
      return {
        used: (performance as any).memory.usedJSHeapSize,
        total: (performance as any).memory.totalJSHeapSize,
        limit: (performance as any).memory.jsHeapSizeLimit
      }
    }
    return null
  }
}