export default function AgentCard({ agent, compact = false, onClick }) {
  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg ${onClick ? 'cursor-pointer hover:bg-dark-hover transition-colors' : ''} ${compact ? '' : 'card-border'}`}
      onClick={() => onClick?.(agent)}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick(agent) : undefined}
    >
      <div className="relative shrink-0">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-inter-semibold text-white"
          style={{ backgroundColor: agent.avatarColor }}
        >
          {agent.name.charAt(0)}
        </div>
        {agent.online && (
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-status-green border-2 border-dark-card" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-inter-semibold text-white truncate">{agent.name}</p>
        <p className="text-xs text-gray-500 truncate">
          {compact ? agent.activity || agent.lastMessage : agent.roleShort || agent.role}
        </p>
      </div>

      {!compact && (
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="status-badge status-working">{agent.status}</span>
          {!compact && agent.tasksActive && (
            <span className="text-xs text-gray-500">{agent.tasksActive} задач</span>
          )}
        </div>
      )}

      {compact && agent.online && <span className="online-dot shrink-0" />}
    </div>
  )
}
