import React, { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'

interface Prize {
  id: string
  label: string
  points: number
  color: string
  probability: number
  icon: string
}

interface SpinWheelProps {
  prizes: Prize[]
  isSpinning: boolean
  rotation: number
  onSpinComplete?: (prizeIndex: number) => void
}

const SpinWheel: React.FC<SpinWheelProps> = ({
  prizes,
  isSpinning,
  rotation,
  onSpinComplete
}) => {
  const wheelRef = useRef<HTMLDivElement>(null)
  const segmentAngle = 360 / prizes.length

  useEffect(() => {
    if (!isSpinning && onSpinComplete) {
      // Calculate which prize was selected based on final rotation
      const normalizedRotation = ((rotation % 360) + 360) % 360
      const prizeIndex = Math.floor((360 - normalizedRotation + segmentAngle / 2) / segmentAngle) % prizes.length
      onSpinComplete(prizeIndex)
    }
  }, [isSpinning, rotation, prizes.length, segmentAngle, onSpinComplete])

  return (
    <div className="relative w-full h-full">
      {/* Outer Ring */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 p-2">
        {/* Inner Wheel */}
        <motion.div
          ref={wheelRef}
          className="relative w-full h-full rounded-full overflow-hidden shadow-2xl"
          animate={{ rotate: rotation }}
          transition={{
            duration: isSpinning ? 4 : 0,
            ease: isSpinning ? [0.23, 1, 0.32, 1] : 'linear'
          }}
        >
          {/* Prize Segments */}
          {prizes.map((prize, index) => {
            const angle = index * segmentAngle
            const nextAngle = (index + 1) * segmentAngle
            
            return (
              <div
                key={prize.id}
                className="absolute inset-0"
                style={{
                  clipPath: `polygon(50% 50%, ${50 + 45 * Math.cos((angle - 90) * Math.PI / 180)}% ${50 + 45 * Math.sin((angle - 90) * Math.PI / 180)}%, ${50 + 45 * Math.cos((nextAngle - 90) * Math.PI / 180)}% ${50 + 45 * Math.sin((nextAngle - 90) * Math.PI / 180)}%)`
                }}
              >
                <div className={`w-full h-full bg-gradient-to-br ${prize.color} relative`}>
                  {/* Prize Content */}
                  <div 
                    className="absolute inset-0 flex flex-col items-center justify-center text-white font-bold text-center"
                    style={{
                      transform: `rotate(${angle + segmentAngle / 2}deg)`,
                      transformOrigin: '50% 50%'
                    }}
                  >
                    <div className="transform -translate-y-8">
                      <div className="text-2xl mb-1">{prize.icon}</div>
                      <div className="text-xs whitespace-nowrap">{prize.label}</div>
                    </div>
                  </div>
                  
                  {/* Segment Border */}
                  <div 
                    className="absolute inset-0 border-r border-white/30"
                    style={{
                      transform: `rotate(${segmentAngle}deg)`,
                      transformOrigin: '50% 50%'
                    }}
                  />
                </div>
              </div>
            )
          })}

          {/* Center Hub */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 bg-white rounded-full shadow-lg flex items-center justify-center border-4 border-yellow-400">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">★</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Pointer */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-3 z-10">
        <div className="relative">
          <div className="w-0 h-0 border-l-6 border-r-6 border-b-12 border-l-transparent border-r-transparent border-b-white shadow-lg" />
          <div className="absolute top-3 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-white rounded-full shadow-lg" />
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Sparkles around the wheel */}
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-pulse"
            style={{
              top: `${20 + Math.sin(i * Math.PI / 4) * 30}%`,
              left: `${50 + Math.cos(i * Math.PI / 4) * 40}%`,
              animationDelay: `${i * 0.2}s`
            }}
          />
        ))}
      </div>
    </div>
  )
}

export default SpinWheel