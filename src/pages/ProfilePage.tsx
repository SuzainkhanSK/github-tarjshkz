import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Shield, 
  Camera, 
  Save, 
  Lock, 
  Trash2, 
  Eye, 
  EyeOff,
  Upload,
  X,
  AlertTriangle,
  CheckCircle,
  Clock,
  Coins
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import toast from 'react-hot-toast'

export const ProfilePage: React.FC = () => {
  const { user, userProfile, updateProfile, signOut } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [imageUploading, setImageUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    full_name: userProfile?.full_name || '',
    email: userProfile?.email || '',
    phone: userProfile?.phone || ''
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })

  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Validation functions
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePhone = (phone: string): boolean => {
    if (!phone) return true // Phone is optional
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
    return phoneRegex.test(phone.replace(/\s/g, ''))
  }

  const validatePassword = (password: string): boolean => {
    return password.length >= 6
  }

  const sanitizeInput = (input: string): string => {
    return input.trim().replace(/[<>]/g, '')
  }

  // Handle form input changes
  const handleInputChange = (field: string, value: string) => {
    const sanitizedValue = sanitizeInput(value)
    setFormData(prev => ({ ...prev, [field]: sanitizedValue }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (formData.phone && !validatePhone(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle profile image upload
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file
    const maxSize = 5 * 1024 * 1024 // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']

    if (file.size > maxSize) {
      toast.error('Image must be less than 5MB')
      return
    }

    if (!allowedTypes.includes(file.type)) {
      toast.error('Only JPEG, PNG, and WebP images are allowed')
      return
    }

    setImageUploading(true)
    try {
      if (!isSupabaseConfigured) {
        throw new Error('Storage not configured')
      }

      // Create a file path that follows the RLS policy structure
      // Format: {user_id}/{user_id}-{timestamp}.{extension}
      const fileExt = file.name.split('.').pop()
      const fileName = `${user?.id}/${user?.id}-${Date.now()}.${fileExt}`
      
      const { data, error } = await supabase.storage
        .from('profile-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) throw error

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(fileName)

      setProfileImage(publicUrl)
      toast.success('Profile image uploaded successfully!')
    } catch (error: any) {
      console.error('Image upload error:', error)
      toast.error('Failed to upload image. Please try again.')
    } finally {
      setImageUploading(false)
    }
  }

  // Save profile changes
  const handleSaveProfile = async () => {
    if (!validateForm()) return

    setLoading(true)
    try {
      const updates: any = {
        full_name: formData.full_name,
        phone: formData.phone || null,
        updated_at: new Date().toISOString()
      }

      if (profileImage) {
        updates.profile_image = profileImage
      }

      await updateProfile(updates)
      setIsEditing(false)
      setProfileImage(null)
    } catch (error) {
      console.error('Profile update error:', error)
    } finally {
      setLoading(false)
    }
  }

  // Handle password change
  const handlePasswordChange = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error('Please fill in all password fields')
      return
    }

    if (!validatePassword(passwordData.newPassword)) {
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
      setShowPasswordModal(false)
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (error: any) {
      console.error('Password change error:', error)
      toast.error('Failed to update password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Handle account deletion
  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') {
      toast.error('Please type "DELETE" to confirm account deletion')
      return
    }

    setLoading(true)
    try {
      if (!isSupabaseConfigured) {
        throw new Error('Database not configured')
      }

      // Delete user profile and related data
      const { error } = await supabase.rpc('delete_user_account', {
        user_id_param: user?.id
      })

      if (error) throw error

      toast.success('Account deleted successfully')
      await signOut()
    } catch (error: any) {
      console.error('Account deletion error:', error)
      toast.error('Failed to delete account. Please contact support.')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Profile Settings</h1>
            <p className="text-gray-300">Manage your account information and preferences</p>
          </div>
          <div className="flex items-center gap-3">
            {!isEditing ? (
              <motion.button
                onClick={() => setIsEditing(true)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
              >
                Edit Profile
              </motion.button>
            ) : (
              <div className="flex gap-2">
                <motion.button
                  onClick={() => {
                    setIsEditing(false)
                    setFormData({
                      full_name: userProfile?.full_name || '',
                      email: userProfile?.email || '',
                      phone: userProfile?.phone || ''
                    })
                    setErrors({})
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={handleSaveProfile}
                  disabled={loading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save Changes
                </motion.button>
              </div>
            )}
          </div>
        </div>

        {/* Profile Image */}
        <div className="flex items-center gap-6 mb-8">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center overflow-hidden">
              {profileImage || userProfile?.profile_image ? (
                <img
                  src={profileImage || userProfile?.profile_image}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="h-12 w-12 text-white" />
              )}
            </div>
            {isEditing && (
              <motion.button
                onClick={() => fileInputRef.current?.click()}
                disabled={imageUploading}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center text-white transition-colors disabled:opacity-50"
              >
                {imageUploading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </motion.button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white mb-1">
              {userProfile?.full_name || 'User'}
            </h3>
            <p className="text-gray-300 mb-2">{userProfile?.email}</p>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Shield className="h-4 w-4" />
              <span>Member since {userProfile?.created_at ? formatDate(userProfile.created_at) : 'Unknown'}</span>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Full Name *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => handleInputChange('full_name', e.target.value)}
                disabled={!isEditing}
                className={`w-full pl-12 pr-4 py-3 bg-white/10 border rounded-xl text-white placeholder-gray-400 transition-all duration-300 ${
                  isEditing 
                    ? 'border-white/20 focus:ring-2 focus:ring-blue-400 focus:border-transparent' 
                    : 'border-white/10 cursor-not-allowed opacity-70'
                } ${errors.full_name ? 'border-red-400' : ''}`}
                placeholder="Enter your full name"
              />
            </div>
            {errors.full_name && (
              <p className="text-red-400 text-sm mt-1">{errors.full_name}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                disabled={true} // Email changes require special handling
                className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/10 rounded-xl text-white placeholder-gray-400 cursor-not-allowed opacity-70"
                placeholder="Enter your email"
              />
            </div>
            <p className="text-gray-400 text-xs mt-1">Email changes require verification</p>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                disabled={!isEditing}
                className={`w-full pl-12 pr-4 py-3 bg-white/10 border rounded-xl text-white placeholder-gray-400 transition-all duration-300 ${
                  isEditing 
                    ? 'border-white/20 focus:ring-2 focus:ring-blue-400 focus:border-transparent' 
                    : 'border-white/10 cursor-not-allowed opacity-70'
                } ${errors.phone ? 'border-red-400' : ''}`}
                placeholder="Enter your phone number"
              />
            </div>
            {errors.phone && (
              <p className="text-red-400 text-sm mt-1">{errors.phone}</p>
            )}
          </div>

          {/* Account Type */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Account Type
            </label>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value="Premium Member"
                disabled
                className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/10 rounded-xl text-white cursor-not-allowed opacity-70"
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Account Statistics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20"
      >
        <h2 className="text-2xl font-bold text-white mb-6">Account Statistics</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Coins className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">{userProfile?.points || 0}</h3>
            <p className="text-gray-300">Current Points</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">{userProfile?.total_earned || 0}</h3>
            <p className="text-gray-300">Total Earned</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Clock className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">
              {user?.last_sign_in_at ? formatDate(user.last_sign_in_at) : 'Today'}
            </h3>
            <p className="text-gray-300">Last Login</p>
          </div>
        </div>
      </motion.div>

      {/* Security Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20"
      >
        <h2 className="text-2xl font-bold text-white mb-6">Security & Privacy</h2>
        <div className="space-y-4">
          <motion.button
            onClick={() => setShowPasswordModal(true)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center justify-between p-4 bg-white/10 hover:bg-white/20 rounded-xl border border-white/20 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-blue-400" />
              <div className="text-left">
                <h3 className="text-white font-medium">Change Password</h3>
                <p className="text-gray-300 text-sm">Update your account password</p>
              </div>
            </div>
            <div className="text-gray-400">→</div>
          </motion.button>

          <motion.button
            onClick={() => setShowDeleteModal(true)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center justify-between p-4 bg-red-500/20 hover:bg-red-500/30 rounded-xl border border-red-500/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Trash2 className="h-5 w-5 text-red-400" />
              <div className="text-left">
                <h3 className="text-white font-medium">Delete Account</h3>
                <p className="text-gray-300 text-sm">Permanently delete your account and data</p>
              </div>
            </div>
            <div className="text-red-400">→</div>
          </motion.button>
        </div>
      </motion.div>

      {/* Password Change Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowPasswordModal(false)} />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Change Password</h3>
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Current Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      className="w-full pl-12 pr-12 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showPasswords.current ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    New Password
                  </label>
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

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    Confirm New Password
                  </label>
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
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePasswordChange}
                  disabled={loading}
                  className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : (
                    <Lock className="h-4 w-4" />
                  )}
                  Update Password
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Account Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-red-500/20 backdrop-blur-xl rounded-2xl p-8 border border-red-500/30 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-6 w-6 text-red-400" />
                  <h3 className="text-xl font-bold text-white">Delete Account</h3>
                </div>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="mb-6">
                <p className="text-gray-200 mb-4">
                  This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
                </p>
                <p className="text-red-300 text-sm font-medium mb-4">
                  You will lose:
                </p>
                <ul className="text-gray-300 text-sm space-y-1 mb-4">
                  <li>• All your points and rewards</li>
                  <li>• Transaction history</li>
                  <li>• Completed tasks and achievements</li>
                  <li>• Profile information and settings</li>
                </ul>
                <p className="text-gray-200 text-sm">
                  Type <span className="font-bold text-red-400">DELETE</span> to confirm:
                </p>
                <input
                  type="text"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  className="w-full mt-2 px-4 py-3 bg-white/10 border border-red-500/30 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-red-400 focus:border-transparent"
                  placeholder="Type DELETE to confirm"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={loading || deleteConfirmation !== 'DELETE'}
                  className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Delete Account
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}