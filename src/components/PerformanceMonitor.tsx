import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Activity, Database, Wifi, AlertTriangle, CheckCircle } from 'lucide-react'
import { performanceMonitor, memoryManager } from '../utils/performance'
import { databaseMonitor } from '../utils/databaseOptimizations'
import { isSupabaseConfigured } from '../lib/supabase'

interface PerformanceMonitorProps {
  showDetails?: boolean
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ showDetails = false }) => {
  const [metrics, setMetrics] = useState({
    pageLoad: 0,
    databaseHealth: true,
    databaseResponseTime: 0,
    memoryUsage: 0,
    networkStatus: 'online'
  })
  const [showMonitor, setShowMonitor] = useState(false)
  const [isChecking, setIsChecking] = useState(false)

  useEffect(() => {
    const checkPerformance = async () => {
      // Don't run performance checks if already checking
      if (isChecking) {
        return
      }

      setIsChecking(true)
      
      try {
        // Get database health with error handling - only if configured
        let dbHealth = { healthy: true, responseTime: 0 }
        if (isSupabaseConfigured) {
          try {
            dbHealth = await databaseMonitor.checkHealth()
          } catch (error: any) {
            // Only log unexpected errors, not configuration issues
            if (!error.message?.includes('not configured')) {
              console.warn('Database health check failed (non-critical):', error.message)
            }
            dbHealth = { healthy: false, responseTime: 0 }
          }
        } else {
          dbHealth = { healthy: false, responseTime: 0 }
        }
        
        // Get memory usage safely
        let memory = { used: 0 }
        try {
          memory = memoryManager.getMemoryUsage() || { used: 0 }
        } catch (error) {
          console.warn('Memory usage check failed (non-critical):', error)
          memory = { used: 0 }
        }
        
        // Get performance metrics safely
        let pageLoadTime = 0
        try {
          const perfMetrics = performanceMonitor.getMetrics()
          const latestMetric = perfMetrics[perfMetrics.length - 1]
          pageLoadTime = latestMetric?.pageLoadTime || 0
        } catch (error) {
          console.warn('Performance metrics check failed (non-critical):', error)
          pageLoadTime = 0
        }

        setMetrics({
          pageLoad: pageLoadTime,
          databaseHealth: dbHealth.healthy,
          databaseResponseTime: dbHealth.responseTime,
          memoryUsage: memory.used,
          networkStatus: navigator.onLine ? 'online' : 'offline'
        })
      } catch (error) {
        console.warn('Performance monitoring error (non-critical):', error)
        // Set safe default values on error
        setMetrics({
          pageLoad: 0,
          databaseHealth: false,
          databaseResponseTime: 0,
          memoryUsage: 0,
          networkStatus: navigator.onLine ? 'online' : 'offline'
        })
      } finally {
        setIsChecking(false)
      }
    }

    // Only run performance checks if explicitly requested or if there are issues
    if (showDetails) {
      // Initial check after a delay to not block initial load
      const initialTimeout = setTimeout(checkPerformance, 3000)
      
      // Check performance every 3 minutes when showing details
      const interval = setInterval(checkPerformance, 180000)
      
      return () => {
        clearTimeout(initialTimeout)
        clearInterval(interval)
      }
    } else if (isSupabaseConfigured) {
      // For non-detailed view, only check occasionally and cache aggressively
      const initialTimeout = setTimeout(checkPerformance, 5000)
      
      // Check performance every 5 minutes for critical issues only
      const interval = setInterval(checkPerformance, 300000)
      
      return () => {
        clearTimeout(initialTimeout)
        clearInterval(interval)
      }
    }
  }, [isChecking, showDetails])

  // Show monitor logic
  useEffect(() => {
    if (showDetails) {
      setShowMonitor(true)
      return
    }

    // Only show for critical issues
    const hasCriticalIssues = 
      metrics.pageLoad > 10000 || // Only show for extremely slow loads
      metrics.networkStatus === 'offline' ||
      (isSupabaseConfigured && !metrics.databaseHealth && metrics.databaseResponseTime > 1000) // Only if we tried to connect and it was slow

    setShowMonitor(hasCriticalIssues)
  }, [metrics, showDetails])

  // Don't show monitor if not needed
  if (!showMonitor) return null

  const getStatusColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return 'text-green-400'
    if (value <= thresholds.warning) return 'text-yellow-400'
    return 'text-red-400'
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <AnimatePresence>
      {showMonitor && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-4 right-4 z-50"
        >
          <div className="bg-black/80 backdrop-blur-sm rounded-lg p-4 border border-white/20 min-w-[300px]">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="h-4 w-4 text-blue-400" />
              <span className="text-white text-sm font-medium">Performance Monitor</span>
              {!showDetails && (
                <button
                  onClick={() => setShowMonitor(false)}
                  className="ml-auto text-gray-400 hover:text-white text-xs"
                >
                  ×
                </button>
              )}
            </div>

            {!isSupabaseConfigured ? (
              <div className="text-center py-4">
                <Database className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-300 text-xs">Database not configured</p>
                <p className="text-gray-400 text-xs">Connect to Supabase to enable monitoring</p>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Page Load Time */}
                {(showDetails || metrics.pageLoad > 5000) && metrics.pageLoad > 0 && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wifi className="h-3 w-3 text-gray-400" />
                      <span className="text-gray-300 text-xs">Page Load</span>
                    </div>
                    <span className={`text-xs ${getStatusColor(metrics.pageLoad, { good: 2000, warning: 5000 })}`}>
                      {Math.round(metrics.pageLoad)}ms
                    </span>
                  </div>
                )}

                {/* Database Health */}
                {(showDetails || !metrics.databaseHealth) && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Database className="h-3 w-3 text-gray-400" />
                      <span className="text-gray-300 text-xs">Database</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {metrics.databaseHealth ? (
                        <CheckCircle className="h-3 w-3 text-green-400" />
                      ) : (
                        <AlertTriangle className="h-3 w-3 text-red-400" />
                      )}
                      <span className={`text-xs ${metrics.databaseHealth ? 'text-green-400' : 'text-red-400'}`}>
                        {metrics.databaseResponseTime > 0 ? `${Math.round(metrics.databaseResponseTime)}ms` : 'N/A'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Memory Usage */}
                {showDetails && metrics.memoryUsage > 0 && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity className="h-3 w-3 text-gray-400" />
                      <span className="text-gray-300 text-xs">Memory</span>
                    </div>
                    <span className="text-xs text-gray-300">
                      {formatBytes(metrics.memoryUsage)}
                    </span>
                  </div>
                )}

                {/* Network Status */}
                {(showDetails || metrics.networkStatus === 'offline') && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        metrics.networkStatus === 'online' ? 'bg-green-400' : 'bg-red-400'
                      }`} />
                      <span className="text-gray-300 text-xs">Network</span>
                    </div>
                    <span className={`text-xs ${
                      metrics.networkStatus === 'online' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {metrics.networkStatus}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Performance Tips - only show for critical issues */}
            {isSupabaseConfigured && (metrics.pageLoad > 10000 || !metrics.databaseHealth || metrics.networkStatus === 'offline') && (
              <div className="mt-3 pt-3 border-t border-white/10">
                <p className="text-yellow-400 text-xs mb-1">Performance Tips:</p>
                <ul className="text-gray-300 text-xs space-y-1">
                  {metrics.pageLoad > 10000 && (
                    <li>• Extremely slow page load detected. Check your internet connection.</li>
                  )}
                  {!metrics.databaseHealth && (
                    <li>• Database connection issues. Some features may be limited.</li>
                  )}
                  {metrics.networkStatus === 'offline' && (
                    <li>• You are offline. Please check your internet connection.</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default PerformanceMonitor