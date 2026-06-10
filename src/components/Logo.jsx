import { Link } from 'react-router-dom'
import logoUrl from '../assets/logo.svg'

export default function Logo({ className = '', showText = true, onClick }) {
  const content = (
    <>
      <img src={logoUrl} alt="IT Team" className="w-8 h-8 shrink-0" />
      {showText && (
        <span className="text-base font-inter-bold text-white">IT Team</span>
      )}
    </>
  )

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`flex items-center gap-2.5 ${className}`}>
        {content}
      </button>
    )
  }

  return (
    <Link to="/holdings" className={`flex items-center gap-2.5 ${className}`}>
      {content}
    </Link>
  )
}
