import toast from 'react-hot-toast'
import { performanceMonitor } from './performance'

export interface ErrorInfo {
  message: string
  stack?: string
  timestamp: number
  userId?: string
  page: string
  userAgent: string
}

class ErrorHandler {
  private errors: ErrorInfo[] = []
  private maxErrors = 100

  constructor() {
    this.setupGlobalErrorHandling()
  }

  private setupGlobalErrorHandling() {
    // Handle JavaScript errors
    window.addEventListener('error', (event) => {
      this.logError({
        message: event.message,
        stack: event.error?.stack,
        timestamp: Date.now(),
        page: window.location.pathname,
        userAgent: navigator.userAgent
      })
    })

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.logError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        timestamp: Date.now(),
        page: window.location.pathname,
        userAgent: navigator.userAgent
      })
    })
  }

  public logError(errorInfo: ErrorInfo) {
    // Add to local storage
    this.errors.push(errorInfo)
    
    // Keep only the most recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors)
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error logged:', errorInfo)
    }

    // Send to monitoring service in production
    this.sendErrorToService(errorInfo)
  }

  private async sendErrorToService(errorInfo: ErrorInfo) {
    try {
      // In production, send to error monitoring service
      // For now, just log critical errors
      if (this.isCriticalError(errorInfo)) {
        console.error('Critical error detected:', errorInfo)
      }
    } catch (error) {
      console.error('Failed to send error to monitoring service:', error)
    }
  }

  private isCriticalError(errorInfo: ErrorInfo): boolean {
    const criticalKeywords = [
      'database',
      'authentication',
      'payment',
      'security',
      'timeout',
      'network'
    ]
    
    return criticalKeywords.some(keyword => 
      errorInfo.message.toLowerCase().includes(keyword)
    )
  }

  public getErrors(): ErrorInfo[] {
    return this.errors
  }

  public clearErrors() {
    this.errors = []
  }

  // Database-specific error handling
  public handleDatabaseError(error: any, operation: string): never {
    let userMessage = 'Something went wrong. Please try again.'
    
    if (error.message?.includes('timeout')) {
      userMessage = 'The request is taking longer than expected. Please check your connection and try again.'
    } else if (error.message?.includes('network')) {
      userMessage = 'Network error. Please check your internet connection.'
    } else if (error.message?.includes('unauthorized')) {
      userMessage = 'You are not authorized to perform this action.'
    } else if (error.message?.includes('not found')) {
      userMessage = 'The requested data was not found.'
    }

    this.logError({
      message: `Database ${operation} failed: ${error.message}`,
      stack: error.stack,
      timestamp: Date.now(),
      page: window.location.pathname,
      userAgent: navigator.userAgent
    })

    toast.error(userMessage)
    throw error
  }

  // Authentication-specific error handling
  public handleAuthError(error: any): never {
    let userMessage = 'Authentication failed. Please try again.'
    
    if (error.message?.includes('email not confirmed')) {
      userMessage = 'Please confirm your email address before signing in.'
    } else if (error.message?.includes('invalid credentials')) {
      userMessage = 'Invalid email or password. Please check your credentials.'
    } else if (error.message?.includes('too many requests')) {
      userMessage = 'Too many login attempts. Please wait a moment and try again.'
    }

    this.logError({
      message: `Authentication failed: ${error.message}`,
      stack: error.stack,
      timestamp: Date.now(),
      page: window.location.pathname,
      userAgent: navigator.userAgent
    })

    toast.error(userMessage)
    throw error
  }
}

export const errorHandler = new ErrorHandler()