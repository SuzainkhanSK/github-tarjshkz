import React, { useState, useRef, useEffect } from 'react'
import { optimizeImage } from '../utils/performance'

interface LazyImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  quality?: number
  placeholder?: string
}

const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  width,
  height,
  className = '',
  quality = 80,
  placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PC9zdmc+'
}) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const [error, setError] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    const currentImg = imgRef.current
    if (!currentImg) return

    // Set up intersection observer for lazy loading
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true)
            observerRef.current?.unobserve(entry.target)
          }
        })
      },
      {
        threshold: 0.1,
        rootMargin: '50px'
      }
    )

    observerRef.current.observe(currentImg)

    return () => {
      observerRef.current?.disconnect()
    }
  }, [])

  const handleLoad = () => {
    setIsLoaded(true)
  }

  const handleError = () => {
    setError(true)
    setIsLoaded(true)
  }

  const optimizedSrc = optimizeImage(src, width, height, quality)

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <img
        ref={imgRef}
        src={isInView ? optimizedSrc : placeholder}
        alt={alt}
        width={width}
        height={height}
        onLoad={handleLoad}
        onError={handleError}
        className={`transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        } ${error ? 'bg-gray-200' : ''}`}
        loading="lazy"
      />
      
      {!isLoaded && !error && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
          <span className="text-gray-500 text-sm">Failed to load image</span>
        </div>
      )}
    </div>
  )
}

export default LazyImage