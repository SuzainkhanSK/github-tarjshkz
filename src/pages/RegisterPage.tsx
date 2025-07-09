import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Lock, User, Phone, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [registrationSuccess, setRegistrationSuccess] = useState(false)
  
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate email domain
    if (!formData.email.endsWith('@gmail.com')) {
      toast.error('Only @gmail.com email addresses are allowed')
      return
    }
    
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
      await signUp(
        formData.email,
        formData.password,
        formData.phone || undefined,
        formData.fullName
      )

      setRegistrationSuccess(true)
      // Don't navigate to dashboard immediately - wait for email confirmation
    } catch (error: any) {
      console.error('Registration error:', error)
      toast.error(error.message || 'Registration failed')
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

  if (registrationSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-yellow-400/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="relative w-full max-w-md"
        >
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl text-center">
            <div className="flex justify-center mb-6">
              <img src="https://i.ibb.co/99y0NdZb/Premium-Access-Zone-LOGO.png" alt="Premium Access Zone" className="h-16 w-auto" />
            </div>
            
            <h1 className="text-3xl font-bold text-white mb-4">Check Your Email!</h1>
            
            <p className="text-gray-300 mb-6 leading-relaxed">
              We've sent a confirmation link to <span className="font-semibold text-yellow-400">{formData.email}</span>. 
              Please check your inbox (and spam folder) and click the link to activate your account.
            </p>

            <div className="bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-xl p-4 mb-6 border border-blue-400/30">
              <p className="text-blue-300 text-sm font-medium">
                💡 After confirming your email, you'll receive 100 welcome points!
              </p>
            </div>

            <motion.button
              onClick={handleGoToLogin}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold rounded-xl shadow-2xl hover:shadow-yellow-500/25 transition-all duration-300 flex items-center justify-center gap-2"
            >
              Go to Login
              <ArrowRight className="h-5 w-5" />
            </motion.button>

            <p className="text-gray-400 text-sm mt-4">
              Didn't receive the email? Check your spam folder or try registering again.
            </p>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-yellow-400/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
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
            <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
            <p className="text-gray-300">Join thousands earning free subscriptions</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all duration-300"
                  placeholder="Enter your full name"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Email Address (@gmail.com only)
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  pattern="[a-zA-Z0-9._%+-]+@gmail\.com$"
                  title="Only @gmail.com email addresses are allowed"
                  className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all duration-300"
                  placeholder="your.email@gmail.com"
                />
              </div>
              <p className="text-yellow-400 text-xs mt-1">
                Only @gmail.com email addresses are allowed for security reasons
              </p>
            </div>

            {/* Phone (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Phone Number <span className="text-gray-400">(Optional)</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all duration-300"
                  placeholder="Enter your phone number"
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
                  className="w-full pl-12 pr-12 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all duration-300"
                  placeholder="Create a password"
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
                  className="w-full pl-12 pr-12 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all duration-300"
                  placeholder="Confirm your password"
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
              className="w-full py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold rounded-xl shadow-2xl hover:shadow-yellow-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              ) : (
                <>
                  Create Account
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </motion.button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-gray-300">
              Already have an account?{' '}
              <Link to="/login" className="text-yellow-400 hover:text-yellow-300 font-medium">
                Sign in
              </Link>
            </p>
          </div>

          {/* Welcome Bonus Info */}
          <div className="mt-6 p-4 bg-gradient-to-r from-green-400/20 to-blue-400/20 rounded-xl border border-green-400/30">
            <p className="text-center text-sm text-green-300 font-medium">
              🎉 Get 100 welcome points when you confirm your email!
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default RegisterPage