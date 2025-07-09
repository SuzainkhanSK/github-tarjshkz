import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Settings, LogOut, Coins, Trophy } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { Link } from 'react-router-dom'

const ProfileButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const { user, userProfile, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    setIsOpen(false)
  }

  if (!user) return null

  return (
    <div className="relative">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex items-center gap-2 p-2 bg-white/10 hover:bg-white/20 rounded-xl border border-white/20 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
          {userProfile?.profile_image ? (
            <img
              src={userProfile.profile_image}
              alt="Profile"
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <User className="h-4 w-4 text-white" />
          )}
        </div>
        <div className="hidden md:block text-left">
          <p className="text-white text-sm font-medium">
            {userProfile?.full_name || 'User'}
          </p>
          <p className="text-gray-300 text-xs">
            {userProfile?.points || 0} points
          </p>
        </div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="absolute right-0 top-full mt-2 w-64 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl z-50"
            >
              {/* User Info */}
              <div className="p-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                    {userProfile?.profile_image ? (
                      <img
                        src={userProfile.profile_image}
                        alt="Profile"
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-6 w-6 text-white" />
                    )}
                  </div>
                  <div>
                    <p className="text-white font-medium">{userProfile?.full_name || 'User'}</p>
                    <p className="text-gray-300 text-sm">{userProfile?.email}</p>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="p-4 border-b border-white/10">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-yellow-400 mb-1">
                      <Coins className="h-4 w-4" />
                      <span className="font-bold">{userProfile?.points || 0}</span>
                    </div>
                    <p className="text-gray-300 text-sm">Points</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-purple-400 mb-1">
                      <Trophy className="h-4 w-4" />
                      <span className="font-bold">{userProfile?.total_earned || 0}</span>
                    </div>
                    <p className="text-gray-300 text-sm">Total Earned</p>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="p-2">
                <Link
                  to="/profile"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 w-full p-3 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  <span>Profile Settings</span>
                </Link>
                
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-3 w-full p-3 text-gray-300 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ProfileButton