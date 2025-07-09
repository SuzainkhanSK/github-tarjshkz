import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Tv, Play, Package, Music, Crown, Sparkles, Gem } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SubscriptionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  features?: string[];
}

const PremiumSubscriptions: React.FC = () => {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const subscriptions: SubscriptionProps[] = [
    {
      title: 'Netflix Premium',
      description: 'Unlimited movies, TV shows, and documentaries in Ultra HD. Enjoy 4K streaming with no ads.',
      icon: <Tv className="h-10 w-10 text-white" />,
      color: 'bg-[#ff0000]',
      features: [
        'Watch in 4K Ultra HD',
        'No ads',
        'Multiple device streaming',
        'Exclusive content'
      ]
    },
    {
      title: 'YouTube Premium',
      description: 'Ad-free videos, background play, and downloads. Includes YouTube Music Premium as well.',
      icon: <Play className="h-10 w-10 text-white" />,
      color: 'bg-[#ff0000]',
      features: [
        'Ad-free videos',
        'Background play',
        'YouTube Music Premium included',
        'Offline downloads'
      ]
    },
    {
      title: 'Amazon Prime Video',
      description: 'Stream thousands of movies and TV shows, including exclusive Amazon Originals. Watch in 4K and HDR.',
      icon: <Package className="h-10 w-10 text-white" />,
      color: 'bg-[#00a8e1]',
      features: [
        'Exclusive Amazon Originals',
        '4K and HDR streaming',
        'Download for offline viewing',
        'Multiple profiles'
      ]
    },
    {
      title: 'Apple Music',
      description: 'Listen to 70 million songs ad-free. Get exclusive content and enjoy offline listening.',
      icon: <Music className="h-10 w-10 text-white" />,
      color: 'bg-[#ff2d55]',
      features: [
        '70+ million songs',
        'Ad-free listening',
        'Offline downloads',
        'Exclusive content'
      ]
    }
  ];

  const toggleCard = (title: string) => {
    if (expandedCard === title) {
      setExpandedCard(null);
    } else {
      setExpandedCard(title);
    }
  };

  return (
    <div className="mb-8">
      {/* Visual Header (Replaced Text) */}
      <motion.div 
        className="flex justify-center items-center gap-4 mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          animate={{ 
            rotate: [0, 10, -10, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Crown className="h-8 w-8 text-yellow-400" />
        </motion.div>
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.7, 1, 0.7]
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <Sparkles className="h-6 w-6 text-purple-400" />
        </motion.div>
        <motion.div
          animate={{ 
            rotate: [0, 15, -15, 0],
            y: [0, -5, 0]
          }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <Gem className="h-8 w-8 text-blue-400" />
        </motion.div>
      </motion.div>
      
      {/* Subscription Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {subscriptions.map((subscription) => (
          <motion.div
            key={subscription.title}
            className={`${subscription.color} rounded-xl overflow-hidden cursor-pointer shadow-lg`}
            onClick={() => toggleCard(subscription.title)}
            whileHover={{ 
              scale: 1.03, 
              y: -8,
              transition: { duration: 0.2 }
            }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-6">
              <motion.div 
                className="flex justify-center mb-4"
                animate={{ y: expandedCard === subscription.title ? 0 : [0, -5, 0] }}
                transition={{ 
                  repeat: expandedCard === subscription.title ? 0 : Infinity, 
                  duration: 2
                }}
              >
                {subscription.icon}
              </motion.div>
              
              <h3 className="text-xl font-bold text-white text-center mb-3">
                {subscription.title}
              </h3>
              
              <p className="text-white text-center text-sm leading-relaxed">
                {subscription.description}
              </p>
              
              {expandedCard === subscription.title && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-4"
                >
                  <h4 className="text-white font-bold text-center mb-2">Features:</h4>
                  <ul className="space-y-2 mb-4">
                    {subscription.features?.map((feature, index) => (
                      <li key={index} className="text-white flex items-center">
                        <span className="mr-2">✓</span>
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Link to="/rewards">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-full py-2 bg-white text-black font-bold rounded-lg"
                    >
                      Subscribe Now
                    </motion.button>
                  </Link>
                </motion.div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default PremiumSubscriptions;