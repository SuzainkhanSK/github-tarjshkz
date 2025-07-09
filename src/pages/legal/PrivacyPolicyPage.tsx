import React from 'react'
import { motion } from 'framer-motion'
import { Shield, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

const PrivacyPolicyPage: React.FC = () => {
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
            <Shield className="h-8 w-8 text-blue-400" />
            <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
          </div>

          <div className="prose prose-invert max-w-none text-gray-300">
            <p className="text-lg">Last Updated: June 15, 2025</p>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">1. Introduction</h2>
            <p>
              Welcome to Premium Access Zone ("we," "our," or "us"). We respect your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our services.
            </p>
            <p>
              Please read this Privacy Policy carefully. If you do not agree with the terms of this Privacy Policy, please do not access the site or use our services.
            </p>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">2. Information We Collect</h2>
            <p>We collect several types of information from and about users of our website, including:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong className="text-white">Personal Information:</strong> Email address, name, phone number, country of residence, and profile image that you voluntarily provide when registering or using our services.
              </li>
              <li>
                <strong className="text-white">Usage Data:</strong> Information about how you use our website, services, and features, including points earned, games played, tasks completed, and redemption history.
              </li>
              <li>
                <strong className="text-white">Device Information:</strong> Information about your device, browser type, IP address, and operating system.
              </li>
              <li>
                <strong className="text-white">Cookies and Similar Technologies:</strong> We use cookies and similar tracking technologies to track activity on our website and hold certain information.
              </li>
            </ul>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">3. How We Use Your Information</h2>
            <p>We use the information we collect for various purposes, including to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide, maintain, and improve our services</li>
              <li>Process transactions and manage your account</li>
              <li>Send you service-related notifications and updates</li>
              <li>Respond to your comments, questions, and requests</li>
              <li>Monitor and analyze usage patterns and trends</li>
              <li>Protect against, identify, and prevent fraud and other illegal activity</li>
              <li>Comply with our legal obligations</li>
            </ul>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">4. Sharing Your Information</h2>
            <p>We may share your personal information with:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong className="text-white">Service Providers:</strong> Third-party vendors who perform services on our behalf, such as subscription providers, payment processors, and analytics providers.
              </li>
              <li>
                <strong className="text-white">Business Partners:</strong> Companies with whom we partner to offer joint promotional offers or related products and services.
              </li>
              <li>
                <strong className="text-white">Legal Requirements:</strong> When required by law or to protect our rights, privacy, safety, or property.
              </li>
            </ul>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">5. Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your personal information from unauthorized access, disclosure, alteration, and destruction. However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
            </p>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">6. Your Data Protection Rights</h2>
            <p>Depending on your location, you may have the following rights:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>The right to access your personal data</li>
              <li>The right to rectify inaccurate personal data</li>
              <li>The right to request deletion of your personal data</li>
              <li>The right to restrict processing of your personal data</li>
              <li>The right to data portability</li>
              <li>The right to object to processing of your personal data</li>
              <li>The right to withdraw consent</li>
            </ul>
            <p>
              To exercise these rights, please contact us using the information provided in the "Contact Us" section below.
            </p>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">7. Children's Privacy</h2>
            <p>
              Our services are not intended for individuals under the age of 16. We do not knowingly collect personal information from children under 16. If we learn we have collected personal information from a child under 16, we will delete that information as quickly as possible.
            </p>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">8. Changes to This Privacy Policy</h2>
            <p>
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. You are advised to review this Privacy Policy periodically for any changes.
            </p>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">9. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at:
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

export default PrivacyPolicyPage