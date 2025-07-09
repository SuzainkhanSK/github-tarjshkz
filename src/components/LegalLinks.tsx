import React from 'react'
import { Link } from 'react-router-dom'

interface LegalLinksProps {
  className?: string
  linkClassName?: string
}

const LegalLinks: React.FC<LegalLinksProps> = ({ 
  className = "flex flex-wrap gap-4 text-sm text-gray-400", 
  linkClassName = "hover:text-gray-300 transition-colors" 
}) => {
  return (
    <div className={className}>
      <Link to="/legal/privacy-policy" className={linkClassName}>
        Privacy Policy
      </Link>
      <Link to="/legal/terms-conditions" className={linkClassName}>
        Terms & Conditions
      </Link>
      <Link to="/legal/refund-policy" className={linkClassName}>
        Refund Policy
      </Link>
      <Link to="/legal/cookie-policy" className={linkClassName}>
        Cookie Policy
      </Link>
      <Link to="/legal/disclaimer" className={linkClassName}>
        Disclaimer
      </Link>
    </div>
  )
}

export default LegalLinks