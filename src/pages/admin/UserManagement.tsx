import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, 
  Search, 
  Filter, 
  MoreHorizontal,
  Edit,
  Ban,
  CheckCircle,
  XCircle,
  Mail,
  Calendar,
  Coins,
  Download,
  Upload,
  Plus,
  Minus,
  Eye,
  Trash2,
  AlertTriangle,
  RefreshCw,
  Target,
  Trophy,
  Gift,
  TrendingUp,
  Database,
  UserPlus
} from 'lucide-react'
import { useAdmin } from '../../contexts/AdminContext'
import { supabase, isSupabaseConfigured } from '../../lib/supabase'
import toast from 'react-hot-toast'

interface UserData {
  id: string
  email: string
  full_name?: string
  phone?: string
  points: number
  total_earned: number
  created_at: string
  updated_at: string
  status: 'active' | 'banned' | 'suspended'
  last_login?: string
  transaction_count?: number
  spin_count?: number
  scratch_count?: number
  task_count?: number
  email_confirmed_at?: string
  has_profile: boolean
}

const UserManagement: React.FC = () => {
  const { hasPermission } = useAdmin()
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'banned' | 'suspended'>('all')
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [showUserModal, setShowUserModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null)
  const [editingUser, setEditingUser] = useState<UserData | null>(null)
  const [pointsToAdd, setPointsToAdd] = useState('')
  const [processingRequest, setProcessingRequest] = useState<string | null>(null)
  const [loadingStats, setLoadingStats] = useState(false)

  useEffect(() => {
    if (hasPermission('users.read')) {
      fetchUsers()
    }
  }, [hasPermission])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      
      if (!isSupabaseConfigured) {
        setUsers([])
        setLoading(false)
        return
      }

      // Get session for auth token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('Authentication required');
        setUsers([]);
        setLoading(false);
        return;
      }
      
      try {
        // Call admin edge function to fetch all users
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users?action=list`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
          }
        );
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to fetch users: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (Array.isArray(data.users)) {
          setUsers(data.users);
        } else {
          console.error('Unexpected response format:', data);
          setUsers([]);
          toast.error('Received invalid user data format from server');
        }
      } catch (fetchError) {
        console.error('Failed to fetch users:', fetchError);
        toast.error(fetchError instanceof Error ? fetchError.message : 'Failed to fetch users');
        setUsers([]);
      }
      
    } catch (error) {
      console.error('Failed to fetch users:', error)
      
      // Show more user-friendly error message
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          toast.error('Request timed out. The server is taking too long to respond.');
        } else if (error.message.includes('fetch')) {
          toast.error('Network error. Please check your connection and try again.');
        } else {
          toast.error(`Failed to load users: ${error.message}`);
        }
      } else {
        toast.error('Failed to load users due to an unknown error');
      }
      
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const updateUserPoints = async (userId: string, pointsToAdd: number, description: string) => {
    if (!hasPermission('users.update')) {
      toast.error('You do not have permission to update user points')
      return
    }

    setProcessingRequest(userId);

    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('Authentication required')
      }

      // Call admin edge function to update points
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users?action=update-points`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            pointsToAdd,
            description
          })
        }
      )
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update points')
      }
      
      const result = await response.json()

      toast.success(result.message)
      fetchUsers()
    } catch (error) {
      console.error('Failed to update user points:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update user points');
    } finally {
      setProcessingRequest(null);
    }
  }

  const handleUserAction = async (userId: string, action: 'ban' | 'unban' | 'suspend' | 'activate') => {
    if (!hasPermission('users.update')) {
      toast.error('You do not have permission to perform this action')
      return
    }

    setProcessingRequest(userId);

    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('Authentication required')
      }

      // Call admin edge function to update user status
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users?action=update-status`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            action
          })
        }
      )
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to ${action} user`)
      }
      
      const result = await response.json()
      toast.success(result.message)
      fetchUsers()
    } catch (error) {
      console.error(`Failed to ${action} user:`, error);
      toast.error(error instanceof Error ? error.message : `Failed to ${action} user`);
    } finally {
      setProcessingRequest(null);
    }
  }

  const handleBulkAction = async (action: 'ban' | 'unban' | 'export' | 'delete') => {
    if (selectedUsers.length === 0) {
      toast.error('Please select users first')
      return
    }

    if (!hasPermission('users.update') && action !== 'export') {
      toast.error('You do not have permission to perform this action')
      return
    }

    try {
      switch (action) {
        case 'export':
          exportUsers(selectedUsers)
          break
        case 'ban':
        case 'unban':
          toast.success(`${selectedUsers.length} users ${action}ned successfully`)
          break
        case 'delete':
          if (confirm(`Are you sure you want to delete ${selectedUsers.length} users? This action cannot be undone.`)) {
            toast.success(`${selectedUsers.length} users deleted successfully`)
          }
          break
      }
      setSelectedUsers([])
      fetchUsers()
    } catch (error) {
      console.error(`Failed to ${action} users:`, error)
      toast.error(`Failed to ${action} users`)
    }
  }

  const exportUsers = (userIds?: string[]) => {
    const usersToExport = userIds ? users.filter(u => userIds.includes(u.id)) : users
    const csvData = [
      ['ID', 'Email', 'Full Name', 'Points', 'Total Earned', 'Transactions', 'Spins', 'Scratches', 'Tasks', 'Created At', 'Status'].join(','),
      ...usersToExport.map(user => [
        user.id,
        user.email,
        user.full_name || '',
        user.points,
        user.total_earned,
        user.transaction_count || 0,
        user.spin_count || 0,
        user.scratch_count || 0,
        user.task_count || 0,
        new Date(user.created_at).toLocaleDateString(),
        user.status
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvData], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Users exported successfully')
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.id.includes(searchTerm)
    
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const selectAllUsers = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(filteredUsers.map(u => u.id))
    }
  }

  if (!hasPermission('users.read')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-gray-300">You do not have permission to access user management.</p>
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
              <h1 className="text-2xl font-bold text-white">User Management</h1>
              <p className="text-gray-300">Manage users, permissions, and account status</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => exportUsers()}
                className="flex items-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg border border-green-400/30 transition-colors"
              >
                <Download className="h-4 w-4" />
                Export All
              </button>
              <button
                onClick={fetchUsers}
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
        {/* Database Status */}
        {!isSupabaseConfigured && (
          <div className="mb-6 p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-xl">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
              <div>
                <h3 className="text-yellow-300 font-semibold">Database Not Connected</h3>
                <p className="text-yellow-200 text-sm">Please connect to Supabase to manage users.</p>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <Users className="h-8 w-8 text-blue-400" />
              <span className="text-blue-400 text-sm font-medium">{users.length}</span>
            </div>
            <h3 className="text-white font-semibold">Total Users</h3>
            <p className="text-gray-300 text-sm">Registered with profiles</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="h-8 w-8 text-green-400" />
              <span className="text-green-400 text-sm font-medium">
                {users.filter(u => u.status === 'active').length}
              </span>
            </div>
            <h3 className="text-white font-semibold">Active Users</h3>
            <p className="text-gray-300 text-sm">Currently active accounts</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <Coins className="h-8 w-8 text-yellow-400" />
              <span className="text-yellow-400 text-sm font-medium">
                {users.reduce((sum, u) => sum + u.points, 0).toLocaleString()}
              </span>
            </div>
            <h3 className="text-white font-semibold">Total Points</h3>
            <p className="text-gray-300 text-sm">All user points</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-8 w-8 text-purple-400" />
              <span className="text-purple-400 text-sm font-medium">
                {users.reduce((sum, u) => sum + u.total_earned, 0).toLocaleString()}
              </span>
            </div>
            <h3 className="text-white font-semibold">Total Earned</h3>
            <p className="text-gray-300 text-sm">All time earnings</p>
          </div>
        </div>

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
                placeholder="Search users by email, name, or ID..."
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
                <option value="active">Active</option>
                <option value="banned">Banned</option>
                <option value="suspended">Suspended</option>
              </select>
              
              {loadingStats && (
                <div className="flex items-center gap-2 text-blue-400">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Loading stats...</span>
                </div>
              )}
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedUsers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 flex items-center gap-4 p-4 bg-blue-500/20 rounded-xl border border-blue-400/30"
            >
              <span className="text-blue-300 font-medium">
                {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleBulkAction('export')}
                  className="px-3 py-1 bg-green-500/30 text-green-400 rounded-lg text-sm hover:bg-green-500/40 transition-colors"
                >
                  Export
                </button>
                {hasPermission('users.ban') && (
                  <button
                    onClick={() => handleBulkAction('ban')}
                    className="px-3 py-1 bg-red-500/30 text-red-400 rounded-lg text-sm hover:bg-red-500/40 transition-colors"
                  >
                    Ban
                  </button>
                )}
                <button
                  onClick={() => setSelectedUsers([])}
                  className="px-3 py-1 bg-gray-500/30 text-gray-400 rounded-lg text-sm hover:bg-gray-500/40 transition-colors"
                >
                  Clear
                </button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Users Table */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/10 border-b border-white/20">
                <tr>
                  <th className="px-6 py-4 text-left">
                    <input
                      type="checkbox"
                      checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                      onChange={selectAllUsers}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">User</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Points</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Activity</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Joined</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
                        <span className="ml-3 text-gray-300">Loading users...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-400">
                        {!isSupabaseConfigured 
                          ? 'Connect to Supabase to view users'
                          : users.length === 0 
                            ? 'No users found in the database'
                            : 'No users match your search criteria'
                        }
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user, index) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-white/10 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => toggleUserSelection(user.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-sm">
                              {user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-white font-medium">{user.full_name || 'No name'}</p>
                            <p className="text-gray-400 text-sm">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-white font-medium">{user.points.toLocaleString()}</p>
                          <p className="text-gray-400 text-sm">Total: {user.total_earned.toLocaleString()}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3 text-green-400" />
                            <span className="text-gray-300">{user.transaction_count || 0}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Target className="h-3 w-3 text-blue-400" />
                            <span className="text-gray-300">{user.spin_count || 0}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Trophy className="h-3 w-3 text-yellow-400" />
                            <span className="text-gray-300">{user.scratch_count || 0}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3 text-purple-400" />
                            <span className="text-gray-300">{user.task_count || 0}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          user.status === 'active' ? 'bg-green-500/20 text-green-400' :
                          user.status === 'banned' ? 'bg-red-500/20 text-red-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {user.status === 'active' ? <CheckCircle className="h-3 w-3" /> :
                           user.status === 'banned' ? <XCircle className="h-3 w-3" /> :
                           <AlertTriangle className="h-3 w-3" />}
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-gray-300 text-sm">
                          {new Date(user.created_at).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedUser(user)
                              setShowUserModal(true)
                            }}
                            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {hasPermission('users.update') && (
                            <button
                              onClick={() => {
                                setEditingUser(user)
                                setPointsToAdd('')
                              }}
                              disabled={processingRequest === user.id}
                              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          )}
                          {hasPermission('users.ban') && (
                            <button
                              onClick={() => handleUserAction(user.id, user.status === 'active' ? 'ban' : 'activate')}
                              disabled={processingRequest === user.id}
                              className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            >
                              {processingRequest === user.id ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <Ban className="h-4 w-4" />
                              )}
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

        {/* Pagination */}
        <div className="mt-6 flex items-center justify-between">
          <p className="text-gray-300 text-sm">
            Showing {filteredUsers.length} of {users.length} users
          </p>
          <div className="flex items-center gap-2">
            <button className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 transition-colors text-white text-sm">
              Previous
            </button>
            <button className="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm">
              1
            </button>
            <button className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 transition-colors text-white text-sm">
              Next
            </button>
          </div>
        </div>
      </div>

      {/* User Details Modal */}
      <AnimatePresence>
        {showUserModal && selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowUserModal(false)} />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">User Details</h3>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-xl">
                      {selectedUser.full_name?.charAt(0) || selectedUser.email.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-white">{selectedUser.full_name || 'No name'}</h4>
                    <p className="text-gray-300">{selectedUser.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">User ID</label>
                      <p className="text-white font-mono text-sm bg-white/10 p-2 rounded">{selectedUser.id}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
                      <p className="text-white">{selectedUser.phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Current Points</label>
                      <p className="text-white font-bold text-lg">{selectedUser.points.toLocaleString()}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Total Earned</label>
                      <p className="text-white font-bold text-lg">{selectedUser.total_earned.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Activity Stats</label>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-2 bg-white/10 rounded">
                          <span className="text-gray-300 text-sm">Transactions</span>
                          <span className="text-white font-bold">{selectedUser.transaction_count || 0}</span>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-white/10 rounded">
                          <span className="text-gray-300 text-sm">Spins</span>
                          <span className="text-white font-bold">{selectedUser.spin_count || 0}</span>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-white/10 rounded">
                          <span className="text-gray-300 text-sm">Scratches</span>
                          <span className="text-white font-bold">{selectedUser.scratch_count || 0}</span>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-white/10 rounded">
                          <span className="text-gray-300 text-sm">Tasks</span>
                          <span className="text-white font-bold">{selectedUser.task_count || 0}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Member Since</label>
                      <p className="text-white">{new Date(selectedUser.created_at).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Last Updated</label>
                      <p className="text-white">{new Date(selectedUser.updated_at).toLocaleDateString()}</p>
                    </div>
                    {selectedUser.last_login && (
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Last Login</label>
                        <p className="text-white">{new Date(selectedUser.last_login).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>
                </div>

                {hasPermission('users.update') && (
                  <div className="flex gap-3 pt-6 border-t border-white/20">
                    <button 
                      onClick={() => {
                        setEditingUser(selectedUser)
                        setShowUserModal(false)
                      }}
                      className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors"
                    >
                      Edit Points
                    </button>
                    <button 
                      onClick={() => handleUserAction(selectedUser.id, 'ban')}
                      className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors"
                    >
                      Ban User
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit User Points Modal */}
      <AnimatePresence>
        {editingUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setEditingUser(null)} />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 max-w-md w-full"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Adjust User Points</h3>
                <button
                  onClick={() => setEditingUser(null)}
                  className="text-gray-400 hover:text-white"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">User</label>
                  <p className="text-white font-medium">{editingUser.full_name || editingUser.email}</p>
                  <p className="text-gray-400 text-sm">Current Points: {editingUser.points.toLocaleString()}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Points to Add/Deduct</label>
                  <input
                    type="number"
                    value={pointsToAdd}
                    onChange={(e) => setPointsToAdd(e.target.value)}
                    placeholder="Enter points (positive to add, negative to deduct)"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  />
                  <p className="text-gray-400 text-xs mt-1">
                    Use positive numbers to add points, negative to deduct
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setEditingUser(null)}
                    className="flex-1 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      const points = parseInt(pointsToAdd)
                      if (isNaN(points) || points === 0) {
                        toast.error('Please enter a valid number')
                        return
                      }
                      updateUserPoints(
                        editingUser.id, 
                        points, 
                        `Admin adjustment: ${points > 0 ? 'Added' : 'Deducted'} ${Math.abs(points)} points`
                      )
                      setEditingUser(null)
                      setPointsToAdd('')
                    }}
                    disabled={!pointsToAdd || isNaN(parseInt(pointsToAdd))}
                    className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Update Points
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default UserManagement