import React from 'react'
import { motion } from 'framer-motion'
import { HelpCircle, MessageCircle, Mail, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'

const DashboardSupportCard: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center">
          <HelpCircle className="h-6 w-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">Need Help?</h3>
          <p className="text-gray-300 text-sm">We're here to assist you</p>
        </div>
      </div>

      <div className="space-y-4 mb-4">
        <div className="flex items-center gap-3 p-3 bg-white/10 rounded-lg hover:bg-white/15 transition-colors">
          <MessageCircle className="h-5 w-5 text-blue-400" />
          <div className="flex-1">
            <p className="text-white font-medium">Telegram Support</p>
            <p className="text-gray-400 text-sm">Fast responses within 24 hours</p>
          </div>
          <a 
            href="https://t.me/SuzainKhanSK" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>

        <div className="flex items-center gap-3 p-3 bg-white/10 rounded-lg hover:bg-white/15 transition-colors">
          <Mail className="h-5 w-5 text-purple-400" />
          <div className="flex-1">
            <p className="text-white font-medium">Email Support</p>
            <p className="text-gray-400 text-sm">Detailed assistance for complex issues</p>
          </div>
          <a 
            href="mailto:alroundearning@gmail.com" 
            className="text-purple-400 hover:text-purple-300"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>

      <Link 
        to="/support" 
        className="block w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-center rounded-xl font-medium hover:shadow-lg transition-all duration-300"
      >
        Visit Support Center
      </Link>
    </motion.div>
  )
}

export default DashboardSupportCard