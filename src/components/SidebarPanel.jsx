import { Link, useLocation, useNavigate } from 'react-router-dom'
import Logo from './Logo'
import RoleSwitcher, { getRoleAvatarColor, getRoleLabel } from './RoleSwitcher'
import { getNavItems, NavIcon } from '../config/navItems'
import { useStore } from '../store/useStore'
import { getDisplayUser } from '../utils/mask'

export default function SidebarPanel({ onNavigate }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const currentUser = useStore((s) => s.currentUser)
  const userRole = useStore((s) => s.userRole)
  const maskPdn = useStore((s) => s.maskPdn)
  const toggleMaskPdn = useStore((s) => s.toggleMaskPdn)
  const logout = useStore((s) => s.logout)

  const { name: displayName, email: displayEmail } = getDisplayUser(currentUser, {
    enabled: maskPdn,
  })
  const avatarColor = getRoleAvatarColor(userRole)
  const roleLabel = getRoleLabel(userRole)
  const displayInitial = (currentUser?.name || displayName || '?').charAt(0).toUpperCase()
  const navItems = getNavItems(userRole)

  const handleLogout = () => {
    logout()
    navigate('/login')
    onNavigate?.()
  }

  const handleLogoClick = () => {
    navigate('/holdings')
    onNavigate?.()
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 md:px-6 pt-5 md:pt-7 pb-5 flex flex-col gap-6 md:gap-8 flex-1 overflow-y-auto">
        <Logo onClick={handleLogoClick} />

        <nav className="flex flex-col gap-1">
          <p className="text-[11px] font-inter-semibold text-gray-500 tracking-wider mb-2 px-3">
            РАБОЧЕЕ ПРОСТРАНСТВО
          </p>
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={`nav-item ${
                pathname === item.to || pathname.startsWith(`${item.to}/`)
                  ? 'nav-item-active'
                  : 'hover:bg-dark-hover hover:text-gray-200'
              }`}
            >
              <NavIcon type={item.icon} />
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="px-4 md:px-6 py-4 md:py-5 border-t border-dark-border flex flex-col gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-inter-semibold text-white shrink-0"
            style={{ backgroundColor: avatarColor }}
          >
            {displayInitial}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-inter-medium text-white truncate">{displayName}</p>
            <p className="text-xs truncate" style={{ color: avatarColor }}>{roleLabel}</p>
            <p className="text-xs text-gray-500 truncate">{displayEmail || '—'}</p>
          </div>
        </div>
        <RoleSwitcher compact />
        <label className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg border border-dark-border bg-dark-card cursor-pointer">
          <span className="text-xs text-gray-400">Маскировать ПДн</span>
          <input type="checkbox" checked={maskPdn} onChange={toggleMaskPdn} className="w-4 h-4 accent-accent-purple cursor-pointer" />
        </label>
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-dark-hover hover:text-red-400 transition-colors w-full"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 2H3.5A1.5 1.5 0 002 3.5v9A1.5 1.5 0 003.5 14H6M10 11L14 8M14 8L10 5M14 8H6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Выйти
        </button>
      </div>
    </div>
  )
}
