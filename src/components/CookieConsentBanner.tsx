import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Cookie, X, ChevronDown, ChevronUp } from 'lucide-react'
import { Link } from 'react-router-dom'

const CookieConsentBanner: React.FC = () => {
  const [showBanner, setShowBanner] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [preferences, setPreferences] = useState({
    essential: true, // Always required
    analytics: true,
    functional: true,
    marketing: false
  })

  useEffect(() => {
    // Check if user has already consented
    const consent = localStorage.getItem('cookie_consent')
    if (!consent) {
      // Show banner after a short delay
      const timer = setTimeout(() => {
        setShowBanner(true)
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleAcceptAll = () => {
    setPreferences({
      essential: true,
      analytics: true,
      functional: true,
      marketing: true
    })
    saveConsent({
      essential: true,
      analytics: true,
      functional: true,
      marketing: true
    })
  }

  const handleAcceptSelected = () => {
    saveConsent(preferences)
  }

  const saveConsent = (prefs: typeof preferences) => {
    localStorage.setItem('cookie_consent', JSON.stringify({
      preferences: prefs,
      timestamp: new Date().toISOString()
    }))
    setShowBanner(false)
    
    // Apply cookie preferences
    applyPreferences(prefs)
  }

  const applyPreferences = (prefs: typeof preferences) => {
    // In a real implementation, this would enable/disable various tracking scripts
    if (prefs.analytics) {
      // Enable analytics cookies
      console.log('Analytics cookies enabled')
    }
    
    if (prefs.functional) {
      // Enable functional cookies
      console.log('Functional cookies enabled')
    }
    
    if (prefs.marketing) {
      // Enable marketing cookies
      console.log('Marketing cookies enabled')
    }
  }

  const handleToggleDetails = () => {
    setShowDetails(!showDetails)
  }

  const handlePreferenceChange = (key: keyof typeof preferences) => {
    if (key === 'essential') return // Essential cookies can't be disabled
    
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  if (!showBanner) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="fixed bottom-0 left-0 right-0 z-50 p-4"
      >
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-900/95 backdrop-blur-md rounded-xl border border-gray-700 shadow-2xl overflow-hidden">
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="bg-blue-500/20 rounded-full p-2">
                  <Cookie className="h-6 w-6 text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">Cookie Consent</h3>
                  <p className="text-gray-300 mb-4">
                    We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our traffic. By clicking "Accept All", you consent to our use of cookies as described in our <Link to="/legal/cookie-policy" className="text-blue-400 hover:underline">Cookie Policy</Link>.
                  </p>
                  
                  <button
                    onClick={handleToggleDetails}
                    className="flex items-center gap-1 text-blue-400 hover:text-blue-300 mb-4"
                  >
                    {showDetails ? (
                      <>
                        <ChevronUp className="h-4 w-4" />
                        Hide preferences
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4" />
                        Customize preferences
                      </>
                    )}
                  </button>
                  
                  <AnimatePresence>
                    {showDetails && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-6"
                      >
                        <div className="space-y-3 bg-gray-800/50 p-4 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-white font-medium">Essential Cookies</p>
                              <p className="text-gray-400 text-sm">Required for the website to function properly</p>
                            </div>
                            <div className="relative">
                              <input
                                type="checkbox"
                                checked={preferences.essential}
                                disabled
                                className="sr-only"
                              />
                              <div className="w-10 h-5 bg-gray-600 rounded-full shadow-inner"></div>
                              <div className="absolute left-1 top-0.5 bg-blue-500 w-4 h-4 rounded-full transition"></div>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-white font-medium">Analytics Cookies</p>
                              <p className="text-gray-400 text-sm">Help us improve by tracking anonymous usage data</p>
                            </div>
                            <div className="relative">
                              <input
                                type="checkbox"
                                checked={preferences.analytics}
                                onChange={() => handlePreferenceChange('analytics')}
                                className="sr-only"
                                id="analytics-toggle"
                              />
                              <label
                                htmlFor="analytics-toggle"
                                className={`block w-10 h-5 rounded-full shadow-inner cursor-pointer transition ${
                                  preferences.analytics ? 'bg-blue-500' : 'bg-gray-600'
                                }`}
                              ></label>
                              <div
                                className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${
                                  preferences.analytics ? 'left-5 bg-white' : 'left-1 bg-gray-400'
                                }`}
                              ></div>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-white font-medium">Functional Cookies</p>
                              <p className="text-gray-400 text-sm">Enable enhanced functionality and personalization</p>
                            </div>
                            <div className="relative">
                              <input
                                type="checkbox"
                                checked={preferences.functional}
                                onChange={() => handlePreferenceChange('functional')}
                                className="sr-only"
                                id="functional-toggle"
                              />
                              <label
                                htmlFor="functional-toggle"
                                className={`block w-10 h-5 rounded-full shadow-inner cursor-pointer transition ${
                                  preferences.functional ? 'bg-blue-500' : 'bg-gray-600'
                                }`}
                              ></label>
                              <div
                                className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${
                                  preferences.functional ? 'left-5 bg-white' : 'left-1 bg-gray-400'
                                }`}
                              ></div>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-white font-medium">Marketing Cookies</p>
                              <p className="text-gray-400 text-sm">Used to deliver relevant ads and track ad campaign performance</p>
                            </div>
                            <div className="relative">
                              <input
                                type="checkbox"
                                checked={preferences.marketing}
                                onChange={() => handlePreferenceChange('marketing')}
                                className="sr-only"
                                id="marketing-toggle"
                              />
                              <label
                                htmlFor="marketing-toggle"
                                className={`block w-10 h-5 rounded-full shadow-inner cursor-pointer transition ${
                                  preferences.marketing ? 'bg-blue-500' : 'bg-gray-600'
                                }`}
                              ></label>
                              <div
                                className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${
                                  preferences.marketing ? 'left-5 bg-white' : 'left-1 bg-gray-400'
                                }`}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={handleAcceptSelected}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                    >
                      Accept Selected
                    </button>
                    <button
                      onClick={handleAcceptAll}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      Accept All
                    </button>
                  </div>
                </div>
                
                <button
                  onClick={() => setShowBanner(false)}
                  className="text-gray-400 hover:text-white p-1"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

export default CookieConsentBanner