import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { priorityColors } from '../mocks/tasks'

function resolveAgent(task, agents = []) {
  return agents.find(
    (a) => a.id === task.assigneeAgentId || a.name === task.assignee
  )
}

function TaskCardContent({
  task,
  agents = [],
  sprints = [],
  onEdit,
  onDelete,
  onAssignSprint,
  dragHandleProps,
}) {
  const agent = resolveAgent(task, agents)
  const projectSprints = task.projectId
    ? sprints.filter((s) => s.projectId === task.projectId)
    : []

  return (
    <>
      <div className="flex items-start justify-between gap-2">
        <div
          {...dragHandleProps}
          className={`flex-1 min-w-0 ${dragHandleProps ? 'cursor-grab active:cursor-grabbing' : ''}`}
        >
          <button
            type="button"
            onClick={() => onEdit?.(task)}
            className="text-sm font-inter-medium text-white leading-snug text-left hover:text-accent-violet transition-colors w-full"
          >
            {task.title}
          </button>
          {task.description && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{task.description}</p>
          )}
        </div>
        <span className={`status-badge shrink-0 ${priorityColors[task.priority] || ''}`}>
          {task.priority}
        </span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-gray-500 truncate max-w-[40%]">{task.project || '—'}</span>
        <div className="flex items-center gap-2 shrink-0 ml-auto">
          {task.projectId && projectSprints.length > 0 && onAssignSprint && (
            <select
              value={task.sprintId || ''}
              onChange={(e) => {
                e.stopPropagation()
                onAssignSprint(task.id, e.target.value ? Number(e.target.value) : null)
              }}
              onClick={(e) => e.stopPropagation()}
              className="px-1.5 py-0.5 rounded border border-dark-border bg-dark-card text-[10px] text-gray-400 max-w-[90px]"
              title="Спринт"
            >
              <option value="">Спринт</option>
              {projectSprints.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          )}
          {agent ? (
            <div className="flex items-center gap-1.5" title={agent.name}>
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-inter-semibold text-white"
                style={{ backgroundColor: agent.avatarColor }}
              >
                {agent.name.charAt(0)}
              </div>
              <span className="text-xs text-gray-400 max-w-[80px] truncate">{agent.name.split(' ')[0]}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5" title="Не назначен">
              <div className="w-6 h-6 rounded-full bg-gray-700/80 flex items-center justify-center text-[10px] text-gray-500 shrink-0">
                ?
              </div>
              <span className="text-xs text-gray-600">Не назначен</span>
            </div>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(task.id)
              }}
              className="text-xs text-gray-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
              title="Удалить"
            >
              🗑️
            </button>
          )}
        </div>
      </div>
    </>
  )
}

export function TaskCardOverlay({ task, agents = [] }) {
  return (
    <div className="card-border p-4 flex flex-col gap-3 shadow-xl shadow-accent-purple/30 rotate-2 scale-[1.02]">
      <TaskCardContent task={task} agents={agents} />
    </div>
  )
}

export default function TaskCard({ task, agents = [], sprints = [], onEdit, onDelete, onAssignSprint }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`card-border p-4 flex flex-col gap-3 touch-none group ${
        isDragging ? 'opacity-40' : ''
      }`}
    >
      <TaskCardContent
        task={task}
        agents={agents}
        sprints={sprints}
        onEdit={onEdit}
        onDelete={onDelete}
        onAssignSprint={onAssignSprint}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  )
}
