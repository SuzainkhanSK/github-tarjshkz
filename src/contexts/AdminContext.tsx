import React, { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { useAuth } from './AuthContext'
import toast from 'react-hot-toast'

interface AdminUser {
  id: string
  email: string
  role: 'super_admin' | 'moderator' | 'support'
  permissions: string[]
  last_login: string
  is_active: boolean
}

interface AdminContextType {
  isAdmin: boolean
  adminUser: AdminUser | null
  loading: boolean
  checkAdminAccess: () => Promise<boolean>
  hasPermission: (permission: string) => boolean
}

const AdminContext = createContext<AdminContextType | undefined>(undefined)

export function useAdmin() {
  const context = useContext(AdminContext)
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider')
  }
  return context
}

// Admin email list - Updated with your email
const ADMIN_EMAILS = [
  'Suzainkhan8360@gmail.com',  // Your admin email
  'admin@premiumaccesszone.com',
  'support@premiumaccesszone.com',
  'moderator@premiumaccesszone.com'
]

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)

  const checkAdminAccess = async (): Promise<boolean> => {
    if (!user || !isSupabaseConfigured) {
      setIsAdmin(false)
      setAdminUser(null)
      setLoading(false)
      return false
    }

    try {
      // Check if user email is in admin list (case-insensitive)
      const isAdminEmail = ADMIN_EMAILS.some(email => 
        email.toLowerCase() === (user.email || '').toLowerCase()
      )
      
      if (isAdminEmail) {
        // Determine role based on email
        let role: 'super_admin' | 'moderator' | 'support' = 'super_admin'
        
        if (user.email?.toLowerCase().includes('moderator')) {
          role = 'moderator'
        } else if (user.email?.toLowerCase().includes('support')) {
          role = 'support'
        } else {
          // Suzainkhan8360@gmail.com and admin emails get super_admin
          role = 'super_admin'
        }

        // Create admin user object
        const adminUserData: AdminUser = {
          id: user.id,
          email: user.email || '',
          role: role,
          permissions: getPermissionsByRole(role),
          last_login: new Date().toISOString(),
          is_active: true
        }

        setIsAdmin(true)
        setAdminUser(adminUserData)
        setLoading(false)
        return true
      } else {
        setIsAdmin(false)
        setAdminUser(null)
        setLoading(false)
        return false
      }
    } catch (error) {
      console.error('Admin access check failed:', error)
      setIsAdmin(false)
      setAdminUser(null)
      setLoading(false)
      return false
    }
  }

  const hasPermission = (permission: string): boolean => {
    if (!adminUser) return false
    return adminUser.permissions.includes(permission) || adminUser.permissions.includes('*')
  }

  useEffect(() => {
    checkAdminAccess()
  }, [user])

  const value = {
    isAdmin,
    adminUser,
    loading,
    checkAdminAccess,
    hasPermission
  }

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
}

function getPermissionsByRole(role: 'super_admin' | 'moderator' | 'support'): string[] {
  switch (role) {
    case 'super_admin':
      return ['*'] // All permissions
    case 'moderator':
      return [
        'users.read',
        'users.update',
        'users.ban',
        'transactions.read',
        'redemptions.read',
        'redemptions.update',
        'analytics.read',
        'support.read',
        'support.update'
      ]
    case 'support':
      return [
        'users.read',
        'transactions.read',
        'redemptions.read',
        'support.read',
        'support.update'
      ]
    default:
      return []
  }
}