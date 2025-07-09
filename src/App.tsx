import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { AdminProvider, useAdmin } from './contexts/AdminContext'
import Layout from './components/Layout'
import AdminLayout from './pages/admin/AdminLayout'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import Dashboard from './pages/Dashboard'
import SpinWinPage from './pages/SpinWinPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import ScratchEarnPage from './pages/ScratchEarnPage'
import TriviaQuizPage from './pages/TriviaQuizPage'
import TasksPage from './pages/TasksPage'
import LeaderboardPage from './pages/LeaderboardPage'
import DailyCheckInPage from './pages/DailyCheckInPage'
import TransactionHistoryPage from './pages/TransactionHistoryPage'
import SpecialTasksPage from './pages/SpecialTasksPage'
import RewardsPage from './pages/RewardsPage'
import { ProfilePage } from './pages/ProfilePage'
import DailyAdTasksPage from './pages/DailyAdTasksPage'
import AdminDashboard from './pages/admin/AdminDashboard'
import UserManagement from './pages/admin/UserManagement'
import RedemptionManagement from './pages/admin/RedemptionManagement'
import SubscriptionManagement from './pages/admin/SubscriptionManagement'
import AdminSettings from './pages/admin/AdminSettings'
import DatabaseStatusPage from './pages/admin/DatabaseStatus'
import LoadingSpinner from './components/LoadingSpinner'
import PerformanceMonitor from './components/PerformanceMonitor'
import SupportButton from './components/SupportButton'
import { registerServiceWorker, cacheManager } from './utils/cacheManager'
import { memoryManager } from './utils/performance'
import { Link } from 'react-router-dom'
import CookieConsentBanner from './components/CookieConsentBanner'

// Legal Pages
import PrivacyPolicyPage from './pages/legal/PrivacyPolicyPage'
import TermsConditionsPage from './pages/legal/TermsConditionsPage'
import RefundPolicyPage from './pages/legal/RefundPolicyPage'
import CookiePolicyPage from './pages/legal/CookiePolicyPage'
import DisclaimerPage from './pages/legal/DisclaimerPage'
import SupportPage from './pages/SupportPage'

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth()
  
  if (loading) {
    return <LoadingSpinner fullScreen text="Loading your account..." />
  }
  
  return user ? <>{children}</> : <Navigate to="/login" replace />
}

// Admin Route Component
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading: authLoading } = useAuth()
  const { isAdmin, loading: adminLoading } = useAdmin()
  
  if (authLoading || adminLoading) {
    return <LoadingSpinner fullScreen text="Checking admin access..." />
  }
  
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-gray-300 mb-4">You do not have admin privileges.</p>
          <Link to="/dashboard" className="text-blue-400 hover:text-blue-300">
            Return to Dashboard
          </Link>
        </div>
      </div>
    )
  }
  
  return <>{children}</>
}

// Public Route Component (redirect to dashboard if already logged in)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth()
  
  if (loading) {
    return <LoadingSpinner fullScreen text="Checking authentication..." />
  }
  
  return !user ? <>{children}</> : <Navigate to="/dashboard" replace />
}

