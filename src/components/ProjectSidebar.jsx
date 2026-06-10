import { Link, useLocation, useParams } from 'react-router-dom'
import { useStore } from '../store/useStore'

const NAV = [
  { to: '', label: 'Обзор', end: true },
  { to: 'team', label: 'Команда' },
  { to: 'chats', label: 'Чаты' },
  { to: 'backlog', label: 'Бэклог' },
  { to: 'sprints', label: 'Спринты' },
  { to: 'approvals', label: 'Согласование' },
]

export default function ProjectSidebar({ project }) {
  const { projectId } = useParams()
  const location = useLocation()
  const userRole = useStore((s) => s.userRole)
  const logout = useStore((s) => s.logout)
  const base = `/projects/${projectId}`

  const isActive = (path, end) => {
    const full = path ? `${base}/${path}` : base
    if (end) return location.pathname === base || location.pathname === `${base}/`
    return location.pathname === full || location.pathname.startsWith(`${full}/`)
  }

  return (
    <aside className="w-60 shrink-0 border-r border-dark-border bg-dark-sidebar flex flex-col">
      <div className="p-4 border-b border-dark-border">
        <Link to="/holdings" className="text-xs text-gray-500 hover:text-accent-violet">
          ← Холдинг
        </Link>
        <h2 className="text-sm font-inter-semibold text-white mt-2 line-clamp-2">
          {project?.name || 'Проект'}
        </h2>
      </div>

      <nav className="flex-1 p-3 flex flex-col gap-1">
        {NAV.map((item) => (
          <Link
            key={item.to || 'index'}
            to={item.to ? `${base}/${item.to}` : base}
            className={`px-3 py-2 rounded-lg text-sm transition-colors ${
              isActive(item.to, item.end)
                ? 'bg-[rgba(124,58,237,0.15)] text-white font-inter-medium'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {item.label}
          </Link>
        ))}
        {userRole === 'po' && (
          <Link
            to={`${base}/agents`}
            className={`px-3 py-2 rounded-lg text-sm transition-colors ${
              isActive('agents')
                ? 'bg-[rgba(124,58,237,0.15)] text-white font-inter-medium'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Настройка агентов
          </Link>
        )}
      </nav>

      <div className="p-4 border-t border-dark-border">
        <button
          type="button"
          onClick={logout}
          className="w-full text-left text-sm text-gray-500 hover:text-white"
        >
          Выйти
        </button>
      </div>
    </aside>
  )
}
