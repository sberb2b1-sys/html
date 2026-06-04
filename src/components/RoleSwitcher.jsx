import { useStore } from '../store/useStore'

const ROLES = [
  { id: 'po', label: 'Product Owner (PO)', color: '#7C3AED' },
  { id: 'observer', label: 'Наблюдатель (Observer)', color: '#6B7280' },
]

export default function RoleSwitcher({ compact = false }) {
  const userRole = useStore((s) => s.userRole)
  const setUserRole = useStore((s) => s.setUserRole)

  const current = ROLES.find((r) => r.id === userRole) || ROLES[0]

  if (compact) {
    return (
      <select
        value={userRole}
        onChange={(e) => setUserRole(e.target.value)}
        className="w-full px-3 py-2 rounded-lg border border-dark-border bg-dark-card text-xs text-gray-300 outline-none focus:border-accent-purple/50"
      >
        {ROLES.map((r) => (
          <option key={r.id} value={r.id}>{r.label}</option>
        ))}
      </select>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs text-gray-500">Роль (демо)</span>
      <div className="flex gap-2">
        {ROLES.map((role) => (
          <button
            key={role.id}
            type="button"
            onClick={() => setUserRole(role.id)}
            className={`flex-1 px-3 py-2 rounded-lg text-xs border transition-colors ${
              userRole === role.id
                ? 'border-accent-purple bg-[rgba(124,58,237,0.15)] text-white'
                : 'border-dark-border text-gray-400 hover:bg-dark-hover'
            }`}
          >
            {role.id === 'po' ? 'PO' : 'Observer'}
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-600">Текущая: {current.label}</p>
    </div>
  )
}

export function getRoleAvatarColor(userRole) {
  return userRole === 'observer' ? '#6B7280' : '#7C3AED'
}

export function getRoleLabel(userRole) {
  return userRole === 'observer' ? 'Наблюдатель' : 'Product Owner'
}
