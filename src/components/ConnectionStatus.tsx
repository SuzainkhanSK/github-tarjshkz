import React, { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle, Wifi, WifiOff } from 'lucide-react'
import { testSupabaseConnection, isSupabaseConfigured } from '../lib/supabase'

export const ConnectionStatus: React.FC = () => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null)
  const [isChecking, setIsChecking] = useState(false)

  const checkConnection = async () => {
    setIsChecking(true)
    const connected = await testSupabaseConnection()
    setIsConnected(connected)
    setIsChecking(false)
  }

  useEffect(() => {
    if (isSupabaseConfigured) {
      checkConnection()
      
      // Check connection every 30 seconds
      const interval = setInterval(checkConnection, 30000)
      return () => clearInterval(interval)
    } else {
      setIsConnected(false)
    }
  }, [])

  if (!isSupabaseConfigured) {
    return (
      <div className="fixed top-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-50">
        <AlertCircle className="w-4 h-4" />
        <span className="text-sm">Supabase not configured</span>
      </div>
    )
  }

  if (isConnected === null && !isChecking) {
    return null
  }

  if (isConnected === false) {
    return (
      <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-50">
        <WifiOff className="w-4 h-4" />
        <span className="text-sm">Connection lost</span>
        <button
          onClick={checkConnection}
          className="ml-2 text-xs bg-red-200 hover:bg-red-300 px-2 py-1 rounded"
          disabled={isChecking}
        >
          {isChecking ? 'Checking...' : 'Retry'}
        </button>
      </div>
    )
  }

  if (isConnected === true) {
    return (
      <div className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-50 opacity-75">
        <CheckCircle className="w-4 h-4" />
        <span className="text-sm">Connected</span>
      </div>
    )
  }

  return null
}