import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Gift, 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Eye,
  Edit,
  Download,
  RefreshCw,
  Calendar,
  User,
  Mail,
  MapPin,
  MessageSquare,
  Key,
  FileText
} from 'lucide-react'
import { useAdmin } from '../../contexts/AdminContext'
import { supabase, isSupabaseConfigured } from '../../lib/supabase'
import toast from 'react-hot-toast'

interface RedemptionRequest {
  id: string
  user_id: string
  subscription_id: string
  subscription_name: string
  duration: string
  points_cost: number
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  user_email: string
  user_country: string
  user_notes?: string
  activation_code?: string
  instructions?: string
  expires_at?: string
  created_at: string
  completed_at?: string
  profiles?: {
    full_name?: string
    email: string
  }
}

const RedemptionManagement: React.FC = () => {
  const { hasPermission } = useAdmin()
  const [requests, setRequests] = useState<RedemptionRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'>('all')
  const [selectedRequest, setSelectedRequest] = useState<RedemptionRequest | null>(null)
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [processingRequest, setProcessingRequest] = useState<string | null>(null)

  useEffect(() => {
    if (hasPermission('redemptions.read')) {
      fetchRedemptionRequests()
    }
  }, [hasPermission])

  const fetchRedemptionRequests = async () => {
    try {
      setLoading(true)
      
      // Get current user session
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('Authentication required')
      }

      // Construct the URL properly
      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-redemptions`
      
      console.log('Fetching redemption requests from:', functionUrl)
      
      const response = await fetch(functionUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Edge Function error response:', errorText)
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { error: errorText }
        }
        throw new Error(errorData.error || `Failed to fetch redemption requests: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('Fetched redemption requests:', data)
      
      if (Array.isArray(data)) {
        setRequests(data)
      } else {
        console.error('Unexpected response format:', data)
        setRequests([])
        toast.error('Received invalid data format from server')
      }
    } catch (error) {
      console.error('Failed to fetch redemption requests:', error)
      toast.error('Failed to load redemption requests')
    } finally {
      setLoading(false)
    }
  }

  const updateRequestStatus = async (
    requestId: string, 
    newStatus: 'processing' | 'completed' | 'failed' | 'cancelled',
   activationCode?: string,
   instructions?: string
  ) => {
    if (!hasPermission('redemptions.update')) {
      toast.error('You do not have permission to update redemption requests')
      return
    }

    setProcessingRequest(requestId)

    try {
      // Get current user session
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('Authentication required')
      }

      // Construct the URL properly
      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-redemptions`
      
     // Log request details for debugging
     console.log('Updating redemption request:', {
       url: functionUrl,
       requestId,
       newStatus,
      activationCode: activationCode ? 'provided' : 'not provided',
      instructions: instructions ? 'provided' : 'not provided'
     })
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId,
          newStatus,
          activationCode,
          instructions
        })
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Edge Function error response:', errorText)
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { error: errorText }
        }
        throw new Error(errorData.error || `Failed to update redemption request: ${response.status} ${response.statusText}`)
      }
      
      const result = await response.json()
      console.log('Edge Function success response:', result)

      toast.success(`Request ${newStatus} successfully`)
      fetchRedemptionRequests()
    } catch (error) {
      console.error('Failed to update request:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update request')
    } finally {
      setProcessingRequest(null)
    }
  }

  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.subscription_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.id.includes(searchTerm)
    
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />
      case 'processing': return <RefreshCw className="h-4 w-4 animate-spin" />
      case 'completed': return <CheckCircle className="h-4 w-4" />
      case 'failed': return <XCircle className="h-4 w-4" />
      case 'cancelled': return <XCircle className="h-4 w-4" />
      default: return <AlertTriangle className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-400'
      case 'processing': return 'bg-blue-500/20 text-blue-400'
      case 'completed': return 'bg-green-500/20 text-green-400'
      case 'failed': return 'bg-red-500/20 text-red-400'
      case 'cancelled': return 'bg-gray-500/20 text-gray-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  if (!hasPermission('redemptions.read')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-gray-300">You do not have permission to access redemption management.</p>
        </div>
      </div>
    )
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Configuration Error</h2>
          <p className="text-gray-300">Supabase is not configured. Please check your environment variables.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Redemption Management</h1>
              <p className="text-gray-300">Process and manage subscription redemption requests</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <span className="text-gray-300">Pending: {requests.filter(r => r.status === 'pending').length}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                  <span className="text-gray-300">Processing: {requests.filter(r => r.status === 'processing').length}</span>
                </div>
              </div>
              <button
                onClick={fetchRedemptionRequests}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 text-white ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by subscription, email, or ID..."
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Requests Table */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/10 border-b border-white/20">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Request</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">User</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Subscription</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Points</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Date</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
                        <span className="ml-3 text-gray-300">Loading requests...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <Gift className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-400">No redemption requests found</p>
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((request, index) => (
                    <motion.tr
                      key={request.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-white/10 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-white font-medium font-mono text-sm">
                            {request.id.slice(0, 8)}...
                          </p>
                          <p className="text-gray-400 text-xs">
                            {request.user_country}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-white font-medium">{request.profiles?.full_name || 'No name'}</p>
                          <p className="text-gray-400 text-sm">{request.user_email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-white font-medium">{request.subscription_name}</p>
                          <p className="text-gray-400 text-sm">{request.duration}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-white font-bold">{request.points_cost.toLocaleString()}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                          {getStatusIcon(request.status)}
                          {request.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-gray-300 text-sm">
                          {new Date(request.created_at).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedRequest(request)
                              setShowRequestModal(true)
                            }}
                            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {hasPermission('redemptions.update') && request.status === 'pending' && (
                            <button
                              onClick={() => updateRequestStatus(request.id, 'processing')}
                              disabled={processingRequest === request.id}
                              className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors disabled:opacity-50"
                            >
                              <RefreshCw className={`h-4 w-4 ${processingRequest === request.id ? 'animate-spin' : ''}`} />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Request Details Modal */}
      <AnimatePresence>
        {showRequestModal && selectedRequest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowRequestModal(false)} />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">Redemption Request Details</h3>
                <button
                  onClick={() => setShowRequestModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Request Information */}
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-4">Request Information</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Request ID</label>
                        <p className="text-white font-mono text-sm bg-white/10 p-2 rounded">{selectedRequest.id}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Subscription</label>
                        <p className="text-white font-medium">{selectedRequest.subscription_name}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Duration</label>
                        <p className="text-white">{selectedRequest.duration}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Points Cost</label>
                        <p className="text-white font-bold text-lg">{selectedRequest.points_cost.toLocaleString()}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedRequest.status)}`}>
                          {getStatusIcon(selectedRequest.status)}
                          {selectedRequest.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* User Information */}
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-4">User Information</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
                        <p className="text-white">{selectedRequest.profiles?.full_name || 'No name provided'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                        <p className="text-white">{selectedRequest.user_email}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Country</label>
                        <p className="text-white">{selectedRequest.user_country}</p>
                      </div>
                      {selectedRequest.user_notes && (
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">User Notes</label>
                          <p className="text-white bg-white/10 p-3 rounded whitespace-pre-wrap">{selectedRequest.user_notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Processing Information */}
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-4">Processing Information</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Created</label>
                        <p className="text-white">{new Date(selectedRequest.created_at).toLocaleString()}</p>
                      </div>
                      {selectedRequest.completed_at && (
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">Completed</label>
                          <p className="text-white">{new Date(selectedRequest.completed_at).toLocaleString()}</p>
                        </div>
                      )}
                      {selectedRequest.activation_code && (
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">Activation Code</label>
                          <p className="text-white font-mono bg-white/10 p-2 rounded whitespace-pre-wrap">{selectedRequest.activation_code}</p>
                        </div>
                      )}
                      {selectedRequest.instructions && (
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">Instructions</label>
                          <p className="text-white bg-white/10 p-3 rounded whitespace-pre-wrap">{selectedRequest.instructions}</p>
                        </div>
                      )}
                      {selectedRequest.expires_at && (
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">Expires</label>
                          <p className="text-white">{new Date(selectedRequest.expires_at).toLocaleString()}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  {hasPermission('redemptions.update') && selectedRequest.status !== 'completed' && (
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-4">Actions</h4>
                      <div className="space-y-3">
                        {selectedRequest.status === 'pending' && (
                          <button
                            onClick={() => updateRequestStatus(selectedRequest.id, 'processing')}
                            disabled={processingRequest === selectedRequest.id}
                            className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                          >
                            Start Processing
                          </button>
                        )}
                        {selectedRequest.status === 'processing' && (
                          <div className="space-y-3">
                            <button
                              onClick={() => {
                                const code = prompt('Enter activation code (required):')
                                if (code) {
                                  const instructions = prompt('Enter instructions for the user (optional):')
                                  updateRequestStatus(selectedRequest.id, 'completed', code, instructions)
                                } else {
                                  toast.error('Activation code is required to complete the request')
                                }
                              }}
                              disabled={processingRequest === selectedRequest.id}
                              className="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-colors"
                            >
                              {processingRequest === selectedRequest.id ? 'Processing...' : 'Mark as Completed'}
                            </button>
                            <button
                              onClick={() => updateRequestStatus(selectedRequest.id, 'failed')}
                              disabled={processingRequest === selectedRequest.id}
                              className="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors"
                            >
                              {processingRequest === selectedRequest.id ? 'Processing...' : 'Mark as Failed'}
                            </button>
                          </div>
                        )}
                        <button
                          onClick={() => updateRequestStatus(selectedRequest.id, 'cancelled')}
                          disabled={processingRequest === selectedRequest.id}
                          className="w-full py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors"
                        >
                          {processingRequest === selectedRequest.id ? 'Processing...' : 'Cancel Request'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default RedemptionManagement