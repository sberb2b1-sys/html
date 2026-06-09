export const baseNavItems = [
  { to: '/dashboard', label: 'Дашборд', icon: 'grid' },
  { to: '/projects', label: 'Проекты', icon: 'folder' },
  { to: '/backlog', label: 'Бэклог', icon: 'list' },
  { to: '/chats', label: 'Чаты агентов', icon: 'chat' },
  { to: '/general-chat', label: 'Общий чат', icon: 'team' },
  { to: '/stats', label: 'Статистика', icon: 'chart' },
  { to: '/demo', label: 'Демо', icon: 'video' },
]

export const poNavItems = [
  { to: '/admin/agents', label: 'Агенты', icon: 'agents' },
]

export function getNavItems(userRole) {
  return userRole === 'po'
    ? [...baseNavItems.slice(0, 4), ...poNavItems, ...baseNavItems.slice(4)]
    : baseNavItems
}

export function NavIcon({ type }) {
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
    video: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="2" y="4" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M12 7L16 5V13L12 11V7Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    ),
    agents: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M3 16C3 13 5.5 11 9 11C12.5 11 15 13 15 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  }
  return icons[type] || null
}
