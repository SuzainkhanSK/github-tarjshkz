import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Database, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw,
  Users,
  Activity,
  Settings,
  Wrench,
  Eye,
  EyeOff,
  Copy,
  Check
} from 'lucide-react'
import { checkDatabaseStatus, fixCommonIssues, type DatabaseStatus } from '../../utils/databaseCheck'
import toast from 'react-hot-toast'

const DatabaseStatusPage: React.FC = () => {
  const [status, setStatus] = useState<DatabaseStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [fixing, setFixing] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [copiedText, setCopiedText] = useState('')

  useEffect(() => {
    checkStatus()
  }, [])

  const checkStatus = async () => {
    setLoading(true)
    try {
      const result = await checkDatabaseStatus()
      setStatus(result)
    } catch (error: any) {
      toast.error(`Failed to check database status: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleFix = async () => {
    if (!status) return

    setFixing(true)
    try {
      const result = await fixCommonIssues()
      
      if (result.fixed.length > 0) {
        toast.success(`Fixed ${result.fixed.length} issues`)
        result.fixed.forEach(fix => console.log('Fixed:', fix))
      }
      
      if (result.errors.length > 0) {
        toast.error(`${result.errors.length} issues could not be fixed`)
        result.errors.forEach(error => console.error('Fix error:', error))
      }

      // Refresh status after fixing
      await checkStatus()
    } catch (error: any) {
      toast.error(`Fix operation failed: ${error.message}`)
    } finally {
      setFixing(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedText(text)
      toast.success('Copied to clipboard')
      setTimeout(() => setCopiedText(''), 2000)
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    }
  }

  const getStatusIcon = (exists: boolean, count?: number) => {
    if (!exists) return <XCircle className="h-5 w-5 text-red-400" />
    if (count === 0) return <AlertTriangle className="h-5 w-5 text-yellow-400" />
    return <CheckCircle className="h-5 w-5 text-green-400" />
  }

  const getStatusColor = (exists: boolean, count?: number) => {
    if (!exists) return 'text-red-400'
    if (count === 0) return 'text-yellow-400'
    return 'text-green-400'
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-8">
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4" />
          <p className="text-gray-300">Checking database status...</p>
        </div>
      </div>
    )
  }

  if (!status) {
    return (
      <div className="max-w-6xl mx-auto p-8">
        <div className="text-center py-20">
          <XCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Failed to Check Database</h2>
          <p className="text-gray-300 mb-4">Could not retrieve database status</p>
          <button
            onClick={checkStatus}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Database Status</h1>
          <p className="text-gray-300">Monitor database health and resolve issues</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 transition-colors"
          >
            {showDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showDetails ? 'Hide Details' : 'Show Details'}
          </button>
          <button
            onClick={checkStatus}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {status.errors.length === 0 && (
            <button
              onClick={handleFix}
              disabled={fixing}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              <Wrench className={`h-4 w-4 ${fixing ? 'animate-spin' : ''}`} />
              {fixing ? 'Fixing...' : 'Auto Fix'}
            </button>
          )}
        </div>
      </div>

      {/* Overall Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`bg-white/10 backdrop-blur-sm rounded-2xl p-6 border ${
          status.isConfigured ? 'border-green-400/30' : 'border-red-400/30'
        }`}>
          <div className="flex items-center gap-3 mb-2">
            {status.isConfigured ? (
              <CheckCircle className="h-6 w-6 text-green-400" />
            ) : (
              <XCircle className="h-6 w-6 text-red-400" />
            )}
            <h3 className="text-white font-semibold">Configuration</h3>
          </div>
          <p className={status.isConfigured ? 'text-green-400' : 'text-red-400'}>
            {status.isConfigured ? 'Supabase Configured' : 'Not Configured'}
          </p>
        </div>

        <div className={`bg-white/10 backdrop-blur-sm rounded-2xl p-6 border ${
          status.isConnected ? 'border-green-400/30' : 'border-red-400/30'
        }`}>
          <div className="flex items-center gap-3 mb-2">
            {status.isConnected ? (
              <CheckCircle className="h-6 w-6 text-green-400" />
            ) : (
              <XCircle className="h-6 w-6 text-red-400" />
            )}
            <h3 className="text-white font-semibold">Connection</h3>
          </div>
          <p className={status.isConnected ? 'text-green-400' : 'text-red-400'}>
            {status.isConnected ? 'Connected' : 'Disconnected'}
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
          <div className="flex items-center gap-3 mb-2">
            <Database className="h-6 w-6 text-blue-400" />
            <h3 className="text-white font-semibold">Total Users</h3>
          </div>
          <p className="text-blue-400 text-2xl font-bold">
            {status.tables.profiles.count}
          </p>
        </div>
      </div>

      {/* Tables Status */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
        <h2 className="text-xl font-bold text-white mb-6">Database Tables</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(status.tables).map(([tableName, tableStatus]) => (
            <div key={tableName} className="bg-white/10 rounded-xl p-4 border border-white/20">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getStatusIcon(tableStatus.exists, tableStatus.count)}
                  <span className="text-white font-medium capitalize">
                    {tableName.replace('_', ' ')}
                  </span>
                </div>
                <span className={`text-sm font-bold ${getStatusColor(tableStatus.exists, tableStatus.count)}`}>
                  {tableStatus.count}
                </span>
              </div>
              <p className="text-gray-400 text-xs">
                {tableStatus.exists ? `${tableStatus.count} records` : 'Table not found'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Sample Data */}
      {showDetails && status.tables.profiles.sample && (
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
          <h2 className="text-xl font-bold text-white mb-6">Sample User Data</h2>
          <div className="space-y-4">
            {status.tables.profiles.sample.map((user: any, index: number) => (
              <div key={user.id} className="bg-white/10 rounded-xl p-4 border border-white/20">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Email:</span>
                    <p className="text-white font-medium">{user.email}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Points:</span>
                    <p className="text-white font-medium">{user.points}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Total Earned:</span>
                    <p className="text-white font-medium">{user.total_earned}</p>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-gray-400 text-xs">ID:</span>
                  <code className="text-gray-300 text-xs bg-black/30 px-2 py-1 rounded">
                    {user.id}
                  </code>
                  <button
                    onClick={() => copyToClipboard(user.id)}
                    className="p-1 hover:bg-white/20 rounded transition-colors"
                  >
                    {copiedText === user.id ? (
                      <Check className="h-3 w-3 text-green-400" />
                    ) : (
                      <Copy className="h-3 w-3 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Auth Users Status */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
        <h2 className="text-xl font-bold text-white mb-4">Authentication System</h2>
        <div className="flex items-center gap-3 mb-4">
          {status.authUsers.accessible ? (
            <CheckCircle className="h-6 w-6 text-green-400" />
          ) : (
            <AlertTriangle className="h-6 w-6 text-yellow-400" />
          )}
          <div>
            <p className="text-white font-medium">
              {status.authUsers.accessible ? 'Auth Users Accessible' : 'Auth Users Not Accessible'}
            </p>
            <p className="text-gray-400 text-sm">
              {status.authUsers.accessible 
                ? `${status.authUsers.count} auth users found`
                : status.authUsers.error || 'Limited access with anonymous key (expected)'
              }
            </p>
          </div>
        </div>
        {!status.authUsers.accessible && (
          <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4">
            <p className="text-yellow-200 text-sm">
              <strong>Note:</strong> Auth users table requires service role privileges. 
              This is expected behavior when using the anonymous key. User management 
              works through the profiles table instead.
            </p>
          </div>
        )}
      </div>

      {/* Errors */}
      {status.errors.length > 0 && (
        <div className="bg-red-500/20 backdrop-blur-sm rounded-2xl p-6 border border-red-500/30">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <XCircle className="h-6 w-6 text-red-400" />
            Errors Found
          </h2>
          <div className="space-y-2">
            {status.errors.map((error, index) => (
              <div key={index} className="bg-red-500/20 rounded-lg p-3 border border-red-500/30">
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {status.recommendations.length > 0 && (
        <div className="bg-blue-500/20 backdrop-blur-sm rounded-2xl p-6 border border-blue-500/30">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Settings className="h-6 w-6 text-blue-400" />
            Recommendations
          </h2>
          <div className="space-y-2">
            {status.recommendations.map((rec, index) => (
              <div key={index} className="bg-blue-500/20 rounded-lg p-3 border border-blue-500/30">
                <p className="text-blue-200 text-sm">{rec}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default DatabaseStatusPage