export default function ProjectCard({ project, onClick, onEdit, onDelete }) {
  return (
    <div
      className="card-border p-5 flex flex-col gap-4 cursor-pointer hover:border-accent-purple/50 transition-colors"
      onClick={() => onClick?.(project)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.(project)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.3) 0%, rgba(59,130,246,0.3) 100%)' }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M3 6.5C3 5.67 3.67 5 4.5 5H8L9.5 7H15.5C16.33 7 17 7.67 17 8.5V14.5C17 15.33 16.33 16 15.5 16H4.5C3.67 16 3 15.33 3 14.5V6.5Z" stroke="#7C6FF7" strokeWidth="1.5" />
            </svg>
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-inter-semibold text-white leading-tight">{project.name}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{project.subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {onEdit && (
            <button
              type="button"
              aria-label="Редактировать проект"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm hover:bg-dark-hover transition-colors"
              onClick={(e) => {
                e.stopPropagation()
                onEdit(project)
              }}
            >
              ✏️
            </button>
          )}
          <span className="status-badge status-working">{project.status}</span>
        </div>
      </div>

      <p className="text-sm text-gray-400 leading-relaxed line-clamp-2">{project.description}</p>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Прогресс</span>
          <span className="text-xs font-inter-semibold text-white">{project.progress}%</span>
        </div>
        <div className="h-1.5 bg-dark-border rounded-full overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${project.progress}%`,
              background: 'linear-gradient(90deg, #7C3AED 0%, #3B82F6 100%)',
            }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1.5V12.5M1.5 7H12.5" stroke="#6B7280" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          {project.tasksDone} задач выполнено
        </div>
        {onDelete && (
          <button
            type="button"
            className="text-xs text-red-400 hover:text-red-300 transition-colors"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(project)
            }}
          >
            🗑️ Удалить
          </button>
        )}
      </div>
    </div>
  )
}
