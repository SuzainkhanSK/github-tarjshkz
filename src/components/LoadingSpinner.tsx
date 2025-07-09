import React from 'react'
import { motion } from 'framer-motion'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  color?: string
  text?: string
  fullScreen?: boolean
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'text-blue-400',
  text,
  fullScreen = false
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }

  const spinner = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`flex flex-col items-center justify-center gap-3 ${
        fullScreen ? 'min-h-screen' : ''
      }`}
    >
      <div className={`${sizeClasses[size]} border-2 border-gray-300 border-t-transparent rounded-full animate-spin ${color}`} />
      {text && (
        <p className={`${textSizeClasses[size]} text-gray-600 animate-pulse`}>
          {text}
        </p>
      )}
    </motion.div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center z-50">
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
          {spinner}
        </div>
      </div>
    )
  }

  return spinner
}

export default LoadingSpinner