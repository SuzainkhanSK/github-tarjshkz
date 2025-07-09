import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Settings, 
  Key, 
  Save, 
  Eye, 
  EyeOff, 
  RefreshCw,
  Shield,
  User,
  Mail,
  Lock,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'
import { useAdmin } from '../../contexts/AdminContext'
import { useAuth } from '../../contexts/AuthContext'
import { supabase, isSupabaseConfigured } from '../../lib/supabase'
import toast from 'react-hot-toast'

const AdminSettings: React.FC = () => {
  const { adminUser, hasPermission } = useAdmin()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const [adminData, setAdminData] = useState({
    email: adminUser?.email || '',
    role: adminUser?.role || 'support'
  })

  const handlePasswordReset = async () => {
    if (!passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error('Please fill in all password fields')
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters')
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    setLoading(true)
    try {
      if (!isSupabaseConfigured) {
        throw new Error('Authentication not configured')
      }

      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      })

      if (error) throw error

      toast.success('Password updated successfully!')
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (error: any) {
      console.error('Password change error:', error)
      toast.error('Failed to update password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleQuickPasswordReset = async () => {
    const confirmed = confirm(
      'This will reset your password to "admin@premiumaccesszone". Are you sure you want to continue?'
    )
    
    if (!confirmed) return

    setLoading(true)
    try {
      if (!isSupabaseConfigured) {
        throw new Error('Authentication not configured')
      }

      const { error } = await supabase.auth.updateUser({
        password: 'admin@premiumaccesszone'
      })

      if (error) throw error

      toast.success('Password reset to "admin@premiumaccesszone" successfully!')
    } catch (error: any) {
      console.error('Quick password reset error:', error)
      toast.error('Failed to reset password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSendPasswordResetEmail = async () => {
    if (!adminUser?.email) {
      toast.error('No email address found')
      return
    }

    setLoading(true)
    try {
      if (!isSupabaseConfigured) {
        throw new Error('Authentication not configured')
      }

      const { error } = await supabase.auth.resetPasswordForEmail(adminUser.email, {
        redirectTo: `${window.location.origin}/admin`
      })

      if (error) throw error

      toast.success('Password reset email sent! Check your inbox.')
    } catch (error: any) {
      console.error('Password reset email error:', error)
      toast.error('Failed to send password reset email.')
    } finally {
      setLoading(false)
    }
  }

  if (!hasPermission('*') && !hasPermission('admin.settings')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-gray-300">You do not have permission to access admin settings.</p>
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
              <h1 className="text-2xl font-bold text-white">Admin Settings</h1>
              <p className="text-gray-300">Manage your admin account and security settings</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Admin Profile */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center">
              <User className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Admin Profile</h2>
              <p className="text-gray-300">Your admin account information</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  value={adminData.email}
                  disabled
                  className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white cursor-not-allowed opacity-70"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Role</label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={adminData.role.replace('_', ' ').toUpperCase()}
                  disabled
                  className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white cursor-not-allowed opacity-70"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Password Management */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20"
        >
          <div className="flex items-center gap-3 mb-6">
            <Key className="h-6 w-6 text-yellow-400" />
            <h2 className="text-2xl font-bold text-white">Password Management</h2>
          </div>

          {/* Quick Password Reset */}
          <div className="mb-8 p-6 bg-yellow-400/20 rounded-xl border border-yellow-400/30">
            <h3 className="text-lg font-semibold text-yellow-300 mb-3">Quick Password Reset</h3>
            <p className="text-yellow-200 text-sm mb-4">
              Reset your password to the default admin password instantly. This is useful if you've forgotten your current password.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleQuickPasswordReset}
                disabled={loading}
                className="px-6 py-3 bg-yellow-500/30 hover:bg-yellow-500/40 border border-yellow-400/50 rounded-lg text-yellow-200 font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Key className="h-4 w-4" />
                )}
                Reset to Default Password
              </button>
              <button
                onClick={handleSendPasswordResetEmail}
                disabled={loading}
                className="px-6 py-3 bg-blue-500/30 hover:bg-blue-500/40 border border-blue-400/50 rounded-lg text-blue-200 font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4" />
                )}
                Send Reset Email
              </button>
            </div>
          </div>

          {/* Manual Password Change */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Change Password Manually</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="w-full pl-12 pr-12 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showPasswords.new ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Confirm New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full pl-12 pr-12 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showPasswords.confirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <button
                onClick={handlePasswordReset}
                disabled={loading || !passwordData.newPassword || !passwordData.confirmPassword}
                className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Update Password
              </button>
            </div>
          </div>
        </motion.div>

        {/* Security Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20"
        >
          <div className="flex items-center gap-3 mb-6">
            <Shield className="h-6 w-6 text-green-400" />
            <h2 className="text-2xl font-bold text-white">Security Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-green-500/20 rounded-xl border border-green-400/30">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <div>
                  <p className="text-green-300 font-medium">Account Status</p>
                  <p className="text-green-200 text-sm">Active Admin Account</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-4 bg-blue-500/20 rounded-xl border border-blue-400/30">
                <Shield className="h-5 w-5 text-blue-400" />
                <div>
                  <p className="text-blue-300 font-medium">Role Permissions</p>
                  <p className="text-blue-200 text-sm">{adminUser?.role === 'super_admin' ? 'Full Access' : 'Limited Access'}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-white/10 rounded-xl border border-white/20">
                <p className="text-gray-300 font-medium mb-2">Last Login</p>
                <p className="text-white">{new Date().toLocaleDateString()}</p>
              </div>
              
              <div className="p-4 bg-white/10 rounded-xl border border-white/20">
                <p className="text-gray-300 font-medium mb-2">Session Status</p>
                <p className="text-green-400">Active</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default AdminSettings