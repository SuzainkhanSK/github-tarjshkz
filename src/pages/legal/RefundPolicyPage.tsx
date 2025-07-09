import React from 'react'
import { motion } from 'framer-motion'
import { RefreshCw, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

const RefundPolicyPage: React.FC = () => {
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
            <RefreshCw className="h-8 w-8 text-green-400" />
            <h1 className="text-3xl font-bold text-white">Refund & Cancellation Policy</h1>
          </div>

          <div className="prose prose-invert max-w-none text-gray-300">
            <p className="text-lg">Last Updated: June 15, 2025</p>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">1. Points System</h2>
            <p>
              Premium Access Zone operates on a points-based system where users earn points through various activities and can redeem these points for rewards. Please note that:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Points have no monetary value and cannot be exchanged for cash</li>
              <li>Points are non-transferable between accounts</li>
              <li>Points may expire after 12 months of account inactivity</li>
            </ul>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">2. Redemption Policy</h2>
            <p>
              When you redeem points for rewards such as premium subscriptions:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Points will be immediately deducted from your account</li>
              <li>Redemption requests are typically processed within 24-48 hours</li>
              <li>You will receive activation details via email once your request is processed</li>
              <li>All redemptions are final and cannot be reversed once processed</li>
            </ul>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">3. No-Refund Policy</h2>
            <p>
              Due to the nature of digital rewards and subscription services, we maintain a strict no-refund policy:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Points deducted for redemptions cannot be refunded once the redemption request is submitted</li>
              <li>Activated subscription codes cannot be returned or exchanged</li>
              <li>We cannot provide refunds for points spent on rewards that you later decide you do not want</li>
            </ul>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">4. Exceptions</h2>
            <p>
              In the following limited circumstances, we may consider refunding points to your account:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>If a redemption request fails due to technical issues on our end</li>
              <li>If the subscription service provided is demonstrably non-functional</li>
              <li>If you receive an incorrect subscription from what was advertised</li>
            </ul>
            <p>
              In such cases, please contact our support team within 48 hours of the redemption with details of the issue.
            </p>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">5. Cancellation of Redemption Requests</h2>
            <p>
              You may cancel a redemption request only if:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>The request is still in "pending" status</li>
              <li>The request has not yet been processed by our team</li>
            </ul>
            <p>
              To cancel a pending redemption request, please contact our support team immediately.
            </p>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">6. Account Termination</h2>
            <p>
              If you choose to delete your account:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>All accumulated points will be forfeited</li>
              <li>Pending redemption requests will be canceled</li>
              <li>No compensation will be provided for lost points or rewards</li>
            </ul>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">7. Service Availability</h2>
            <p>
              We strive to maintain continuous availability of our services, but we cannot guarantee uninterrupted access. We are not responsible for:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Temporary service outages or maintenance periods</li>
              <li>Changes to reward offerings or point requirements</li>
              <li>Discontinuation of specific subscription services by third-party providers</li>
            </ul>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">8. Changes to This Policy</h2>
            <p>
              We reserve the right to modify this Refund & Cancellation Policy at any time. Changes will be effective immediately upon posting to the website. Your continued use of our services following any changes indicates your acceptance of the updated policy.
            </p>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">9. Contact Us</h2>
            <p>
              If you have any questions about our Refund & Cancellation Policy, please contact us at:
            </p>
            <p className="mt-2">
              <strong className="text-white">Email:</strong> support@premiumaccesszone.com<br />
              <strong className="text-white">Address:</strong> Premium Access Zone, 123 Digital Street, Internet City, 10001
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default RefundPolicyPage