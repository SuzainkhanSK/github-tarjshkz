import React from 'react'
import { motion } from 'framer-motion'
import { FileText, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

const TermsConditionsPage: React.FC = () => {
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
            <FileText className="h-8 w-8 text-purple-400" />
            <h1 className="text-3xl font-bold text-white">Terms and Conditions</h1>
          </div>

          <div className="prose prose-invert max-w-none text-gray-300">
            <p className="text-lg">Last Updated: June 15, 2025</p>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">1. Agreement to Terms</h2>
            <p>
              These Terms and Conditions constitute a legally binding agreement made between you and Premium Access Zone ("we," "us," or "our"), concerning your access to and use of the Premium Access Zone website and services.
            </p>
            <p>
              By accessing or using our website, you agree to be bound by these Terms. If you disagree with any part of the terms, you may not access the website or use our services.
            </p>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">2. User Accounts</h2>
            <p>
              When you create an account with us, you must provide accurate, complete, and current information. You are responsible for safeguarding the password and for all activities that occur under your account.
            </p>
            <p>
              You agree to notify us immediately of any unauthorized use of your account or any other breach of security. We will not be liable for any loss or damage arising from your failure to comply with this section.
            </p>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">3. Points System</h2>
            <p>
              Our platform operates on a points-based system that allows users to earn and redeem points for various rewards. Points have no monetary value and cannot be exchanged for cash.
            </p>
            <p>
              We reserve the right to modify, suspend, or terminate the points system at any time without prior notice. Points may expire after a certain period of inactivity, as specified in our platform.
            </p>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">4. Redemption of Rewards</h2>
            <p>
              Redemption of points for rewards is subject to availability and verification. We do not guarantee the availability of specific rewards or subscription services.
            </p>
            <p>
              Processing of redemption requests typically takes 24-48 hours but may be subject to delays. We reserve the right to reject any redemption request that violates our terms or appears fraudulent.
            </p>
            <p>
              Once a redemption request is processed, points will be deducted from your account and cannot be refunded.
            </p>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">5. Intellectual Property</h2>
            <p>
              The website and its original content, features, and functionality are owned by Premium Access Zone and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
            </p>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">6. User Conduct</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Use our service for any illegal purpose or in violation of any local, state, national, or international law</li>
              <li>Violate or encourage others to violate the rights of third parties, including intellectual property rights</li>
              <li>Attempt to circumvent any security-related features of the website</li>
              <li>Engage in any activity that interferes with or disrupts the functioning of the website</li>
              <li>Use automated scripts, bots, or other means to artificially earn points</li>
              <li>Create multiple accounts to bypass daily limits or gain unfair advantages</li>
              <li>Sell, trade, or transfer rewards or account credentials to other users</li>
            </ul>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">7. Termination</h2>
            <p>
              We may terminate or suspend your account immediately, without prior notice or liability, for any reason, including if you breach the Terms and Conditions.
            </p>
            <p>
              Upon termination, your right to use the service will immediately cease. If you wish to terminate your account, you may simply discontinue using the service or delete your account through the profile settings.
            </p>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">8. Limitation of Liability</h2>
            <p>
              In no event shall Premium Access Zone, its directors, employees, partners, agents, suppliers, or affiliates be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the service.
            </p>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">9. Disclaimer</h2>
            <p>
              Premium Access Zone is not affiliated with, endorsed by, or sponsored by any of the third-party subscription services offered as rewards on our platform. All product names, logos, and brands are property of their respective owners.
            </p>
            <p>
              Your use of the service is at your sole risk. The service is provided on an "AS IS" and "AS AVAILABLE" basis. The service is provided without warranties of any kind, whether express or implied.
            </p>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">10. Changes to Terms</h2>
            <p>
              We reserve the right to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days' notice prior to any new terms taking effect.
            </p>
            <p>
              By continuing to access or use our service after those revisions become effective, you agree to be bound by the revised terms.
            </p>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">11. Contact Us</h2>
            <p>
              If you have any questions about these Terms, please contact us at:
            </p>
            <p className="mt-2">
              <strong className="text-white">Email:</strong> terms@premiumaccesszone.com<br />
              <strong className="text-white">Address:</strong> Premium Access Zone, 123 Digital Street, Internet City, 10001
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default TermsConditionsPage