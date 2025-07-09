import React from 'react';
import { motion } from 'framer-motion';
import { Zap, ArrowRight, Calendar, Gift } from 'lucide-react';
import { Link } from 'react-router-dom';

const SpecialTasksPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent">
            Special Tasks
          </span>
        </h1>
        <p className="text-xl text-gray-300 mb-6">
          Complete special tasks to earn bonus points daily!
        </p>
      </motion.div>

      {/* Special Tasks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Special Task 1 - Daily Ad Tasks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ y: -5, transition: { duration: 0.2 } }}
          className="bg-gradient-to-br from-purple-500/20 to-pink-600/20 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30 transition-all duration-300"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">SpecialTask1</h3>
              <p className="text-gray-300 text-sm">Earn 50 points per task</p>
            </div>
          </div>
          
          <p className="text-gray-300 text-sm mb-6">
            Complete daily ad tasks to earn up to 250 points! Watch ads for 30 seconds and claim your rewards.
          </p>
          
          <Link
            to="/special-tasks/specialtask1"
            className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-medium transition-colors hover:shadow-lg flex items-center justify-center gap-2"
          >
            View Tasks
            <ArrowRight className="h-5 w-5" />
          </Link>
        </motion.div>
        
        {/* Special Task 2 - Daily Check-in */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ y: -5, transition: { duration: 0.2 } }}
          className="bg-gradient-to-br from-yellow-500/20 to-orange-600/20 backdrop-blur-sm rounded-2xl p-6 border border-yellow-500/30 transition-all duration-300"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Daily Check-in</h3>
              <p className="text-gray-300 text-sm">Earn up to 300 points per day</p>
            </div>
          </div>
          
          <p className="text-gray-300 text-sm mb-6">
            Check in daily to earn increasing rewards! Build your streak for bigger bonuses and earn up to 300-1000 points on day 7!
          </p>
          
          <Link
            to="/special-tasks/daily-check-in"
            className="w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-600 text-white rounded-xl font-medium transition-colors hover:shadow-lg flex items-center justify-center gap-2"
          >
            View Check-in
            <ArrowRight className="h-5 w-5" />
          </Link>
        </motion.div>
        
        {/* Placeholder for future special tasks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 flex flex-col items-center justify-center text-center"
        >
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4">
            <Zap className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">More Tasks Coming Soon</h3>
          <p className="text-gray-400 text-sm">
            We're working on more special tasks for you to earn points!
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default SpecialTasksPage;