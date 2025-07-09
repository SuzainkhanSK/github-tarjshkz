import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Sparkles, 
  Gift, 
  Trophy, 
  Users, 
  ArrowRight,
  Star,
  Zap,
  Shield,
  HelpCircle,
  CheckCircle,
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Twitter,
  Instagram,
  Facebook
} from 'lucide-react'
import { Link } from 'react-router-dom'
import LegalLinks from '../components/LegalLinks'
import SupportResources from '../components/SupportResources'

const HomePage: React.FC = () => {
  const features = [
    {
      icon: Trophy,
      title: 'Earn Points Easily',
      description: 'Play games, complete quizzes, and finish simple tasks to earn points quickly.',
      color: 'from-blue-400 to-blue-600'
    },
    {
      icon: Gift,
      title: 'Premium Subscriptions',
      description: 'Redeem your points for Netflix, YouTube Premium, Spotify, and many more services.',
      color: 'from-purple-400 to-purple-600'
    },
    {
      icon: Users,
      title: 'Referral Program',
      description: 'Invite friends and earn commission on all their points with our 3-tier referral system.',
      color: 'from-green-400 to-green-600'
    },
    {
      icon: Zap,
      title: 'Daily Rewards',
      description: 'Come back daily for free spins, scratch cards, and bonus point opportunities.',
      color: 'from-yellow-400 to-yellow-600'
    }
  ]

  const testimonials = [
    {
      name: 'Sarah J.',
      image: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150',
      text: 'I\'ve earned enough points for 6 months of Netflix Premium in just two weeks! The games are actually fun to play too.',
      service: 'Netflix'
    },
    {
      name: 'Michael T.',
      image: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150',
      text: 'The referral system is amazing. I invited 5 friends and now I\'m earning passive points every day from their activities.',
      service: 'Spotify Premium'
    },
    {
      name: 'Priya K.',
      image: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150',
      text: 'Customer support is fantastic! Had an issue with my redemption and they resolved it within hours.',
      service: 'YouTube Premium'
    }
  ]

  const stats = [
    { 
      label: 'Active Users', 
      value: '50K+',
      icon: Users,
      color: 'text-blue-400'
    },
    { 
      label: 'Subscriptions Given', 
      value: '25K+',
      icon: Gift,
      color: 'text-purple-400'
    },
    { 
      label: 'Points Distributed', 
      value: '1M+',
      icon: Zap,
      color: 'text-yellow-400'
    },
    { 
      label: 'Happy Members', 
      value: '95%',
      icon: CheckCircle,
      color: 'text-green-400'
    }
  ]

  const subscriptions = [
    { name: 'Netflix', logo: '🎬', color: 'from-red-500 to-red-600' },
    { name: 'YouTube Premium', logo: '📺', color: 'from-red-600 to-red-700' },
    { name: 'Amazon Prime', logo: '📦', color: 'from-blue-500 to-blue-600' },
    { name: 'Disney+ Hotstar', logo: '⭐', color: 'from-blue-600 to-indigo-600' },
    { name: 'Spotify', logo: '🎵', color: 'from-green-500 to-green-600' },
    { name: 'Apple Music', logo: '🎶', color: 'from-gray-700 to-gray-800' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-blue-950 overflow-hidden">
      {/* Hero Section */}
      <div className="relative">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div 
            className="absolute top-20 left-10 w-72 h-72 bg-cyan-400/20 rounded-full blur-3xl"
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div 
            className="absolute bottom-40 right-20 w-96 h-96 bg-fuchsia-500/20 rounded-full blur-3xl"
            animate={{ 
              scale: [1, 1.3, 1],
              opacity: [0.2, 0.5, 0.2]
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1
            }}
          />
          <motion.div 
            className="absolute top-60 right-40 w-64 h-64 bg-pink-500/15 rounded-full blur-3xl"
            animate={{ 
              scale: [1, 1.4, 1],
              opacity: [0.1, 0.3, 0.1]
            }}
            transition={{
              duration: 7,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5
            }}
          />
          <motion.div 
            className="absolute bottom-20 left-40 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl"
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.4, 0.1]
            }}
            transition={{
              duration: 9,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2
            }}
          />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-28 md:pt-24 md:pb-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <motion.div 
              className="flex justify-center mb-10"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ 
                type: "spring",
                stiffness: 260,
                damping: 20,
                delay: 0.2
              }}
            >
              <motion.img 
                src="https://i.ibb.co/R4TBHtVV/erasebg-transformed.png" 
                alt="Premium Access Zone" 
                className="h-60 w-auto"
                whileHover={{ 
                  rotate: [0, 5, -5, 0],
                  scale: 1.05
                }}
                animate={{
                  y: [0, -10, 0],
                  rotate: [0, 2, 0, -2, 0]
                }}
                transition={{ 
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </motion.div>
            
            <motion.h1 
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <span className="text-white">Get </span>
              <motion.span 
                className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent inline-block"
                animate={{
                  backgroundPosition: ['0% center', '100% center', '0% center'],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                Premium Services
              </motion.span>
              <span className="text-white"> For </span>
              <motion.span 
                className="bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 bg-clip-text text-transparent inline-block"
                animate={{
                  backgroundPosition: ['0% center', '100% center', '0% center'],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1
                }}
              >
                Free
              </motion.span>
            </motion.h1>
            
            <motion.p 
              className="text-lg sm:text-xl md:text-2xl text-gray-200 mb-8 md:mb-10 max-w-3xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              <motion.span
                animate={{
                  color: ['rgb(229, 231, 235)', 'rgb(255, 255, 255)', 'rgb(229, 231, 235)']
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                Earn points through fun games and simple tasks, then redeem them for 
                Netflix, YouTube Premium, Spotify, and more — all without spending a penny.
              </motion.span>
            </motion.p>
            
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 md:gap-5 justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              <motion.div 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.6, type: "spring" }}
              >
                <Link to="/register" className="block">
                  <div className="group relative px-8 sm:px-10 py-4 sm:py-5 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold rounded-xl text-lg shadow-xl hover:shadow-yellow-500/25 transition-all duration-300">
                    <motion.div 
                      className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      animate={{
                        boxShadow: ['0 0 0px rgba(234, 179, 8, 0)', '0 0 20px rgba(234, 179, 8, 0.5)', '0 0 0px rgba(234, 179, 8, 0)']
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    ></motion.div>
                    <span className="flex items-center gap-2 relative z-10">
                      Get Started Free
                      <motion.div
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <ArrowRight className="h-5 w-5" />
                      </motion.div>
                    </span>
                  </div>
                </Link>
              </motion.div>
              
              <motion.div 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.7, type: "spring" }}
              >
                <Link to="/login" className="block">
                  <div className="px-8 sm:px-10 py-4 sm:py-5 border-2 border-white/30 text-white font-bold rounded-xl text-lg backdrop-blur-sm hover:bg-white/10 transition-all duration-300">
                    <span className="flex items-center gap-2">
                      Sign In
                    </span>
                  </div>
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Stats Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative -mt-16 sm:-mt-20"
        viewport={{ once: true, margin: "-100px" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 md:p-8 border border-white/20 shadow-xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="text-center flex flex-col items-center"
                >
                  <motion.div 
                    className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center mb-2 md:mb-3 ${stat.color} bg-white/10`}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    animate={{ 
                      scale: [1, 1.1, 1],
                      rotate: [0, 2, 0, -2, 0]
                    }}
                    transition={{ 
                      duration: 4,
                      repeat: Infinity,
                      delay: index * 0.5
                    }}
                  >
                    <stat.icon className="h-5 w-5 md:h-6 md:w-6" />
                  </motion.div>
                  <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-1">
                    <motion.span
                      initial={{ opacity: 0, scale: 0.5 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      transition={{ 
                        type: "spring",
                        stiffness: 260,
                        damping: 20,
                        delay: 0.1 + index * 0.1
                      }}
                      viewport={{ once: true }}
                    >
                      {stat.value}
                    </motion.span>
                  </div>
                  <div className="text-gray-300 text-sm sm:text-base">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* How It Works */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true, margin: "-100px" }}
        className="py-20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              viewport={{ once: true }}
            >
              <motion.h2 
                className="text-3xl md:text-4xl font-bold mb-4"
                animate={{ 
                  color: ['rgb(255, 255, 255)', 'rgb(191, 219, 254)', 'rgb(255, 255, 255)']
                }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              >
                How It Works
              </motion.h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Earn points and redeem them for premium subscriptions in four simple steps
              </p>
            </motion.div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { 
                step: 1, 
                title: "Sign Up", 
                description: "Create your free account and get 100 welcome points",
                icon: Users,
                color: "from-blue-400 to-blue-600"
              },
              { 
                step: 2, 
                title: "Earn Points", 
                description: "Play games, complete tasks, and participate in activities",
                icon: Trophy,
                color: "from-green-400 to-green-600"
              },
              { 
                step: 3, 
                title: "Choose Rewards", 
                description: "Browse available premium subscriptions in our catalog",
                icon: Gift,
                color: "from-purple-400 to-purple-600"
              },
              { 
                step: 4, 
                title: "Redeem & Enjoy", 
                description: "Get activation codes and enjoy premium services",
                icon: Sparkles,
                color: "from-yellow-400 to-yellow-600"
              }
            ].map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                viewport={{ once: true, margin: "-100px" }}
                className="relative"
              >
                <motion.div 
                  className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 h-full hover:border-white/40 transition-all duration-300"
                  whileHover={{ 
                    y: -5,
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)"
                  }}
                >
                  <motion.div 
                    className="absolute -top-5 -left-5 w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg"
                    animate={{
                      boxShadow: ['0 0 0px rgba(79, 70, 229, 0)', '0 0 15px rgba(79, 70, 229, 0.5)', '0 0 0px rgba(79, 70, 229, 0)']
                    }}
                    transition={{ duration: 2, repeat: Infinity, delay: index * 0.5 }}
                  >
                    {step.step}
                  </motion.div>
                  <motion.div 
                    className={`w-16 h-16 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center mb-4`}
                    whileHover={{ rotate: 5 }}
                    animate={{ 
                      y: [0, -5, 0],
                      rotate: [0, 2, 0, -2, 0]
                    }}
                    transition={{ 
                      duration: 3,
                      repeat: Infinity,
                      delay: index * 0.3
                    }}
                  >
                    <step.icon className="h-8 w-8 text-white" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-gray-300">{step.description}</p>
                </motion.div>
                
                {/* Connector line between steps (except last) */}
                {index < 3 && (
                  <motion.div 
                    className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-white/20"
                    animate={{
                      opacity: [0.2, 0.5, 0.2]
                    }}
                    transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
                  >
                    <motion.div 
                      className="absolute right-0 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-white/40 rounded-full"
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.4, 0.8, 0.4]
                      }}
                      transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
                    ></motion.div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Available Subscriptions */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true, margin: "-100px" }}
        className="py-20 bg-gradient-to-b from-black/10 via-indigo-950/20 to-black/10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              viewport={{ once: true }}
            >
              <motion.h2 
                className="text-3xl md:text-4xl font-bold mb-4"
                animate={{ 
                  color: ['rgb(255, 255, 255)', 'rgb(216, 180, 254)', 'rgb(255, 255, 255)']
                }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              >
                Premium Subscriptions
              </motion.h2>
              <p className="text-xl text-gray-300">
                Redeem your points for these popular streaming services
              </p>
            </motion.div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6 md:gap-8">
            {subscriptions.map((sub, index) => (
              <motion.div
                key={sub.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                whileHover={{ scale: 1.05, y: -5, rotateZ: 2 }}
                whileTap={{ scale: 0.95 }}
                viewport={{ once: true, margin: "-50px" }}
                className="group cursor-pointer"
              >
                <div className={`bg-gradient-to-br ${sub.color} p-5 sm:p-6 rounded-2xl shadow-xl group-hover:shadow-2xl transition-all duration-300 border border-white/10 relative overflow-hidden`}>
                  {/* Animated background glow */}
                  <motion.div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    animate={{
                      background: [
                        'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 50%)',
                        'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 50%)',
                        'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 50%)'
                      ]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <div className="text-center">
                    <motion.div 
                      className="text-3xl sm:text-4xl mb-2 sm:mb-3"
                      animate={{ 
                        y: [0, -5, 0],
                        scale: [1, 1.1, 1]
                      }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        repeatDelay: index
                      }}
                    >
                      {sub.logo}
                    </motion.div>
                    <div className="text-white font-bold text-base sm:text-lg">{sub.name}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          
          <div className="mt-12 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              viewport={{ once: true }}
            >
              <Link to="/register">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative px-8 py-4 bg-gradient-to-r from-purple-500 to-blue-600 text-white font-bold rounded-xl shadow-xl hover:shadow-purple-500/25 transition-all duration-300 overflow-hidden group"
                >
                  <motion.span 
                    className="absolute inset-0 bg-gradient-to-r from-purple-600/0 via-white/20 to-purple-600/0"
                    animate={{
                      x: ['-100%', '200%'],
                    }}
                    transition={{ 
                      duration: 1.5, 
                      repeat: Infinity, 
                      repeatDelay: 3
                    }}
                  />
                  <span className="relative z-10 flex items-center gap-2">
                    View All Subscriptions
                    <motion.div
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1, repeat: Infinity, repeatDelay: 1 }}
                    >
                      <ArrowRight className="h-5 w-5" />
                    </motion.div>
                  </span>
                </motion.button>
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Features Section */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true, margin: "-100px" }}
        className="py-20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              viewport={{ once: true }}
            >
              <motion.h2 
                className="text-3xl md:text-4xl font-bold mb-4"
                animate={{ 
                  color: ['rgb(255, 255, 255)', 'rgb(147, 197, 253)', 'rgb(255, 255, 255)']
                }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              >
                Why Choose Us
              </motion.h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                We make earning and redeeming points simple, fun, and rewarding
              </p>
            </motion.div>
          </div>
          
          <div className="grid sm:grid-cols-2 gap-6 md:gap-8 lg:gap-12">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                viewport={{ once: true, margin: "-50px" }}
                className="group relative"
              >
                <motion.div 
                  className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-white/20 hover:bg-white/15 transition-all duration-300 h-full"
                  whileHover={{ 
                    y: -5,
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)"
                  }}
                >
                  <div className={`flex items-center justify-center w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <motion.div
                      animate={{ 
                        rotate: [0, 5, -5, 0],
                        scale: [1, 1.1, 1]
                      }}
                      transition={{ 
                        duration: 3,
                        repeat: Infinity,
                        delay: index * 0.5
                      }}
                    >
                      <feature.icon className="h-8 w-8 text-white" />
                    </motion.div>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">{feature.title}</h3>
                  <p className="text-gray-300 text-lg leading-relaxed">{feature.description}</p>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Testimonials Section */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true, margin: "-100px" }}
        className="py-20 bg-gradient-to-b from-black/10 via-purple-950/20 to-black/10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              viewport={{ once: true }}
            >
              <motion.h2 
                className="text-3xl md:text-4xl font-bold mb-4"
                animate={{ 
                  color: ['rgb(255, 255, 255)', 'rgb(196, 181, 253)', 'rgb(255, 255, 255)']
                }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              >
                What Our Users Say
              </motion.h2>
              <p className="text-xl text-gray-300">
                Real stories from satisfied members
              </p>
            </motion.div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                viewport={{ once: true, margin: "-50px" }}
                className="group"
              >
                <motion.div 
                  className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 h-full"
                  whileHover={{ 
                    y: -5,
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)"
                  }}
                >
                  <div className="flex items-center mb-4">
                    <motion.img 
                      src={testimonial.image} 
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full mr-4 object-cover"
                      whileHover={{ scale: 1.1 }}
                    />
                    <div>
                      <h4 className="text-white font-bold">{testimonial.name}</h4>
                      <p className="text-gray-400 text-sm">{testimonial.service} User</p>
                    </div>
                  </div>
                  <div className="flex mb-4">
                    {[...Array(5)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 * i }}
                        viewport={{ once: true }}
                      >
                        <Star className="h-5 w-5 text-yellow-400 fill-current" />
                      </motion.div>
                    ))}
                  </div>
                  <p className="text-gray-300 italic">"{testimonial.text}"</p>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* CTA Section */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true, margin: "-100px" }}
        className="py-20"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            viewport={{ once: true }}
          >
            <motion.h2 
              className="text-3xl md:text-4xl font-bold mb-6"
              animate={{ 
                color: ['rgb(255, 255, 255)', 'rgb(251, 191, 36)', 'rgb(255, 255, 255)']
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              Ready to Start Earning?
            </motion.h2>
            <p className="text-xl text-gray-300 mb-8">
              Join thousands of users who are already enjoying premium services for free
            </p>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link to="/register">
                <motion.button
                  className="relative px-10 py-5 bg-gradient-to-r from-green-400 to-blue-500 text-white font-bold rounded-xl text-xl shadow-xl hover:shadow-green-500/25 transition-all duration-300 overflow-hidden group"
                  animate={{
                    boxShadow: ['0 0 0px rgba(34, 197, 94, 0)', '0 0 30px rgba(34, 197, 94, 0.3)', '0 0 0px rgba(34, 197, 94, 0)']
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <motion.span 
                    className="absolute inset-0 bg-gradient-to-r from-green-500/0 via-white/20 to-green-500/0"
                    animate={{
                      x: ['-100%', '200%'],
                    }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity, 
                      repeatDelay: 4
                    }}
                  />
                  <span className="relative z-10 flex items-center gap-2">
                    <Sparkles className="h-6 w-6" />
                    Start Earning Now
                    <motion.div
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <ArrowRight className="h-6 w-6" />
                    </motion.div>
                  </span>
                </motion.button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* Footer */}
      <footer className="bg-black/20 backdrop-blur-sm border-t border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                viewport={{ once: true }}
              >
                <h3 className="text-2xl font-bold text-white mb-4">Premium Access Zone</h3>
                <p className="text-gray-300 mb-4">
                  Your gateway to premium subscriptions without the premium price. 
                  Earn points through fun activities and redeem them for your favorite services.
                </p>
                <div className="flex space-x-4">
                  {[
                    { icon: Facebook, href: '#' },
                    { icon: Twitter, href: '#' },
                    { icon: Instagram, href: '#' },
                    { icon: Linkedin, href: '#' }
                  ].map((social, index) => (
                    <motion.a
                      key={index}
                      href={social.href}
                      whileHover={{ scale: 1.1, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-gray-300 hover:text-white hover:bg-white/20 transition-all duration-300"
                    >
                      <social.icon className="h-5 w-5" />
                    </motion.a>
                  ))}
                </div>
              </motion.div>
            </div>
            
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                viewport={{ once: true }}
              >
                <h4 className="text-lg font-bold text-white mb-4">Quick Links</h4>
                <ul className="space-y-2">
                  {[
                    { name: 'How It Works', href: '#' },
                    { name: 'Earn Points', href: '/tasks' },
                    { name: 'Rewards', href: '/rewards' },
                    { name: 'Referrals', href: '/referrals' }
                  ].map((link, index) => (
                    <li key={index}>
                      <motion.a
                        href={link.href}
                        whileHover={{ x: 5 }}
                        className="text-gray-300 hover:text-white transition-colors duration-300"
                      >
                        {link.name}
                      </motion.a>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>
            
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                viewport={{ once: true }}
              >
                <h4 className="text-lg font-bold text-white mb-4">Support</h4>
                <ul className="space-y-2">
                  <li className="flex items-center text-gray-300">
                    <Mail className="h-4 w-4 mr-2" />
                    support@premiumaccesszone.com
                  </li>
                  <li className="flex items-center text-gray-300">
                    <HelpCircle className="h-4 w-4 mr-2" />
                    <Link to="/support" className="hover:text-white transition-colors duration-300">
                      Help Center
                    </Link>
                  </li>
                </ul>
                <div className="mt-4">
                  <LegalLinks />
                </div>
              </motion.div>
            </div>
          </div>
          
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            viewport={{ once: true }}
            className="border-t border-white/10 mt-8 pt-8 text-center"
          >
            <p className="text-gray-400">
              © 2025 Premium Access Zone. All rights reserved.
            </p>
          </motion.div>
        </div>
      </footer>
    </div>
  )
}

export default HomePage