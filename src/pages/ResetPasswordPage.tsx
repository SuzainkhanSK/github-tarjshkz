import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Lock, Eye, EyeOff, ArrowRight, CheckCircle, RefreshCw, ArrowLeft } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import toast from 'react-hot-toast'

const ResetPasswordPage: React.FC = () => {
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resetComplete, setResetComplete] = useState(false)
  const [hasResetToken, setHasResetToken] = useState(false)
  
  const navigate = useNavigate()

  useEffect(() => {
    // Check if URL contains reset token
    const hash = window.location.hash
    const params = new URLSearchParams(hash.substring(1))
    const type = params.get('type')
    
    if (type === 'recovery') {
      setHasResetToken(true)
    } else {
      toast.error('Invalid or missing reset token')
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    try {
      if (!isSupabaseConfigured) {
        throw new Error('Database not configured. Please connect to Supabase first.')
      }

      const { error } = await supabase.auth.updateUser({
        password: formData.password
      })

      if (error) throw error
      
      setResetComplete(true)
      toast.success('Password has been reset successfully!')
    } catch (error: any) {
      console.error('Password reset error:', error)
      toast.error(error.message || 'Failed to reset password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleGoToLogin = () => {
    navigate('/login')
  }

  if (!hasResetToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl text-center">
          <div className="flex justify-center mb-6">
            <img src="https://i.ibb.co/99y0NdZb/Premium-Access-Zone-LOGO.png" alt="Premium Access Zone" className="h-16 w-auto" />
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-4">Invalid Reset Link</h1>
          <p className="text-gray-300 mb-6">
            The password reset link is invalid or has expired. Please request a new password reset link.
          </p>
          
          <Link 
            to="/forgot-password" 
            className="block w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors"
          >
            Request New Reset Link
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative w-full max-w-md"
      >
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <img src="https://i.ibb.co/R4TBHtVV/erasebg-transformed.png" alt="Premium Access Zone" className="h-24 w-auto" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Reset Password</h1>
            <p className="text-gray-300">
              {resetComplete 
                ? "Your password has been reset successfully" 
                : "Create a new password for your account"}
            </p>
          </div>

          {resetComplete ? (
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-400" />
                </div>
              </div>
              
              <p className="text-gray-300 mb-6">
                Your password has been reset successfully. You can now log in with your new password.
              </p>
              
              <motion.button
                onClick={handleGoToLogin}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-xl shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 flex items-center justify-center gap-2"
              >
                Go to Login
                <ArrowRight className="h-5 w-5" />
              </motion.button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full pl-12 pr-12 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300"
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    className="w-full pl-12 pr-12 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300"
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-xl shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <RefreshCw className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    Reset Password
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </motion.button>
            </form>
          )}

          {/* Back to Login */}
          {!resetComplete && (
            <div className="mt-8 text-center">
              <Link to="/login" className="text-gray-400 hover:text-gray-300 text-sm flex items-center justify-center gap-1">
                <ArrowLeft className="h-4 w-4" />
                Back to Login
              </Link>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default ResetPasswordPage