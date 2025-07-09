import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, X, Send, User, Bot, Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

interface Message {
  id: string
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
}

interface ChatbotAssistantProps {
  initialMessage?: string
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  theme?: 'blue' | 'purple' | 'green'
  title?: string
}

const ChatbotAssistant: React.FC<ChatbotAssistantProps> = ({
  initialMessage = "Hello! I'm your virtual assistant. How can I help you today?",
  position = 'bottom-right',
  theme = 'blue',
  title = 'Support Assistant'
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const { userProfile } = useAuth()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Set position classes based on position prop
  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6'
  }

  // Set theme colors based on theme prop
  const themeColors = {
    'blue': {
      gradient: 'from-blue-500 to-blue-600',
      button: 'bg-blue-600 hover:bg-blue-700',
      highlight: 'text-blue-400',
      border: 'border-blue-400/30',
      bg: 'bg-blue-500/20'
    },
    'purple': {
      gradient: 'from-purple-500 to-purple-600',
      button: 'bg-purple-600 hover:bg-purple-700',
      highlight: 'text-purple-400',
      border: 'border-purple-400/30',
      bg: 'bg-purple-500/20'
    },
    'green': {
      gradient: 'from-green-500 to-green-600',
      button: 'bg-green-600 hover:bg-green-700',
      highlight: 'text-green-400',
      border: 'border-green-400/30',
      bg: 'bg-green-500/20'
    }
  }

  const selectedTheme = themeColors[theme]

  useEffect(() => {
    // Initialize with welcome message
    if (messages.length === 0) {
      setMessages([
        {
          id: '1',
          text: initialMessage,
          sender: 'bot',
          timestamp: new Date()
        }
      ])
    }
  }, [initialMessage])

  useEffect(() => {
    // Scroll to bottom when messages change
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // Focus input when chat is opened
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const toggleChat = () => {
    setIsOpen(!isOpen)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }

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
      {/* Chat toggle button */}
      <motion.button
        onClick={toggleChat}
        className={`fixed ${positionClasses[position]} z-40 w-14 h-14 bg-gradient-to-r ${selectedTheme.gradient} rounded-full flex items-center justify-center shadow-lg hover:shadow-blue-500/25 transition-all duration-300`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {isOpen ? (
          <X className="h-6 w-6 text-white" />
        ) : (
          <MessageSquare className="h-6 w-6 text-white" />
        )}
      </motion.button>

      {/* Chat window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={`fixed ${position === 'bottom-right' || position === 'bottom-left' ? 'bottom-24' : 'top-24'} ${position.includes('right') ? 'right-6' : 'left-6'} z-40 w-96 max-w-[calc(100vw-2rem)] bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl overflow-hidden`}
          >
            {/* Header */}
            <div className={`bg-gradient-to-r ${selectedTheme.gradient} p-4 flex items-center justify-between`}>
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-white" />
                <h3 className="text-white font-semibold">{title}</h3>
              </div>
              <button
                onClick={toggleChat}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="h-96 overflow-y-auto p-4 space-y-4">
              {messages.map(message => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.sender === 'bot' && (
                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center mr-2">
                      <Bot className="h-4 w-4 text-gray-300" />
                    </div>
                  )}
                  
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                      message.sender === 'user'
                        ? `${selectedTheme.button} text-white`
                        : 'bg-white/10 text-white border border-white/10'
                    }`}
                  >
                    <p>{message.text}</p>
                    <p className={`text-xs mt-1 ${
                      message.sender === 'user' ? 'text-white/70' : 'text-gray-400'
                    }`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  
                  {message.sender === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center ml-2">
                      <User className="h-4 w-4 text-gray-300" />
                    </div>
                  )}
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center mr-2">
                    <Bot className="h-4 w-4 text-gray-300" />
                  </div>
                  <div className="max-w-[75%] rounded-2xl px-4 py-3 bg-white/10 text-white border border-white/10">
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
                  ref={inputRef}
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
                  className={`p-2 ${selectedTheme.button} rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
                >
                  {isTyping ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-white/10 bg-gray-800/50">
              <p className="text-xs text-center text-gray-400">
                Powered by Premium Access Zone AI Assistant
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default ChatbotAssistant