export default function App() {
  // Register service worker and setup performance monitoring
  useEffect(() => {
    registerServiceWorker()
    
    // Clean expired cache items on app start
    cacheManager.cleanExpired()
    
    // Setup periodic cleanup
    const cleanupInterval = setInterval(() => {
      cacheManager.cleanExpired()
      memoryManager.cleanup()
    }, 30 * 60 * 1000) // Every 30 minutes
    
    return () => clearInterval(cleanupInterval)
  }, [])

  return (
    <AuthProvider>
      <AdminProvider>
        <Router>
          <div className="App overflow-x-hidden">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route 
                path="/login" 
                element={
                  <PublicRoute>
                    <LoginPage />
                  </PublicRoute>
                } 
              />
              <Route 
                path="/register" 
                element={
                  <PublicRoute>
                    <RegisterPage />
                  </PublicRoute>
                } 
              />
              <Route 
                path="/forgot-password" 
                element={
                  <PublicRoute>
                    <ForgotPasswordPage />
                  </PublicRoute>
                } 
              />
              <Route 
                path="/reset-password" 
                element={
                  <PublicRoute>
                    <ResetPasswordPage />
                  </PublicRoute>
                } 
              />
              
              {/* Legal Pages */}
              <Route path="/legal/privacy-policy" element={<PrivacyPolicyPage />} />
              <Route path="/legal/terms-conditions" element={<TermsConditionsPage />} />
              <Route path="/legal/refund-policy" element={<RefundPolicyPage />} />
              <Route path="/legal/cookie-policy" element={<CookiePolicyPage />} />
              <Route path="/legal/disclaimer" element={<DisclaimerPage />} />
              
              {/* Support Page */}
              <Route path="/support" element={<SupportPage />} />
              
              {/* Protected User Routes */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Dashboard />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <ProfilePage />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/tasks" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <TasksPage />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/special-tasks" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <SpecialTasksPage />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/special-tasks/specialtask1" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <DailyAdTasksPage />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/special-tasks/daily-check-in" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <DailyCheckInPage />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/games" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <div className="space-y-8">
                        <div className="text-center">
                          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">Games</h1>
                          <p className="text-gray-300 text-lg">Choose your favorite game to earn points!</p>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                          {/* Spin & Win Card */}
                          <div className="bg-gradient-to-br from-yellow-400/20 to-orange-500/20 backdrop-blur-sm rounded-2xl p-6 border border-yellow-400/30 hover:border-yellow-400/50 transition-all duration-300">
                            <div className="text-center">
                              <div className="text-5xl sm:text-6xl mb-4">🎰</div>
                              <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">Spin & Win</h2>
                              <p className="text-gray-300 mb-6">Spin the wheel of fortune and win amazing prizes!</p>
                              <a 
                                href="/games/spin-win"
                                className="inline-block px-6 sm:px-8 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold rounded-xl hover:shadow-lg transition-all duration-300"
                              >
                                Play Now
                              </a>
                            </div>
                          </div>
                          
                          {/* Scratch & Earn Card */}
                          <div className="bg-gradient-to-br from-purple-400/20 to-pink-500/20 backdrop-blur-sm rounded-2xl p-6 border border-purple-400/30 hover:border-purple-400/50 transition-all duration-300">
                            <div className="text-center">
                              <div className="text-5xl sm:text-6xl mb-4">🎫</div>
                              <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">Scratch & Earn</h2>
                              <p className="text-gray-300 mb-6">Scratch the card to reveal hidden prizes and earn points!</p>
                              <a 
                                href="/games/scratch-earn"
                                className="inline-block px-6 sm:px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg transition-all duration-300"
                              >
                                Play Now
                              </a>
                            </div>
                          </div>
                          
                          {/* Trivia Quiz Card */}
                          <div className="bg-gradient-to-br from-blue-400/20 to-cyan-500/20 backdrop-blur-sm rounded-2xl p-6 border border-blue-400/30 hover:border-blue-400/50 transition-all duration-300">
                            <div className="text-center">
                              <div className="text-5xl sm:text-6xl mb-4">🧠</div>
                              <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">Trivia Quiz</h2>
                              <p className="text-gray-300 mb-6">Test your knowledge and earn points with fun trivia questions!</p>
                              <a 
                                href="/games/trivia-quiz"
                                className="inline-block px-6 sm:px-8 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-bold rounded-xl hover:shadow-lg transition-all duration-300"
                              >
                                Play Now
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/games/spin-win" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <SpinWinPage />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/games/scratch-earn" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <ScratchEarnPage />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/games/trivia-quiz" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <TriviaQuizPage />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/rewards" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <RewardsPage />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/transactions" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <TransactionHistoryPage />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/leaderboard" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <LeaderboardPage />
                    </Layout>
                  </ProtectedRoute>
                } 
              />

              {/* Admin Routes */}
              <Route 
                path="/admin" 
                element={
                  <AdminRoute>
                    <AdminLayout />
                  </AdminRoute>
                }
              >
                <Route index element={<AdminDashboard />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="redemptions" element={<RedemptionManagement />} />
                <Route path="subscriptions" element={<SubscriptionManagement />} />
                <Route path="analytics" element={<div className="p-8 text-white">Analytics coming soon...</div>} />
                <Route path="support" element={<div className="p-8 text-white">Support center coming soon...</div>} />
                <Route path="security" element={<div className="p-8 text-white">Security dashboard coming soon...</div>} />
                <Route path="database" element={<DatabaseStatusPage />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>
              
              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            
            <Toaster 
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'rgba(0, 0, 0, 0.8)',
                  color: '#fff',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)',
                },
              }}
            />
          </div>
        </Router>
      </AdminProvider>
    </AuthProvider>
  )
}