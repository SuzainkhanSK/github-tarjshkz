import React from 'react';
import { motion } from 'framer-motion';
import { Zap, ArrowLeft } from 'lucide-react';
import SpecialTask1 from '../components/SpecialTask1';
import { Link } from 'react-router-dom';

const DailyAdTasksPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="flex items-center justify-center mb-4">
          <Link 
            to="/special-tasks" 
            className="text-gray-300 hover:text-white flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Special Tasks
          </Link>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent">
            Daily Ad Tasks
          </span>
          <span className="ml-2 text-red-500 animate-pulse">🔥</span>
        </h1>
        <p className="text-xl text-gray-300 mb-6">
          Complete these special tasks to earn 50 points per task daily!
        </p>
      </motion.div>

      {/* Special Task 1 - Daily Ad Tasks */}
      <SpecialTask1 />
    </div>
  );
};

export default DailyAdTasksPage;