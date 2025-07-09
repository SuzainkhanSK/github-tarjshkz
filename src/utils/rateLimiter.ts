// Rate limiting utility for profile updates and sensitive operations
class RateLimiter {
  private attempts: Map<string, { count: number; resetTime: number }> = new Map()
  private readonly maxAttempts: number
  private readonly windowMs: number

  constructor(maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000) { // 5 attempts per 15 minutes
    this.maxAttempts = maxAttempts
    this.windowMs = windowMs
  }

  // Check if operation is allowed
  isAllowed(key: string): boolean {
    const now = Date.now()
    const attempt = this.attempts.get(key)

    if (!attempt) {
      this.attempts.set(key, { count: 1, resetTime: now + this.windowMs })
      return true
    }

    if (now > attempt.resetTime) {
      // Reset window
      this.attempts.set(key, { count: 1, resetTime: now + this.windowMs })
      return true
    }

    if (attempt.count >= this.maxAttempts) {
      return false
    }

    attempt.count++
    return true
  }

  // Get remaining attempts
  getRemainingAttempts(key: string): number {
    const attempt = this.attempts.get(key)
    if (!attempt || Date.now() > attempt.resetTime) {
      return this.maxAttempts
    }
    return Math.max(0, this.maxAttempts - attempt.count)
  }

  // Get time until reset
  getTimeUntilReset(key: string): number {
    const attempt = this.attempts.get(key)
    if (!attempt || Date.now() > attempt.resetTime) {
      return 0
    }
    return attempt.resetTime - Date.now()
  }

  // Clear attempts for a key
  clear(key: string): void {
    this.attempts.delete(key)
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now()
    for (const [key, attempt] of this.attempts.entries()) {
      if (now > attempt.resetTime) {
        this.attempts.delete(key)
      }
    }
  }
}

// Create rate limiters for different operations
export const profileUpdateLimiter = new RateLimiter(3, 10 * 60 * 1000) // 3 updates per 10 minutes
export const passwordChangeLimiter = new RateLimiter(3, 30 * 60 * 1000) // 3 changes per 30 minutes
export const imageUploadLimiter = new RateLimiter(5, 15 * 60 * 1000) // 5 uploads per 15 minutes
export const accountDeletionLimiter = new RateLimiter(1, 60 * 60 * 1000) // 1 attempt per hour

// Cleanup expired entries every 5 minutes
setInterval(() => {
  profileUpdateLimiter.cleanup()
  passwordChangeLimiter.cleanup()
  imageUploadLimiter.cleanup()
  accountDeletionLimiter.cleanup()
}, 5 * 60 * 1000)