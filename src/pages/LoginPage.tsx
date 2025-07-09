import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, ArrowRight, LogIn, RefreshCw, AlertCircle, Check } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

const LoginPage: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showEmailNotConfirmed, setShowEmailNotConfirmed] = useState(false)
  const [showInvalidCredentials, setShowInvalidCredentials] = useState(false)
  const [resendingConfirmation, setResendingConfirmation] = useState(false)
  
  const { signIn, resendConfirmation } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setShowEmailNotConfirmed(false)
    setShowInvalidCredentials(false)
    
    try {
      await signIn(formData.email, formData.password, formData.rememberMe)
      navigate('/dashboard')
    } catch (error: any) {
      console.error('Login error:', error)
      
      // Check if the error is specifically about email not being confirmed
      if (error.message && error.message.toLowerCase().includes('email not confirmed')) {
        setShowEmailNotConfirmed(true)
        toast.error('Please confirm your email address before signing in. Check your inbox and spam folder for the confirmation link.')
      } 
      // Check for invalid credentials
      else if (error.message && (
        error.message.toLowerCase().includes('invalid login credentials') ||
        error.message.toLowerCase().includes('invalid credentials')
      )) {
        setShowInvalidCredentials(true)
        toast.error('Invalid email or password. Please check your credentials and try again.')
      }
      // Handle other authentication errors
      else {
        toast.error(error.message || 'An error occurred during sign in. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleResendConfirmation = async () => {
    if (!formData.email) {
      toast.error('Please enter your email address first')
      return
    }

    setResendingConfirmation(true)
    try {
      await resendConfirmation(formData.email)
    } catch (error) {
      console.error('Resend confirmation error:', error)
    } finally {
      setResendingConfirmation(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
    // Clear error states when user starts typing
    if (showEmailNotConfirmed || showInvalidCredentials) {
      setShowEmailNotConfirmed(false)
      setShowInvalidCredentials(false)
    }
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
            <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
            <p className="text-gray-300">Sign in to continue earning points</p>
          </div>

          {/* Email Not Confirmed Alert */}
          {showEmailNotConfirmed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-6 p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-xl"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-300 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-yellow-200 text-sm mb-3">
                    Your email address hasn't been confirmed yet. Please check your inbox and spam folder for the confirmation link.
                  </div>
                  <button
                    onClick={handleResendConfirmation}
                    disabled={resendingConfirmation || !formData.email}
                    className="flex items-center gap-2 text-yellow-300 hover:text-yellow-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {resendingConfirmation ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-300" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    Resend confirmation email
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Invalid Credentials Alert */}
          {showInvalidCredentials && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-300 mt-0.5 flex-shrink-0" />
                <div className="text-red-200 text-sm">
                  <div className="font-medium mb-2">Invalid login credentials</div>
                  <div className="space-y-1 text-xs">
                    <div>• Double-check your email address and password for typos</div>
                    <div>• Make sure Caps Lock is not enabled</div>
                    <div>• Ensure you have registered an account with this email</div>
                    <div>• If you forgot your password, you may need to reset it</div>
                  </div>
                  <div className="mt-3">
                    <Link 
                      to="/register" 
                      className="text-red-300 hover:text-red-200 font-medium text-sm underline"
                    >
                      Don't have an account? Register here
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Password
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
                  placeholder="Enter your password"
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

            {/* Remember Me */}
            <div className="flex items-center justify-between mt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <div 
                  className={`w-5 h-5 flex items-center justify-center rounded border transition-colors ${
                    formData.rememberMe 
                      ? 'bg-blue-500 border-blue-500' 
                      : 'bg-white/10 border-white/30'
                  }`}
                  onClick={() => setFormData(prev => ({ ...prev, rememberMe: !prev.rememberMe }))}
                >
                  {formData.rememberMe && <Check className="h-3 w-3 text-white" />}
                </div>
                <span className="text-sm text-gray-300">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-sm text-blue-400 hover:text-blue-300">
                Forgot password?
              </Link>
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
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </motion.button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-gray-300">
              Don't have an account?{' '}
              <Link to="/register" className="text-blue-400 hover:text-blue-300 font-medium">
                Create one
              </Link>
            </p>
          </div>

          {/* Back to Home */}
          <div className="mt-4 text-center">
            <Link to="/" className="text-gray-400 hover:text-gray-300 text-sm">
              ← Back to Home
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default LoginPage