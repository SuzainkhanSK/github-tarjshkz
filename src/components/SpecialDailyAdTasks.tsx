import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckCircle, ExternalLink, AlertCircle, Zap, Target, Trophy, Gift, Star, Award, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';

interface AdTask {
  id: string;
  title: string;
  icon: React.ComponentType<any>;
  adUrl: string;
  isCompleted: boolean;
  timeRemaining: number;
  isTimerRunning: boolean;
  canClaim: boolean;
}

const SpecialDailyAdTasks: React.FC = () => {
  const { user, userProfile, refreshProfile } = useAuth();
  const [adTasks, setAdTasks] = useState<AdTask[]>([
    {
      id: 'task1',
      title: 'Click & Conquer',
      icon: Target,
      adUrl: 'https://www.profitableratecpm.com/rxhwngnx1?key=3a23d1784c5121dedf8afff80f7f427a',
      isCompleted: false,
      timeRemaining: 30,
      isTimerRunning: false,
      canClaim: false
    },
    {
      id: 'task2',
      title: 'Ad-Mazing Mission',
      icon: Trophy,
      adUrl: 'https://www.profitableratecpm.com/yn8kxcezr?key=0c500fb40256ea83b1e2dcb4aee5488b',
      isCompleted: false,
      timeRemaining: 30,
      isTimerRunning: false,
      canClaim: false
    },
    {
      id: 'task3',
      title: 'Boost & Earn',
      icon: Zap,
      adUrl: 'https://www.profitableratecpm.com/vm81vr9s?key=0b095ef518a1595028a8faafddd5acdd',
      isCompleted: false,
      timeRemaining: 30,
      isTimerRunning: false,
      canClaim: false
    },
    {
      id: 'task4',
      title: 'Explore & Reward',
      icon: Gift,
      adUrl: 'https://www.profitableratecpm.com/xg8r7xcd?key=411569737479692441f89d0b774573e5',
      isCompleted: false,
      timeRemaining: 30,
      isTimerRunning: false,
      canClaim: false
    },
    {
      id: 'task5',
      title: 'Quick Hit Reward',
      icon: Star,
      adUrl: 'https://www.profitableratecpm.com/n3a9215qe?key=b3024267ff7b3a64ce8513385c5d8ee3',
      isCompleted: false,
      timeRemaining: 30,
      isTimerRunning: false,
      canClaim: false
    }
  ]);
  const [loading, setLoading] = useState(false);

  // Check completed tasks on load
  useEffect(() => {
    if (user?.id) {
      checkCompletedTasks();
    }
  }, [user]);

  // Handle timers
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    adTasks.forEach((task, index) => {
      if (task.isTimerRunning && task.timeRemaining > 0) {
        const timer = setInterval(() => {
          setAdTasks(prevTasks => {
            const updatedTasks = [...prevTasks];
            if (updatedTasks[index].timeRemaining > 0) {
              updatedTasks[index].timeRemaining -= 1;
              
              // When timer reaches 0, set canClaim to true
              if (updatedTasks[index].timeRemaining === 0) {
                updatedTasks[index].isTimerRunning = false;
                updatedTasks[index].canClaim = true;
              }
            }
            return updatedTasks;
          });
        }, 1000);
        
        timers.push(timer);
      }
    });

    return () => {
      timers.forEach(timer => clearInterval(timer));
    };
  }, [adTasks]);

  const checkCompletedTasks = async () => {
    if (!user?.id) return;

    try {
      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];
      
      // Check local storage first for completed tasks
      const completedTasksStr = localStorage.getItem(`completedAdTasks_${user.id}_${today}`);
      const completedTasks = completedTasksStr ? JSON.parse(completedTasksStr) : [];
      
      // Update task completion status
      setAdTasks(prevTasks => 
        prevTasks.map(task => ({
          ...task,
          isCompleted: completedTasks.includes(task.id)
        }))
      );

      // If Supabase is configured, also check database
      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('tasks')
          .select('task_id')
          .eq('user_id', user.id)
          .eq('task_type', 'daily_ad')
          .eq('completed', true)
          .gte('completed_at', today);

        if (!error && data) {
          const dbCompletedTaskIds = data.map(item => item.task_id);
          
          // Merge with local storage data
          const allCompletedTaskIds = [...new Set([...completedTasks, ...dbCompletedTaskIds])];
          
          // Update local storage
          localStorage.setItem(`completedAdTasks_${user.id}_${today}`, JSON.stringify(allCompletedTaskIds));
          
          // Update state
          setAdTasks(prevTasks => 
            prevTasks.map(task => ({
              ...task,
              isCompleted: allCompletedTaskIds.includes(task.id)
            }))
          );
        }
      }
    } catch (error) {
      console.error('Error checking completed tasks:', error);
    }
  };

  const handleStartTask = (taskId: string) => {
    // Find the task
    const taskIndex = adTasks.findIndex(task => task.id === taskId);
    if (taskIndex === -1 || adTasks[taskIndex].isCompleted) return;

    // Open ad in new tab
    const task = adTasks[taskIndex];
    window.open(task.adUrl, '_blank');

    // Start the timer
    setAdTasks(prevTasks => {
      const updatedTasks = [...prevTasks];
      updatedTasks[taskIndex].isTimerRunning = true;
      return updatedTasks;
    });
  };

  const handleClaimReward = async (taskId: string) => {
    // Find the task
    const taskIndex = adTasks.findIndex(task => task.id === taskId);
    if (taskIndex === -1 || adTasks[taskIndex].isCompleted || !adTasks[taskIndex].canClaim) return;

    setLoading(true);
    
    try {
      // Open the ad URL again
      window.open(adTasks[taskIndex].adUrl, '_blank');
      
      // Mark as completed in local state
      setAdTasks(prevTasks => {
        const updatedTasks = [...prevTasks];
        updatedTasks[taskIndex].isCompleted = true;
        updatedTasks[taskIndex].canClaim = false;
        return updatedTasks;
      });

      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];
      
      // Update local storage
      const completedTasksStr = localStorage.getItem(`completedAdTasks_${user?.id}_${today}`);
      const completedTasks = completedTasksStr ? JSON.parse(completedTasksStr) : [];
      completedTasks.push(taskId);
      localStorage.setItem(`completedAdTasks_${user?.id}_${today}`, JSON.stringify(completedTasks));

      // If Supabase is configured, update database
      if (isSupabaseConfigured && user?.id) {
        // Create a unique task ID
        const uniqueTaskId = `daily_ad_${taskId}_${uuidv4().substring(0, 8)}`;
        
        // Create task record
        await supabase
          .from('tasks')
          .insert({
            user_id: user.id,
            task_type: 'daily_ad',
            task_id: taskId,
            completed: true,
            points_earned: 50,
            completed_at: new Date().toISOString()
          });

        // Create transaction
        await supabase
          .from('transactions')
          .insert({
            user_id: user.id,
            type: 'earn',
            points: 50,
            description: `Daily Ad Task: ${adTasks[taskIndex].title}`,
            task_type: 'daily_ad'
          });

        // Update user profile points
        await supabase
          .from('profiles')
          .update({
            points: (userProfile?.points || 0) + 50,
            total_earned: (userProfile?.total_earned || 0) + 50
          })
          .eq('id', user.id);
          
        // Refresh user profile
        await refreshProfile();
      }

      toast.success('🎉 You earned 50 points!');
    } catch (error) {
      console.error('Error claiming reward:', error);
      toast.error('Failed to claim reward. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
          <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent">
            Daily Ad Tasks
          </span>
          <span className="ml-2 text-red-500 animate-pulse">🔥</span>
        </h1>
        <p className="text-gray-300 text-lg mb-6">
          Complete these special tasks to earn 50 points per task daily!
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adTasks.map((task) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            className={`relative bg-gradient-to-br ${
              task.isCompleted 
                ? 'from-green-500/20 to-emerald-600/20 border-green-500/30' 
                : task.canClaim
                ? 'from-yellow-500/20 to-orange-600/20 border-yellow-500/30'
                : 'from-purple-500/20 to-pink-600/20 border-purple-500/30'
            } backdrop-blur-sm rounded-2xl p-6 border transition-all duration-300`}
          >
            {/* Task Title */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                <task.icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{task.title}</h3>
                <p className="text-gray-300 text-sm">50 points reward</p>
              </div>
            </div>
            
            {/* Task Instructions */}
            <p className="text-gray-300 text-sm mb-4">
              Click below, watch the ad for 30 seconds, then claim your reward
            </p>
            
            {/* Task Status */}
            {task.isCompleted ? (
              <div className="flex items-center justify-center gap-2 bg-green-500/30 text-green-300 p-3 rounded-xl mb-4">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Task Completed Today</span>
              </div>
            ) : task.isTimerRunning ? (
              <div className="mb-4">
                <div className="flex items-center justify-center gap-2 text-white mb-2">
                  <Clock className="h-5 w-5 text-yellow-400" />
                  <span className="font-medium">Wait {task.timeRemaining} seconds</span>
                </div>
                <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-yellow-400 to-orange-500 h-full transition-all duration-300"
                    style={{ width: `${((30 - task.timeRemaining) / 30) * 100}%` }}
                  ></div>
                </div>
              </div>
            ) : task.canClaim ? (
              <div className="flex items-center justify-center gap-2 bg-yellow-500/30 text-yellow-300 p-3 rounded-xl mb-4 animate-pulse">
                <Zap className="h-5 w-5" />
                <span className="font-medium">Ready to claim!</span>
              </div>
            ) : (
              <div className="h-[60px] flex items-center justify-center">
                <div className="text-gray-400 text-sm">
                  Complete this task to earn 50 points
                </div>
              </div>
            )}
            
            {/* Action Button */}
            {task.isCompleted ? (
              <button
                disabled
                className="w-full py-3 bg-green-500/30 text-green-300 rounded-xl font-medium cursor-not-allowed flex items-center justify-center gap-2"
              >
                <CheckCircle className="h-5 w-5" />
                Completed
              </button>
            ) : task.canClaim ? (
              <button
                onClick={() => handleClaimReward(task.id)}
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-600 text-white rounded-xl font-medium transition-colors hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <RefreshCw className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Zap className="h-5 w-5" />
                    Claim 50 Points
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={() => handleStartTask(task.id)}
                disabled={task.isTimerRunning || loading}
                className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-medium transition-colors hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <ExternalLink className="h-5 w-5" />
                Start Task
              </button>
            )}
          </motion.div>
        ))}
      </div>

      {/* Instructions Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
      >
        <div className="flex items-center gap-3 mb-4">
          <Award className="h-6 w-6 text-yellow-400" />
          <h3 className="text-xl font-bold text-white">How It Works</h3>
        </div>
        
        <ol className="space-y-3 text-gray-300 list-decimal list-inside">
          <li>Click the <span className="text-purple-400 font-medium">"Start Task"</span> button to open the ad in a new tab</li>
          <li>Wait for the <span className="text-yellow-400 font-medium">30-second timer</span> to complete</li>
          <li>Click the <span className="text-orange-400 font-medium">"Claim 50 Points"</span> button to earn your reward</li>
          <li>The ad will open again to verify your completion</li>
          <li>Points will be added to your account immediately</li>
        </ol>
        
        <div className="mt-4 p-4 bg-blue-500/20 rounded-xl border border-blue-400/30">
          <p className="text-blue-300 text-sm">
            <span className="font-bold">💡 Pro Tip:</span> You can complete all 5 tasks daily for a total of 250 points!
            Tasks reset at midnight.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default SpecialDailyAdTasks;