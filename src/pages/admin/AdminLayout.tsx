import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Menu, 
  X, 
  Home, 
  Users, 
  Gift, 
  BarChart3, 
  Settings, 
  Shield, 
  Mail, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  Bell,
  Search,
  Database,
  Package
} from 'lucide-react'
import { useAdmin } from '../../contexts/AdminContext'
import { useAuth } from '../../contexts/AuthContext'
import { Link, useLocation, Outlet } from 'react-router-dom'

const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { adminUser, hasPermission } = useAdmin()
  const { signOut } = useAuth()
  const location = useLocation()

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: Home, permission: '*' },
    { name: 'User Management', href: '/admin/users', icon: Users, permission: 'users.read' },
    { name: 'Redemptions', href: '/admin/redemptions', icon: Gift, permission: 'redemptions.read' },
    { name: 'Subscriptions', href: '/admin/subscriptions', icon: Package, permission: 'system.manage' },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3, permission: 'analytics.read' },
    { name: 'Support', href: '/admin/support', icon: Mail, permission: 'support.read' },
    { name: 'Security', href: '/admin/security', icon: Shield, permission: 'security.read' },
    { name: 'Database Status', href: '/admin/database', icon: Database, permission: '*' },
    { name: 'Settings', href: '/admin/settings', icon: Settings, permission: 'system.manage' },
  ]

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900">
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 lg:hidden"
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
            <motion.div
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              className="absolute left-0 top-0 h-full w-80 bg-gray-900/95 backdrop-blur-xl shadow-2xl border-r border-white/10"
            >
              <SidebarContent 
                navigation={navigation}
                adminUser={adminUser}
                onSignOut={handleSignOut}
                onClose={() => setSidebarOpen(false)}
                currentPath={location.pathname}
                isCollapsed={false}
                hasPermission={hasPermission}
                isMobile={true}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <motion.div 
        className="hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col lg:z-40"
        animate={{ width: sidebarCollapsed ? 80 : 320 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        <div className="flex-1 bg-gray-900/95 backdrop-blur-xl border-r border-white/10 shadow-xl">
          <SidebarContent 
            navigation={navigation}
            adminUser={adminUser}
            onSignOut={handleSignOut}
            currentPath={location.pathname}
            isCollapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            hasPermission={hasPermission}
            isMobile={false}
          />
        </div>
      </motion.div>

      {/* Main content */}
      <motion.div 
        className="lg:transition-all lg:duration-300 lg:ease-in-out"
        animate={{ marginLeft: sidebarCollapsed ? 80 : 320 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        {/* Top bar */}
        <div className="sticky top-0 z-30 flex h-16 items-center gap-x-4 border-b border-white/10 bg-black/20 backdrop-blur-sm px-4 sm:gap-x-6 sm:px-6 lg:px-8">
          {/* Mobile menu button */}
          <button
            type="button"
            className="-m-2.5 p-2.5 text-white lg:hidden hover:bg-white/10 rounded-lg transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1 items-center">
              <div className="flex items-center gap-2">
                <img src="https://i.ibb.co/R4TBHtVV/erasebg-transformed.png" alt="Premium Access Zone" className="h-12 w-auto" />
                <h1 className="text-xl font-bold text-white">Admin Panel</h1>
              </div>
            </div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              {/* Notifications */}
              <button className="relative p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                <Bell className="h-6 w-6" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              
              {/* Admin Profile */}
              <div className="flex items-center gap-3 text-white">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold">
                    {adminUser?.email.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium">{adminUser?.email}</p>
                  <p className="text-xs text-gray-400 capitalize">{adminUser?.role.replace('_', ' ')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main>
          <Outlet />
        </main>
      </motion.div>
    </div>
  )
}

interface SidebarContentProps {
  navigation: Array<{ name: string; href: string; icon: any; permission: string }>
  adminUser: any
  onSignOut: () => void
  onClose?: () => void
  currentPath: string
  isCollapsed: boolean
  onToggleCollapse?: () => void
  hasPermission: (permission: string) => boolean
  isMobile: boolean
}

const SidebarContent: React.FC<SidebarContentProps> = ({
  navigation,
  adminUser,
  onSignOut,
  onClose,
  currentPath,
  isCollapsed,
  onToggleCollapse,
  hasPermission,
  isMobile
}) => {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-6">
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex items-center gap-3"
            >
              <img src="https://i.ibb.co/R4TBHtVV/erasebg-transformed.png" alt="Premium Access Zone" className="h-12 w-auto" />
              <h1 className="text-lg font-bold text-white">Admin Panel</h1>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="flex items-center gap-2">
          {/* Desktop collapse toggle */}
          {!isMobile && onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          )}
          
          {/* Mobile close button */}
          {isMobile && onClose && (
            <button
              onClick={onClose}
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Admin info */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mx-6 mb-6 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">
                  {adminUser?.email.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-white font-medium truncate">{adminUser?.email}</p>
                <p className="text-gray-300 text-sm capitalize">{adminUser?.role.replace('_', ' ')}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <nav className="flex-1 px-4">
        <ul className="space-y-2">
          {navigation.map((item) => {
            if (!hasPermission(item.permission) && item.permission !== '*') return null
            
            const isActive = currentPath === item.href || (item.href !== '/admin' && currentPath.startsWith(item.href))
            
            return (
              <li key={item.name}>
                <Link
                  to={item.href}
                  onClick={onClose}
                  className={`group flex items-center gap-x-3 rounded-xl p-3 text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-500/20 text-white shadow-lg border border-blue-400/30'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <item.icon className={`h-6 w-6 flex-shrink-0 ${
                    isActive ? 'text-blue-400' : ''
                  }`} />
                  
                  <AnimatePresence>
                    {!isCollapsed && (
                      <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="truncate"
                      >
                        {item.name}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  
                  {isActive && (
                    <motion.div
                      className="ml-auto w-2 h-2 bg-blue-400 rounded-full"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                    />
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Sign out button */}
      <div className="p-4">
        <button
          onClick={onSignOut}
          className={`group flex w-full items-center gap-x-3 rounded-xl p-3 text-sm font-semibold text-gray-300 hover:bg-red-500/20 hover:text-red-300 transition-all duration-200 ${
            isCollapsed ? 'justify-center' : ''
          }`}
        >
          <LogOut className="h-6 w-6 flex-shrink-0" />
          <AnimatePresence>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                Sign out
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </div>
  )
}

export default AdminLayout