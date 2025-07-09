import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Menu, 
  X, 
  Home, 
  User, 
  History, 
  Trophy, 
  Gift, 
  Award,
  LogOut,
  Coins,
  Target,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Users,
  Zap
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { Link, useLocation } from 'react-router-dom'
import ProfileButton from './ProfileButton'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(true) // Default to collapsed
  const { user, userProfile, signOut } = useAuth()
  const location = useLocation()

  // Close mobile sidebar when route changes
  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  // Handle escape key to close sidebar
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSidebarOpen(false)
      }
    }

    if (sidebarOpen) {
      document.addEventListener('keydown', handleEscape)
      // Prevent body scroll when sidebar is open on mobile
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [sidebarOpen])

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Tasks', href: '/tasks', icon: Target },
    { name: 'Special Tasks', href: '/special-tasks', icon: Zap },
    { name: 'Games', href: '/games', icon: Trophy },
    { name: 'Leaderboard', href: '/leaderboard', icon: Award },
    { name: 'Rewards', href: '/rewards', icon: Gift },
    { name: 'Transactions', href: '/transactions', icon: History },
    { name: 'Profile', href: '/profile', icon: User },
    { name: 'Support', href: '/support', icon: HelpCircle },
  ]

  const handleSignOut = async () => {
    await signOut()
    setSidebarOpen(false)
  }

  const toggleDesktopSidebar = () => {
    setIsDesktopSidebarCollapsed(!isDesktopSidebarCollapsed)
  }

  if (!user) {
    return <div>{children}</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 overflow-x-hidden">
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] lg:hidden"
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
            <motion.div
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              className="absolute left-0 top-0 h-full w-[80vw] max-w-[280px] bg-gradient-to-b from-indigo-900 to-purple-900 shadow-2xl border-r border-white/10"
            >
              <SidebarContent 
                navigation={navigation}
                userProfile={userProfile}
                onSignOut={handleSignOut}
                onClose={() => setSidebarOpen(false)}
                currentPath={location.pathname}
                isCollapsed={false}
                isMobile={true}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop sidebar - hidden on mobile */}
      <div className="hidden lg:block">
        <motion.div 
          className="fixed inset-y-0 flex flex-col z-40"
          animate={{ width: isDesktopSidebarCollapsed ? 80 : 280 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          style={{ willChange: 'width' }}
        >
          <div className="flex-1 bg-gradient-to-b from-indigo-900 to-purple-900 border-r border-white/10 shadow-xl">
            <SidebarContent 
              navigation={navigation}
              userProfile={userProfile}
              onSignOut={handleSignOut}
              currentPath={location.pathname}
              isCollapsed={isDesktopSidebarCollapsed}
              onToggleCollapse={toggleDesktopSidebar}
              isMobile={false}
            />
          </div>
        </motion.div>
      </div>

      {/* Main content */}
      <motion.div 
        className="w-full lg:transition-all lg:duration-300 lg:ease-in-out"
        animate={{ marginLeft: isDesktopSidebarCollapsed ? 80 : 280 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        style={{ willChange: 'margin-left' }}
      >
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 items-center gap-x-4 border-b border-white/10 bg-black/20 backdrop-blur-sm px-4 sm:gap-x-6 sm:px-6 lg:px-8">
          {/* Mobile menu button */}
          <motion.button
            type="button"
            className="-m-2.5 p-2.5 text-white lg:hidden hover:bg-white/10 rounded-lg transition-colors duration-200"
            onClick={() => setSidebarOpen(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Menu className="h-6 w-6" />
          </motion.button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1 items-center">
              <div className="flex items-center gap-2">
                <motion.img 
                  src="https://i.ibb.co/R4TBHtVV/erasebg-transformed.png" 
                  alt="Premium Access Zone" 
                  className="h-12 w-auto"
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  transition={{ duration: 0.2 }}
                />
                <h1 className="text-xl font-bold text-white hidden sm:block">Premium Access Zone</h1>
              </div>
            </div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              {/* Points Display */}
              <motion.div 
                className="flex items-center gap-2 text-white bg-white/10 px-3 py-1.5 rounded-full border border-white/20"
                whileHover={{ scale: 1.02 }}
              >
                <Coins className="h-5 w-5 text-yellow-400" />
                <span className="font-semibold">{userProfile?.points || 0} Points</span>
              </motion.div>
              
              {/* Profile Button */}
              <ProfileButton />
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8 overflow-x-hidden w-full">
          {children}
        </main>
      </motion.div>
    </div>
  )
}

interface SidebarContentProps {
  navigation: Array<{ name: string; href: string; icon: any }>
  userProfile: any
  onSignOut: () => void
  onClose?: () => void
  currentPath: string
  isCollapsed: boolean
  onToggleCollapse?: () => void
  isMobile: boolean
}

const SidebarContent: React.FC<SidebarContentProps> = ({
  navigation,
  userProfile,
  onSignOut,
  onClose,
  currentPath,
  isCollapsed,
  onToggleCollapse,
  isMobile
}) => {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-6">
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.div 
              className="flex items-center gap-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <motion.img 
                src="https://i.ibb.co/R4TBHtVV/erasebg-transformed.png" 
                alt="PAZ" 
                className="h-12 w-auto"
                whileHover={{ scale: 1.1, rotate: 5 }}
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ 
                  hover: { duration: 0.2 },
                  rotate: { duration: 10, repeat: Infinity, repeatType: "loop" }
                }}
              />
              <h1 className="text-lg font-bold text-white">
                {isMobile ? 'Premium Access Zone' : 'PAZ'}
              </h1>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="flex items-center gap-2">
          {/* Desktop collapse toggle */}
          {!isMobile && onToggleCollapse && (
            <motion.button
              onClick={onToggleCollapse}
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isCollapsed ? (
                <ChevronRight className="h-5 w-5" />
              ) : (
                <ChevronLeft className="h-5 w-5" />
              )}
            </motion.button>
          )}
          
          {/* Mobile close button */}
          {isMobile && onClose && (
            <motion.button
              onClick={onClose}
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <X className="h-6 w-6" />
            </motion.button>
          )}
        </div>
      </div>

      {/* User profile section */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mx-6 mb-6 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {userProfile?.profile_image ? (
                  <img
                    src={userProfile.profile_image}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="h-5 w-5 text-white" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-white font-medium truncate">
                  {userProfile?.full_name || 'User'}
                </p>
                <p className="text-gray-300 text-sm">
                  {userProfile?.points || 0} Points
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsed user avatar */}
      {isCollapsed && !isMobile && (
        <div className="mx-4 mb-6 flex justify-center">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center overflow-hidden">
            {userProfile?.profile_image ? (
              <img
                src={userProfile.profile_image}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="h-5 w-5 text-white" />
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-4">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const isActive = currentPath === item.href || (item.href !== '/dashboard' && currentPath.startsWith(item.href))
            return (
              <li key={item.name}>
                <Link
                  to={item.href}
                  onClick={onClose}
                  className={`group flex items-center gap-x-3 rounded-xl p-3 text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-white/20 text-white shadow-lg'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <item.icon className={`h-6 w-6 flex-shrink-0 ${
                      isActive ? 'text-yellow-400' : ''
                    }`} />
                  </motion.div>
                  
                  <AnimatePresence>
                    {!isCollapsed && (
                      <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                        className="truncate"
                      >
                        {item.name}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  
                  {/* Active indicator */}
                  {isActive && (
                    <motion.div
                      className="ml-auto w-2 h-2 bg-yellow-400 rounded-full"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Sign out button */}
      <div className="mt-auto p-4">
        <motion.button
          onClick={onSignOut}
          className={`group flex w-full items-center gap-x-3 rounded-xl p-3 text-sm font-semibold text-gray-300 hover:bg-red-500/20 hover:text-red-300 transition-all duration-200 ${
            isCollapsed ? 'justify-center' : ''
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <LogOut className="h-6 w-6 flex-shrink-0" />
          <AnimatePresence>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                Sign out
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </div>
  )
}

export default Layout