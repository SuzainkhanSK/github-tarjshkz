// Browser cache management utilities
class CacheManager {
  private readonly CACHE_PREFIX = 'paz_'
  private readonly DEFAULT_TTL = 24 * 60 * 60 * 1000 // 24 hours

  // Set item in localStorage with TTL
  set(key: string, data: any, ttl: number = this.DEFAULT_TTL): void {
    try {
      const item = {
        data,
        timestamp: Date.now(),
        ttl
      }
      localStorage.setItem(this.CACHE_PREFIX + key, JSON.stringify(item))
    } catch (error) {
      console.warn('Failed to set cache item:', error)
    }
  }

  // Get item from localStorage
  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(this.CACHE_PREFIX + key)
      if (!item) return null

      const parsed = JSON.parse(item)
      
      // Check if expired
      if (Date.now() - parsed.timestamp > parsed.ttl) {
        this.remove(key)
        return null
      }

      return parsed.data
    } catch (error) {
      console.warn('Failed to get cache item:', error)
      return null
    }
  }

  // Remove item from localStorage
  remove(key: string): void {
    try {
      localStorage.removeItem(this.CACHE_PREFIX + key)
    } catch (error) {
      console.warn('Failed to remove cache item:', error)
    }
  }

  // Clear all cache items
  clear(): void {
    try {
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.startsWith(this.CACHE_PREFIX)) {
          localStorage.removeItem(key)
        }
      })
    } catch (error) {
      console.warn('Failed to clear cache:', error)
    }
  }

  // Get cache size
  getSize(): number {
    try {
      let size = 0
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.startsWith(this.CACHE_PREFIX)) {
          size += localStorage.getItem(key)?.length || 0
        }
      })
      return size
    } catch (error) {
      console.warn('Failed to calculate cache size:', error)
      return 0
    }
  }

  // Clean expired items
  cleanExpired(): void {
    try {
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.startsWith(this.CACHE_PREFIX)) {
          const item = localStorage.getItem(key)
          if (item) {
            try {
              const parsed = JSON.parse(item)
              if (Date.now() - parsed.timestamp > parsed.ttl) {
                localStorage.removeItem(key)
              }
            } catch {
              // Invalid JSON, remove it
              localStorage.removeItem(key)
            }
          }
        }
      })
    } catch (error) {
      console.warn('Failed to clean expired cache items:', error)
    }
  }
}

export const cacheManager = new CacheManager()

// Service Worker for advanced caching
export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js')
      console.log('Service Worker registered successfully:', registration)
      
      // Update service worker when new version is available
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available, prompt user to refresh
              if (confirm('A new version is available. Refresh to update?')) {
                window.location.reload()
              }
            }
          })
        }
      })
    } catch (error) {
      console.error('Service Worker registration failed:', error)
    }
  }
}