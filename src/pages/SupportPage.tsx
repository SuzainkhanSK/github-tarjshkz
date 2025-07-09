import React from 'react'
import { motion } from 'framer-motion'
import { 
  HelpCircle, 
  MessageCircle, 
  Mail, 
  FileQuestion, 
  Search,
  CheckCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { Link } from 'react-router-dom'
import SupportResources from '../components/SupportResources'

const SupportPage: React.FC = () => {
  const [expandedFaq, setExpandedFaq] = React.useState<number | null>(null)

  const toggleFaq = (index: number) => {
    if (expandedFaq === index) {
      setExpandedFaq(null)
    } else {
      setExpandedFaq(index)
    }
  }

  const faqs = [
    {
      question: "How do I earn points on Premium Access Zone?",
      answer: "You can earn points through various activities including playing games like Spin & Win and Scratch & Earn, completing social media tasks, participating in daily quizzes, and more. Each activity awards different point values based on complexity and time required."
    },
    {
      question: "How long does it take to process a redemption request?",
      answer: "Redemption requests are typically processed within 24-48 hours. Once processed, you'll receive an email with your subscription activation details. During high-volume periods, processing may take slightly longer."
    },
    {
      question: "Can I redeem multiple subscriptions at once?",
      answer: "Yes, you can redeem multiple subscriptions as long as you have sufficient points for each redemption. There is no limit to how many different subscriptions you can redeem, but daily redemption limits may apply."
    },
    {
      question: "What happens if my subscription code doesn't work?",
      answer: "If you encounter any issues with your subscription code, please contact our support team immediately with your redemption ID. We'll investigate the issue and provide a resolution, which may include a replacement code or refunding your points."
    },
    {
      question: "Do points expire?",
      answer: "Points expire after 12 months of account inactivity. To keep your points active, simply log in and perform any point-earning activity at least once every 12 months."
    },
    {
      question: "Can I transfer points to another account?",
      answer: "Points cannot be transferred between accounts. This policy helps maintain the integrity of our rewards system and prevents abuse."
    },
    {
      question: "How do I report a technical issue?",
      answer: "To report a technical issue, please contact us via Telegram (@SuzainKhanSK) or email (alroundearning@gmail.com) with details about the problem, including screenshots if possible, your device information, and steps to reproduce the issue."
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Support Center
            </span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Get help with your account, redemptions, or any other questions you may have about Premium Access Zone.
          </p>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-2xl mx-auto mb-12"
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search for help..."
              className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            />
          </div>
        </motion.div>

        {/* Support Resources */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <SupportResources />
        </motion.div>

        {/* FAQs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-12"
        >
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gradient-to-br from-yellow-500 to-orange-600 p-2 rounded-lg">
                <FileQuestion className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">Frequently Asked Questions</h2>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div 
                  key={index}
                  className={`border border-white/10 rounded-xl overflow-hidden transition-all duration-300 ${
                    expandedFaq === index ? 'bg-white/10' : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full flex items-center justify-between p-4 text-left"
                  >
                    <span className="font-medium text-white">{faq.question}</span>
                    {expandedFaq === index ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                  
                  {expandedFaq === index && (
                    <div className="p-4 pt-0 text-gray-300 border-t border-white/10">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Quick Help */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-green-500/20 p-2 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                </div>
                <h3 className="text-xl font-semibold text-white">Common Solutions</h3>
              </div>
              
              <ul className="space-y-3">
                <li>
                  <Link to="/legal/refund-policy" className="text-blue-400 hover:text-blue-300 flex items-center gap-2">
                    <span className="text-blue-500">•</span>
                    Refund & Cancellation Policy
                  </Link>
                </li>
                <li>
                  <Link to="/profile" className="text-blue-400 hover:text-blue-300 flex items-center gap-2">
                    <span className="text-blue-500">•</span>
                    How to update your profile
                  </Link>
                </li>
                <li>
                  <Link to="/transactions" className="text-blue-400 hover:text-blue-300 flex items-center gap-2">
                    <span className="text-blue-500">•</span>
                    View your transaction history
                  </Link>
                </li>
                <li>
                  <Link to="/rewards" className="text-blue-400 hover:text-blue-300 flex items-center gap-2">
                    <span className="text-blue-500">•</span>
                    How to redeem your points
                  </Link>
                </li>
              </ul>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-yellow-500/20 p-2 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-yellow-400" />
                </div>
                <h3 className="text-xl font-semibold text-white">Need More Help?</h3>
              </div>
              
              <p className="text-gray-300 mb-4">
                If you couldn't find what you're looking for, please reach out to us directly. Our support team is ready to assist you.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <a 
                  href="https://t.me/SuzainKhanSK" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-blue-400 transition-colors"
                >
                  <MessageCircle className="h-5 w-5" />
                  Contact on Telegram
                </a>
                
                <a 
                  href="mailto:alroundearning@gmail.com" 
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-purple-400 transition-colors"
                >
                  <Mail className="h-5 w-5" />
                  Send Email
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default SupportPage