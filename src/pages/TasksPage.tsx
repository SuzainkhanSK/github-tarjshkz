import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Target, 
  ExternalLink, 
  Video,
  Zap,
  CheckCircle, 
  Clock, 
  Coins, 
  Users, 
  MessageCircle,
  Share2,
  Heart,
  Play,
  Award,
  Gift,
  Star,
  Trophy,
  RefreshCw,
  AlertCircle,
  Copy,
  Check
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import toast from 'react-hot-toast'

interface Task {
  id: string
  title: string
  description: string
  points: number | string
  type: 'telegram' | 'youtube' | 'instagram' | 'twitter' | 'facebook' | 'ads'
  action_url: string
  icon: React.ComponentType<any>
  color: string
  difficulty: 'easy' | 'medium' | 'hard'
  estimated_time: string
}

interface UserTask {
  id: string
  user_id: string
  task_type: string
  task_id: string
  completed: boolean
  points_earned: number
  completed_at?: string
  created_at: string
}

const TasksPage: React.FC = () => {
  const { user, userProfile, refreshProfile } = useAuth()
  const [userTasks, setUserTasks] = useState<UserTask[]>([])
  const [loading, setLoading] = useState(false)
  const [processingTask, setProcessingTask] = useState<string | null>(null)
  const [showCompletedTasks, setShowCompletedTasks] = useState(false)
  const [showTelegramModal, setShowTelegramModal] = useState(false)
  const [telegramUserId, setTelegramUserId] = useState('')
  const [verifyingTelegram, setVerifyingTelegram] = useState(false)
  const [copiedUserId, setCopiedUserId] = useState(false)

  // Available tasks configuration
  const availableTasks: Task[] = [
    {
      id: 'telegram_join',
      title: 'Join Our Telegram Channel',
      description: 'Join our official Telegram channel for updates, tips, and exclusive content!',
      points: 100,
      type: 'telegram',
      action_url: 'https://t.me/SKModTechOfficial',
      icon: MessageCircle,
      color: 'from-blue-400 to-blue-600',
      difficulty: 'easy',
      estimated_time: '2 min'
    },
    {
      id: 'youtube_subscribe',
      title: 'Subscribe to YouTube Channel',
      description: 'Subscribe to our YouTube channel for tutorials and gaming content!',
      points: 150,
      type: 'youtube',
      action_url: '#', // Will be added later
      icon: Play,
      color: 'from-red-400 to-red-600',
      difficulty: 'easy',
      estimated_time: '1 min'
    },
    {
      id: 'instagram_follow',
      title: 'Follow on Instagram',
      description: 'Follow us on Instagram for behind-the-scenes content and updates!',
      points: 120,
      type: 'instagram',
      action_url: '#', // Will be added later
      icon: Heart,
      color: 'from-pink-400 to-purple-600',
      difficulty: 'easy',
      estimated_time: '1 min'
    },
    {
      id: 'twitter_follow',
      title: 'Follow on Twitter/X',
      description: 'Follow us on Twitter for real-time updates and announcements!',
      points: 120,
      type: 'twitter',
      action_url: '#', // Will be added later
      icon: Share2,
      color: 'from-blue-300 to-blue-500',
      difficulty: 'easy',
      estimated_time: '1 min'
    }
  ]

  useEffect(() => {
    if (user?.id) {
      fetchUserTasks()
    }
  }, [user])

  const fetchUserTasks = async () => {
    if (!user?.id || !isSupabaseConfigured) return

    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setUserTasks(data || [])
    } catch (error) {
      console.warn('Failed to fetch user tasks:', error)
    }
  }

  const getUserTaskStatus = (taskId: string) => {
    const userTask = userTasks.find(t => t.task_id === taskId)
    return {
      exists: !!userTask,
      completed: userTask?.completed || false,
      points_earned: userTask?.points_earned || 0
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedUserId(true)
      toast.success('Copied to clipboard!')
      setTimeout(() => setCopiedUserId(false), 2000)
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    }
  }

  const openTelegramChannel = () => {
    window.open('https://t.me/SKModTechOfficial', '_blank')
    toast.success('Telegram channel opened! Please join and come back to verify.')
  }

  const verifyTelegramMembership = async (userId: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-telegram-membership`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId })
      })

      if (!response.ok) {
        throw new Error('Failed to verify membership')
      }

      const data = await response.json()
      return data.isMember
    } catch (error) {
      console.error('Telegram verification error:', error)
      return false
    }
  }

  const handleTelegramVerification = async () => {
    if (!telegramUserId.trim()) {
      toast.error('Please enter your Telegram User ID')
      return
    }

    setVerifyingTelegram(true)

    try {
      const isMember = await verifyTelegramMembership(telegramUserId.trim())
      
      if (isMember) {
        const telegramTask = availableTasks.find(t => t.id === 'telegram_join')
        if (telegramTask) {
          await completeTask(telegramTask)
          setShowTelegramModal(false)
          setTelegramUserId('')
        }
      } else {
        toast.error('❌ Could not verify your membership. Please make sure you have joined the channel and entered the correct User ID.')
      }
    } catch (error) {
      console.error('Verification error:', error)
      toast.error('Verification failed. Please try again.')
    } finally {
      setVerifyingTelegram(false)
    }
  }

  const handleTaskAction = async (task: Task) => {
    if (!user?.id) {
      toast.error('Please sign in to complete tasks')
      return
    }

    const taskStatus = getUserTaskStatus(task.id)
    
    if (taskStatus.completed) {
      toast.info('You have already completed this task!')
      return
    }

    if (task.type === 'telegram') {
      // Open Telegram channel first
      window.open(task.action_url, '_blank')
      // Show the verification modal
      setShowTelegramModal(true)
    } else {
      // For other tasks, just open the link and complete
      if (task.action_url !== '#') {
        window.open(task.action_url, '_blank')
      }
      await completeTask(task)
    }
  }

  const completeTask = async (task: Task) => {
    if (!isSupabaseConfigured) {
      // Fallback for when database is not configured
      toast.success(`Task completed! You earned ${task.points} points!`)
      return
    }

    try {
      // Mark task as completed
      const { error: taskError } = await supabase
        .from('tasks')
        .upsert({
          user_id: user!.id,
          task_type: task.type,
          task_id: task.id,
          completed: true,
          points_earned: task.points,
          completed_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,task_type,task_id'
        })

      if (taskError) throw taskError

      // Add transaction
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: user!.id,
          type: 'earn',
          points: task.points,
          description: `Task Completed: ${task.title}`,
          task_type: task.type
        })

      if (transactionError) throw transactionError

      // Update user profile points
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          points: (userProfile?.points || 0) + task.points,
          total_earned: (userProfile?.total_earned || 0) + task.points
        })
        .eq('id', user!.id)

      if (profileError) throw profileError

      // Refresh data
      await Promise.all([
        refreshProfile(),
        fetchUserTasks()
      ])

      toast.success(`🎉 Task completed! You earned ${task.points} points!`)

    } catch (error) {
      console.error('Complete task error:', error)
      toast.error('Failed to complete task. Please try again.')
    }
  }

  const getTaskButtonText = (task: Task) => {
    const taskStatus = getUserTaskStatus(task.id)
    
    if (taskStatus.completed) {
      return 'Completed'
    }
    
    return 'Complete Task'
  }

  const getTaskButtonIcon = (task: Task) => {
    const taskStatus = getUserTaskStatus(task.id)
    
    if (taskStatus.completed) {
      return CheckCircle
    }
    
    return ExternalLink
  }

  const completedTasks = userTasks.filter(t => t.completed)
  const totalPointsEarned = completedTasks.reduce((sum, task) => sum + task.points_earned, 0)

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          <span className="bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
            Social Tasks
          </span>
        </h1>
        <p className="text-xl text-gray-300 mb-6">
          Complete social media tasks to earn points and unlock rewards!
        </p>
        
        {/* Stats */}
        <div className="flex items-center justify-center gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-400" />
              <span className="text-white font-medium">
                {completedTasks.length} Tasks Completed
              </span>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-green-400" />
              <span className="text-white font-medium">
                {totalPointsEarned} Points Earned
              </span>
            </div>
          </div>
          
          <button
            onClick={() => setShowCompletedTasks(!showCompletedTasks)}
            className="bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/20 transition-colors"
          >
            <div className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-blue-400" />
              <span className="text-white font-medium">
                {showCompletedTasks ? 'Hide' : 'Show'} Completed
              </span>
            </div>
          </button>
        </div>
      </motion.div>

      {/* Tasks Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {availableTasks.map((task, index) => {
          const taskStatus = getUserTaskStatus(task.id)
          const ButtonIcon = getTaskButtonIcon(task)
          
          // Hide completed tasks if toggle is off
          if (taskStatus.completed && !showCompletedTasks) {
            return null
          }
          
          return (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative bg-white/10 backdrop-blur-sm rounded-2xl p-6 border transition-all duration-300 ${
                taskStatus.completed 
                  ? 'border-green-400/50 bg-green-400/10' 
                  : 'border-white/20 hover:border-white/40 hover:bg-white/20'
              }`}
            >
              {/* Difficulty Badge */}
              <div className={`absolute top-4 right-4 px-2 py-1 rounded-full text-xs font-medium ${
                task.difficulty === 'easy' ? 'bg-green-500/20 text-green-400' :
                task.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {task.difficulty}
              </div>

              {/* Task Icon */}
              <div className={`w-16 h-16 bg-gradient-to-br ${task.color} rounded-2xl flex items-center justify-center mb-4`}>
                <task.icon className="h-8 w-8 text-white" />
              </div>

              {/* Task Info */}
              <h3 className="text-xl font-bold text-white mb-2">{task.title}</h3>
              <p className="text-gray-300 text-sm mb-4 leading-relaxed">{task.description}</p>

              {/* Task Details */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Coins className="h-4 w-4 text-yellow-400" />
                  <span className="text-yellow-400 font-bold">{task.points} Points</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-400 text-sm">{task.estimated_time}</span>
                </div>
              </div>

              {/* Action Button */}
              <motion.button
                onClick={() => handleTaskAction(task)}
                disabled={taskStatus.completed || processingTask === task.id}
                whileHover={{ scale: taskStatus.completed ? 1 : 1.02 }}
                whileTap={{ scale: taskStatus.completed ? 1 : 0.98 }}
                className={`w-full py-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
                  taskStatus.completed
                    ? 'bg-green-500/20 text-green-400 cursor-not-allowed'
                    : processingTask === task.id
                    ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                    : `bg-gradient-to-r ${task.color} text-white hover:shadow-lg`
                }`}
              >
                {processingTask === task.id ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                ) : (
                  <ButtonIcon className="h-5 w-5" />
                )}
                {processingTask === task.id ? 'Processing...' : getTaskButtonText(task)}
              </motion.button>

              {/* Completion Badge */}
              {taskStatus.completed && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center"
                >
                  <CheckCircle className="h-5 w-5 text-white" />
                </motion.div>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Telegram Verification Modal */}
      <AnimatePresence>
        {showTelegramModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowTelegramModal(false)} />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 max-w-md w-full"
            >
              <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <MessageCircle className="h-6 w-6 text-blue-400" />
                Verify Telegram Membership
              </h3>
              
              <div className="space-y-4 mb-6">
                <div className="bg-blue-400/20 rounded-xl p-4 border border-blue-400/30">
                  <h4 className="text-blue-300 font-semibold mb-2">📱 Step 1: Get Your Telegram User ID</h4>
                  <p className="text-blue-200 text-sm mb-3">
                    Message this bot on Telegram to get your User ID:
                  </p>
                  <div className="flex items-center gap-2 bg-black/30 rounded-lg p-2">
                    <code className="text-yellow-300 flex-1">@userinfobot</code>
                    <button
                      onClick={() => copyToClipboard('@userinfobot')}
                      className="p-1 hover:bg-white/20 rounded transition-colors"
                    >
                      {copiedUserId ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4 text-gray-400" />}
                    </button>
                  </div>
                </div>

                <div className="bg-green-400/20 rounded-xl p-4 border border-green-400/30">
                  <h4 className="text-green-300 font-semibold mb-2">✅ Step 2: Join Our Channel</h4>
                  <p className="text-green-200 text-sm mb-3">
                    Make sure you've joined our Telegram channel. If you haven't joined yet or need to rejoin:
                  </p>
                  <button
                    onClick={openTelegramChannel}
                    className="w-full py-2 px-4 bg-green-500/30 hover:bg-green-500/40 border border-green-400/50 rounded-lg text-green-200 font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Join/Rejoin Channel @SKModTechOfficial
                  </button>
                </div>

                <div className="bg-purple-400/20 rounded-xl p-4 border border-purple-400/30">
                  <h4 className="text-purple-300 font-semibold mb-2">🔢 Step 3: Enter Your User ID</h4>
                  <input
                    type="text"
                    value={telegramUserId}
                    onChange={(e) => setTelegramUserId(e.target.value)}
                    placeholder="Enter your Telegram User ID (numbers only)"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowTelegramModal(false)}
                  className="flex-1 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleTelegramVerification}
                  disabled={verifyingTelegram || !telegramUserId.trim()}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {verifyingTelegram ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Verify & Earn 100 Points
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* How It Works */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20"
      >
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <Target className="h-6 w-6 text-blue-400" />
          How Social Tasks Work
        </h2>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold">1</span>
            </div>
            <h3 className="text-white font-semibold mb-2">Click Complete Task</h3>
            <p className="text-gray-300 text-sm">Click the button to start the task</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold">2</span>
            </div>
            <h3 className="text-white font-semibold mb-2">Follow Instructions</h3>
            <p className="text-gray-300 text-sm">Join/follow as required and verify if needed</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold">3</span>
            </div>
            <h3 className="text-white font-semibold mb-2">Get Points</h3>
            <p className="text-gray-300 text-sm">Points are added to your account instantly</p>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-400/20 rounded-xl border border-blue-400/30">
          <p className="text-blue-300 text-sm">
            <strong>💡 For Telegram tasks:</strong> We use real verification through the Telegram Bot API to check if you actually joined our channel. Just follow the simple steps in the popup!
          </p>
        </div>
      </motion.div>
    </div>
  )
}

export default TasksPage