import React from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

const DisclaimerPage: React.FC = () => {
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
            <AlertCircle className="h-8 w-8 text-red-400" />
            <h1 className="text-3xl font-bold text-white">Disclaimer</h1>
          </div>

          <div className="prose prose-invert max-w-none text-gray-300">
            <p className="text-lg">Last Updated: June 15, 2025</p>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">1. General Disclaimer</h2>
            <p>
              The information provided on Premium Access Zone is for general informational purposes only. All information on the site is provided in good faith, however, we make no representation or warranty of any kind, express or implied, regarding the accuracy, adequacy, validity, reliability, availability, or completeness of any information on the site.
            </p>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">2. No Affiliation with Subscription Services</h2>
            <p>
              <strong className="text-white">Premium Access Zone is not affiliated with, endorsed by, or sponsored by any of the third-party subscription services offered as rewards on our platform.</strong> All product names, logos, and brands are property of their respective owners.
            </p>
            <p>
              The subscription services mentioned on our platform, including but not limited to Netflix, YouTube Premium, Amazon Prime, Spotify, Disney+ Hotstar, and others, are registered trademarks of their respective companies. Our use of these names and logos is for identification purposes only and does not imply any endorsement or direct relationship with these companies.
            </p>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">3. Our Business Model</h2>
            <p>
              Premium Access Zone provides free premium subscriptions to users who earn points through our platform. Many users ask how we can offer these services for free. Here's how our business model works:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong className="text-white">Direct Purchases:</strong> We directly purchase subscriptions from the official websites or apps of the original brands using revenue generated from our platform.
              </li>
              <li>
                <strong className="text-white">Advertising Revenue:</strong> We earn income by displaying advertisements to users throughout our platform.
              </li>
              <li>
                <strong className="text-white">Affiliate Partnerships:</strong> We earn commissions through affiliate marketing when users sign up for certain services through our referral links.
              </li>
              <li>
                <strong className="text-white">Sponsored Content:</strong> We partner with brands for sponsored content and promotions within our platform.
              </li>
              <li>
                <strong className="text-white">Data Analytics:</strong> We analyze anonymized, aggregated user behavior data to improve our services and create value for advertising partners.
              </li>
              <li>
                <strong className="text-white">Volume Discounts:</strong> We purchase subscriptions in bulk at discounted rates from authorized resellers.
              </li>
            </ul>
            <p>
              When a user redeems their points for a subscription, we legally purchase that subscription from the official provider and deliver the activation details to the user. All subscriptions provided through our platform are legitimate, paid services obtained through proper channels.
            </p>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">4. No Guarantees</h2>
            <p>
              We do not guarantee the continuous availability of any particular reward or subscription service. The availability of rewards is subject to change without notice.
            </p>
            <p>
              While we strive to process redemption requests promptly, we cannot guarantee specific processing times. Redemption requests are typically processed within 24-48 hours but may be subject to delays.
            </p>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">5. External Links</h2>
            <p>
              Our website may contain links to external websites that are not provided or maintained by us. We do not guarantee the accuracy, relevance, timeliness, or completeness of any information on these external websites.
            </p>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">6. No Professional Advice</h2>
            <p>
              The information on our website is not intended as professional advice. Before making any decisions based on the information provided on our website, we recommend consulting with appropriate professionals.
            </p>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">7. Limitation of Liability</h2>
            <p>
              In no event shall Premium Access Zone, its directors, employees, partners, agents, suppliers, or affiliates be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Your access to or use of or inability to access or use the service</li>
              <li>Any conduct or content of any third party on the service</li>
              <li>Any content obtained from the service</li>
              <li>Unauthorized access, use, or alteration of your transmissions or content</li>
              <li>The unavailability or discontinuation of any reward or subscription service</li>
              <li>Delays in processing redemption requests</li>
            </ul>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">8. "AS IS" and "AS AVAILABLE" Disclaimer</h2>
            <p>
              The service is provided to you "AS IS" and "AS AVAILABLE" and with all faults and defects without warranty of any kind. To the maximum extent permitted under applicable law, we expressly disclaim all warranties, whether express, implied, statutory, or otherwise, with respect to the service.
            </p>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">9. Accuracy of Materials</h2>
            <p>
              The materials appearing on Premium Access Zone's website could include technical, typographical, or photographic errors. We do not warrant that any of the materials on our website are accurate, complete, or current. We may make changes to the materials contained on our website at any time without notice.
            </p>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">10. Changes to Disclaimer</h2>
            <p>
              We reserve the right to modify this disclaimer at any time. If we make material changes to this disclaimer, we will notify you by updating the date at the top of this page.
            </p>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">11. Contact Us</h2>
            <p>
              If you have any questions about this Disclaimer, please contact us at:
            </p>
            <p className="mt-2">
              <strong className="text-white">Email:</strong> legal@premiumaccesszone.com<br />
              <strong className="text-white">Address:</strong> Premium Access Zone, 123 Digital Street, Internet City, 10001
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default DisclaimerPage