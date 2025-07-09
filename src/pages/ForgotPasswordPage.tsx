import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, ArrowLeft, Send, CheckCircle, RefreshCw } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import toast from 'react-hot-toast'

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      toast.error('Please enter your email address')
      return
    }

    setLoading(true)
    try {
      if (!isSupabaseConfigured) {
        throw new Error('Database not configured. Please connect to Supabase first.')
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) throw error
      
      setResetSent(true)
      toast.success('Password reset link sent! Check your email inbox.')
    } catch (error: any) {
      console.error('Password reset error:', error)
      toast.error(error.message || 'Failed to send reset link. Please try again.')
    } finally {
      setLoading(false)
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
            <h1 className="text-3xl font-bold text-white mb-2">Reset Password</h1>
            <p className="text-gray-300">
              {resetSent 
                ? "Check your email for a reset link" 
                : "Enter your email to receive a password reset link"}
            </p>
          </div>

          {resetSent ? (
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-400" />
                </div>
              </div>
              
              <p className="text-gray-300 mb-6">
                We've sent a password reset link to <span className="text-white font-medium">{email}</span>. 
                Please check your inbox and spam folder.
              </p>
              
              <p className="text-gray-400 text-sm mb-6">
                The link will expire in 24 hours. If you don't see the email, you can request another one.
              </p>
              
              <div className="flex gap-3">
                <Link 
                  to="/login" 
                  className="flex-1 py-3 bg-white/20 hover:bg-white/30 text-white rounded-xl font-medium transition-colors"
                >
                  Back to Login
                </Link>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <RefreshCw className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Send className="h-5 w-5" />
                      Resend Email
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300"
                    placeholder="Enter your email"
                  />
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
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                ) : (
                  <>
                    Send Reset Link
                    <Send className="h-5 w-5" />
                  </>
                )}
              </motion.button>
            </form>
          )}

          {/* Back to Login */}
          {!resetSent && (
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

export default ForgotPasswordPage