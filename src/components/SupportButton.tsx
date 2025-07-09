import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { HelpCircle, X, MessageCircle, Send, Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import SupportResources from './SupportResources'

interface Message {
  id: string
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
}

const SupportButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! How can I help you today?',
      sender: 'bot',
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const { userProfile } = useAuth()
  const messagesEndRef = React.useRef<HTMLDivElement>(null)

  const toggleChat = () => {
    setIsOpen(!isOpen)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  React.useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = () => {
    if (!inputValue.trim()) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsTyping(true)

    // Simulate bot thinking
    setTimeout(() => {
      const botResponse = generateBotResponse(inputValue)
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        text: botResponse,
        sender: 'bot',
        timestamp: new Date()
      }])
      setIsTyping(false)
    }, 1000 + Math.random() * 1000) // Random delay between 1-2 seconds
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage()
    }
  }

  const generateBotResponse = (userInput: string): string => {
    const input = userInput.toLowerCase()
    
    // Common questions and responses
    if (input.includes('earn points') || input.includes('get points') || input.includes('how to earn')) {
      return 'You can earn points by playing games like Spin & Win and Scratch & Earn, completing social media tasks, and participating in daily quizzes. Each activity awards different point values!'
    }
    
    if (input.includes('redeem') || input.includes('rewards') || input.includes('subscription')) {
      return 'To redeem your points for premium subscriptions, go to the Rewards page, select your desired subscription and duration, then follow the redemption process. Redemptions are typically processed within 24-48 hours.'
    }
    
    if (input.includes('points expire') || input.includes('expiration')) {
      return 'Points expire after 12 months of account inactivity. To keep your points active, simply log in and perform any point-earning activity at least once every 12 months.'
    }
    
    if (input.includes('contact') || input.includes('support') || input.includes('help')) {
      return 'You can contact our support team via Telegram (@SuzainKhanSK) or email (alroundearning@gmail.com). We typically respond within 24 hours on Telegram and 1-2 business days via email.'
    }
    
    if (input.includes('refund') || input.includes('money back') || input.includes('cancel')) {
      return 'Due to the nature of digital rewards, we maintain a strict no-refund policy for redeemed points. Please see our Refund & Cancellation Policy for more details.'
    }
    
    if (input.includes('hello') || input.includes('hi') || input.includes('hey')) {
      return `Hello${userProfile?.full_name ? ' ' + userProfile.full_name : ''}! How can I assist you today?`
    }
    
    if (input.includes('thank')) {
      return 'You\'re welcome! Is there anything else I can help you with?'
    }
    
    if (input.includes('bye') || input.includes('goodbye')) {
      return 'Goodbye! Feel free to reach out if you have any more questions.'
    }
    
    // Default response
    return "I'm not sure I understand your question. For specific help, please contact our support team via Telegram (@SuzainKhanSK) or email (alroundearning@gmail.com), or check our FAQ section on the Support page."
  }

  return (
    <>
      {/* Floating button */}
      <motion.button
        onClick={toggleChat}
        className="fixed bottom-4 right-4 z-40 w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-blue-500/25 transition-all duration-300"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {isOpen ? (
          <X className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
        ) : (
          <HelpCircle className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
        )}
      </motion.button>

      {/* Chat window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-20 right-4 z-40 w-[calc(100vw-2rem)] sm:w-96 max-w-[calc(100vw-2rem)] bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-white" />
                <h3 className="text-white font-semibold">Support Assistant</h3>
              </div>
              <button
                onClick={toggleChat}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="h-80 sm:h-96 overflow-y-auto p-4 space-y-4">
              {messages.map(message => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                      message.sender === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white/10 text-white border border-white/10'
                    }`}
                  >
                    <p>{message.text}</p>
                    <p className={`text-xs mt-1 ${
                      message.sender === 'user' ? 'text-blue-200' : 'text-gray-400'
                    }`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-2xl px-4 py-2 bg-white/10 text-white border border-white/10">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-150"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-300"></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/10">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isTyping}
                  className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isTyping ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Support Resources */}
            <div className="p-4 border-t border-white/10 bg-gray-800/50">
              <p className="text-sm text-gray-400 mb-2">Need more help?</p>
              <div className="flex flex-wrap gap-2">
                <a 
                  href="https://t.me/SuzainKhanSK" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-blue-400 transition-colors"
                >
                  Telegram Support
                </a>
                <a 
                  href="mailto:alroundearning@gmail.com" 
                  className="text-sm px-3 py-1 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-purple-400 transition-colors"
                >
                  Email Support
                </a>
                <Link 
                  to="/support" 
                  className="text-sm px-3 py-1 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-lg text-green-400 transition-colors"
                >
                  Support Center
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default SupportButton