import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { getDisplayUser } from '../utils/mask'
import RoleSwitcher, { getRoleAvatarColor, getRoleLabel } from './RoleSwitcher'

const navItems = [
  { to: '/dashboard', label: 'Дашборд', icon: 'grid' },
  { to: '/projects', label: 'Проекты', icon: 'folder' },
  { to: '/backlog', label: 'Бэклог', icon: 'list' },
  { to: '/chats', label: 'Чаты агентов', icon: 'chat' },
  { to: '/general-chat', label: 'Общий чат', icon: 'team' },
  { to: '/stats', label: 'Статистика', icon: 'chart' },
]

function NavIcon({ type }) {
  const icons = {
    grid: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <rect x="11" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <rect x="1" y="11" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <rect x="11" y="11" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
    folder: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M2 5.5C2 4.67 2.67 4 3.5 4H7L8.5 6H14.5C15.33 6 16 6.67 16 7.5V13.5C16 14.33 15.33 15 14.5 15H3.5C2.67 15 2 14.33 2 13.5V5.5Z" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
    team: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="6" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="12" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M1 15C1 12.5 3 11 6 11C9 11 11 12.5 11 15M7 15C7 12.5 9 11 12 11C15 11 17 12.5 17 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    list: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M6 5H16M6 9H16M6 13H16M2 5H2.01M2 9H2.01M2 13H2.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    chat: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M15 9C15 12.31 12.09 15 8.5 15C7.67 15 6.88 14.83 6.17 14.53L2 16L3.47 12.17C2.83 11.33 2.5 10.2 2.5 9C2.5 5.69 5.41 3 9 3C12.59 3 15 5.69 15 9Z" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
    chart: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M3 15V9M7 15V5M11 15V7M15 15V3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  }
  return icons[type] || null
}

export default function Sidebar() {
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

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className="w-[260px] min-h-screen bg-dark-sidebar flex flex-col shrink-0">
      <div className="px-6 pt-7 pb-5 flex flex-col gap-8">
        <Link to="/dashboard" className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #3B82F6 100%)' }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 2L15 6V12L9 16L3 12V6L9 2Z" stroke="white" strokeWidth="1.5" />
            </svg>
          </div>
          <span className="text-base font-inter-bold text-white">IT Team</span>
        </Link>

        <nav className="flex flex-col gap-1">
          <p className="text-[11px] font-inter-semibold text-gray-500 tracking-wider mb-2 px-3">
            РАБОЧЕЕ ПРОСТРАНСТВО
          </p>
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
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

      <div className="mt-auto px-6 py-5 border-t border-dark-border flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-inter-semibold text-white shrink-0 transition-colors"
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
    </aside>
  )
}
