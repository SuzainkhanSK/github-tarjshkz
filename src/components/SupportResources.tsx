import React from 'react'
import { motion } from 'framer-motion'
import { MessageCircle, Mail, ExternalLink, Users, Clock, HelpCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

interface SupportResourcesProps {
  className?: string
  compact?: boolean
}

const SupportResources: React.FC<SupportResourcesProps> = ({ 
  className = "", 
  compact = false 
}) => {
  return (
    <div className={`${className}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-lg">
            <HelpCircle className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">Community & Support Resources</h2>
        </div>

        {!compact && (
          <p className="text-gray-300 mb-6">
            Need assistance or want to connect with us? We offer multiple channels to support you:
          </p>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Direct Support */}
          <div className="bg-white/5 rounded-xl p-5 border border-white/10 hover:border-blue-400/30 hover:bg-blue-400/5 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-blue-500/20 p-2 rounded-lg">
                <MessageCircle className="h-5 w-5 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Direct Support</h3>
            </div>
            
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-gray-300">
                <span className="text-blue-400">•</span>
                <span>Personal Telegram:</span>
                <a 
                  href="https://t.me/SuzainKhanSK" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  @SuzainKhanSK
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li className="flex items-start gap-2 text-gray-300">
                <span className="text-blue-400 mt-1">•</span>
                <div>
                  <span>Email:</span>
                  <a 
                    href="mailto:alroundearning@gmail.com" 
                    className="text-blue-400 hover:text-blue-300 ml-1"
                  >
                    alroundearning@gmail.com
                  </a>
                </div>
              </li>
            </ul>
          </div>

          {/* Community Channel */}
          <div className="bg-white/5 rounded-xl p-5 border border-white/10 hover:border-purple-400/30 hover:bg-purple-400/5 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-purple-500/20 p-2 rounded-lg">
                <Users className="h-5 w-5 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Community Channel</h3>
            </div>
            
            <div className="mb-4">
              <div className="flex items-center gap-2 text-gray-300 mb-2">
                <span className="text-purple-400">•</span>
                <span>Official Telegram Channel:</span>
                <a 
                  href="https://t.me/SKModTechOfficial" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:text-purple-300 flex items-center gap-1"
                >
                  @SKModTechOfficial
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
            
            {!compact && (
              <div className="bg-purple-500/10 rounded-lg p-3 border border-purple-500/20">
                <p className="text-sm text-purple-300">
                  Join our vibrant community for latest updates, technical support, user discussions, tips & tricks, and exclusive announcements!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Response Times */}
        <div className="mt-6 bg-white/5 rounded-xl p-5 border border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-green-500/20 p-2 rounded-lg">
              <Clock className="h-5 w-5 text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">Response Times</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <span className="text-green-400">•</span>
              <span className="text-gray-300">Telegram:</span>
              <span className="text-white">Within 24 hours</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">•</span>
              <span className="text-gray-300">Email:</span>
              <span className="text-white">1-2 business days</span>
            </div>
          </div>
        </div>

        {!compact && (
          <div className="mt-6 text-center text-gray-300">
            <p>
              Choose your preferred method of contact, and we'll be happy to assist you with any questions or concerns. Our dedicated support team is committed to providing you with prompt and professional assistance.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default SupportResources