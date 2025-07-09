import React from 'react'
import { motion } from 'framer-motion'
import { Cookie, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

const CookiePolicyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-xl"
        >
          <div className="flex items-center gap-3 mb-8">
            <Cookie className="h-8 w-8 text-yellow-400" />
            <h1 className="text-3xl font-bold text-white">Cookie Policy</h1>
          </div>

          <div className="prose prose-invert max-w-none text-gray-300">
            <p className="text-lg">Last Updated: June 15, 2025</p>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">1. What Are Cookies</h2>
            <p>
              Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and provide information to the website owners.
            </p>
            <p>
              Cookies allow us to recognize your device and provide you with a personalized experience. They are also used to help ensure the proper functioning of our website and services.
            </p>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">2. Types of Cookies We Use</h2>
            <p>We use the following types of cookies on our website:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong className="text-white">Essential Cookies:</strong> These cookies are necessary for the website to function properly. They enable core functionality such as security, network management, and account access. You cannot opt out of these cookies.
              </li>
              <li>
                <strong className="text-white">Preference Cookies:</strong> These cookies enable us to remember information that changes the way the website behaves or looks, such as your preferred language or the region you are in.
              </li>
              <li>
                <strong className="text-white">Analytics Cookies:</strong> These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously. This helps us improve our website and services.
              </li>
              <li>
                <strong className="text-white">Functional Cookies:</strong> These cookies enable enhanced functionality and personalization, such as remembering your preferences and settings.
              </li>
              <li>
                <strong className="text-white">Session Cookies:</strong> These cookies are used to maintain your session while you use our services, such as keeping you logged in during your visit.
              </li>
            </ul>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">3. Specific Cookies We Use</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white/5 border border-white/10 rounded-lg">
                <thead>
                  <tr className="bg-white/10">
                    <th className="px-4 py-2 text-left text-white">Cookie Name</th>
                    <th className="px-4 py-2 text-left text-white">Purpose</th>
                    <th className="px-4 py-2 text-left text-white">Duration</th>
                    <th className="px-4 py-2 text-left text-white">Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  <tr>
                    <td className="px-4 py-2">sb-auth-token</td>
                    <td className="px-4 py-2">Authentication</td>
                    <td className="px-4 py-2">Session</td>
                    <td className="px-4 py-2">Essential</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">paz_preferences</td>
                    <td className="px-4 py-2">User preferences</td>
                    <td className="px-4 py-2">1 year</td>
                    <td className="px-4 py-2">Preference</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">_ga</td>
                    <td className="px-4 py-2">Google Analytics</td>
                    <td className="px-4 py-2">2 years</td>
                    <td className="px-4 py-2">Analytics</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">_gid</td>
                    <td className="px-4 py-2">Google Analytics</td>
                    <td className="px-4 py-2">24 hours</td>
                    <td className="px-4 py-2">Analytics</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">paz_cache</td>
                    <td className="px-4 py-2">Performance cache</td>
                    <td className="px-4 py-2">30 days</td>
                    <td className="px-4 py-2">Functional</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">4. How to Manage Cookies</h2>
            <p>
              Most web browsers allow you to control cookies through their settings preferences. However, if you limit the ability of websites to set cookies, you may worsen your overall user experience and/or lose access to certain functionalities on our website.
            </p>
            <p>
              To manage cookies through your browser settings:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong className="text-white">Chrome:</strong> Settings → Privacy and Security → Cookies and other site data
              </li>
              <li>
                <strong className="text-white">Firefox:</strong> Options → Privacy & Security → Cookies and Site Data
              </li>
              <li>
                <strong className="text-white">Safari:</strong> Preferences → Privacy → Cookies and website data
              </li>
              <li>
                <strong className="text-white">Edge:</strong> Settings → Cookies and site permissions → Cookies and site data
              </li>
            </ul>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">5. Third-Party Cookies</h2>
            <p>
              In addition to our own cookies, we may also use various third-party cookies to report usage statistics, deliver advertisements, and so on. These cookies may be set when you visit our website or when you interact with certain features.
            </p>
            <p>
              Third-party services we use that may set cookies include:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Google Analytics (for website analytics)</li>
              <li>Supabase (for authentication and database services)</li>
              <li>Social media platforms (for sharing functionality)</li>
            </ul>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">6. Changes to This Cookie Policy</h2>
            <p>
              We may update our Cookie Policy from time to time. We will notify you of any changes by posting the new Cookie Policy on this page and updating the "Last Updated" date.
            </p>
            <p>
              You are advised to review this Cookie Policy periodically for any changes. Changes to this Cookie Policy are effective when they are posted on this page.
            </p>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">7. Contact Us</h2>
            <p>
              If you have any questions about our Cookie Policy, please contact us at:
            </p>
            <p className="mt-2">
              <strong className="text-white">Email:</strong> privacy@premiumaccesszone.com<br />
              <strong className="text-white">Address:</strong> Premium Access Zone, 123 Digital Street, Internet City, 10001
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default CookiePolicyPage