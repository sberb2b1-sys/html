import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import toast from 'react-hot-toast'
import { sprints as sprintsApi } from '../api/client'
import { mapSprintFromApi } from '../api/mappers'
import { useStore } from '../store/useStore'

const SPRINT_ZONE = 'sprint-tasks'
const BACKLOG_ZONE = 'backlog-tasks'

function DraggableTask({ task, zone }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `${zone}:${task.id}`,
    data: { task, zone },
  })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
      }}
      className="card-border p-3 flex items-center gap-3 cursor-grab active:cursor-grabbing"
      {...attributes}
      {...listeners}
    >
      <span className="text-sm text-white flex-1">{task.title}</span>
      <span className="text-xs text-gray-500 shrink-0">{task.status}</span>
    </div>
  )
}

function DropColumn({ id, title, count, children }) {
  const { setNodeRef, isOver } = useDroppable({ id })
  return (
    <div className="flex-1 min-w-[280px] flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-inter-semibold text-white">{title}</h3>
        <span className="text-xs text-gray-500 bg-dark-card px-2 py-0.5 rounded-full">{count}</span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex flex-col gap-2 min-h-[320px] rounded-xl p-3 transition-colors ${
          isOver ? 'bg-[rgba(124,58,237,0.12)] ring-1 ring-accent-purple/30' : 'bg-dark-sidebar/50'
        }`}
      >
        {children}
      </div>
    </div>
  )
}

export default function SprintPage() {
  const { projectId, sprintId } = useParams()
  const projectNumId = Number(projectId)
  const sprintNumId = Number(sprintId)

  const projects = useStore((s) => s.projects)
  const tasks = useStore((s) => s.tasks)
  const loadProjects = useStore((s) => s.loadProjects)
  const loadTasks = useStore((s) => s.loadTasks)
  const loadSprints = useStore((s) => s.loadSprints)
  const assignTaskSprint = useStore((s) => s.assignTaskSprint)

  const [sprint, setSprint] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState([])
  const [activeDrag, setActiveDrag] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  )

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      await Promise.all([loadProjects(), loadTasks(projectNumId), loadSprints(projectNumId)])
      try {
        const raw = await sprintsApi.getById(sprintNumId)
        if (!cancelled) setSprint(mapSprintFromApi(raw))
      } catch {
        if (!cancelled) setSprint(null)
      }
      if (!cancelled) setIsLoading(false)
    }

    if (!Number.isNaN(projectNumId) && !Number.isNaN(sprintNumId)) {
      load()
    }

    return () => {
      cancelled = true
    }
  }, [projectNumId, sprintNumId, loadProjects, loadTasks, loadSprints])

  const project = projects.find((p) => p.id === projectNumId)

  const sprintTasks = useMemo(
    () => tasks.filter((t) => t.projectId === projectNumId && t.sprintId === sprintNumId),
    [tasks, projectNumId, sprintNumId]
  )

  const backlogTasks = useMemo(
    () => tasks.filter((t) => t.projectId === projectNumId && t.sprintId !== sprintNumId),
    [tasks, projectNumId, sprintNumId]
  )

  const toggleSelect = (taskId) => {
    setSelectedIds((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    )
  }

  const bulkAddToSprint = async () => {
    if (!selectedIds.length) {
      toast.error('Выберите задачи')
      return
    }
    const count = selectedIds.length
    await Promise.all(
      selectedIds.map((id) => assignTaskSprint(id, sprintNumId, { silent: true }))
    )
    setSelectedIds([])
    toast.success(`Добавлено задач: ${count}`)
  }

  const handleDragEnd = async (event) => {
    const { active, over } = event
    setActiveDrag(null)
    if (!over) return

    const task = active.data.current?.task
    const fromZone = active.data.current?.zone
    if (!task) return

    const resolveZone = (id) => {
      const str = String(id)
      if (str === SPRINT_ZONE || str.startsWith(`${SPRINT_ZONE}:`)) return SPRINT_ZONE
      if (str === BACKLOG_ZONE || str.startsWith(`${BACKLOG_ZONE}:`)) return BACKLOG_ZONE
      return null
    }

    const toZone = resolveZone(over.id)
    if (toZone === SPRINT_ZONE && fromZone === BACKLOG_ZONE) {
      await assignTaskSprint(task.id, sprintNumId, { silent: true })
      toast.success('Задача добавлена в спринт')
    } else if (toZone === BACKLOG_ZONE && fromZone === SPRINT_ZONE) {
      await assignTaskSprint(task.id, null, { silent: true })
      toast.success('Задача убрана из спринта')
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <p className="text-sm text-gray-500">Загрузка спринта...</p>
      </div>
    )
  }

  if (!sprint || !project) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center gap-4 p-8">
        <p className="text-gray-400">Спринт не найден</p>
        <Link to={`/projects/${projectId}`} className="text-accent-violet hover:underline text-sm">
          ← К проекту
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="px-8 py-5 border-b border-dark-border">
        <Link
          to={`/projects/${projectId}`}
          className="text-sm text-gray-500 hover:text-accent-violet mb-3 inline-block"
        >
          ← {project.name}
        </Link>
        <h1 className="text-xl font-inter-bold text-white">{sprint.name}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {sprint.startDate} — {sprint.endDate} • {sprint.status}
        </p>
        {sprint.description && (
          <p className="text-sm text-gray-400 mt-2 max-w-2xl">{sprint.description}</p>
        )}
      </div>

      <div className="px-8 py-4 border-b border-dark-border flex items-center gap-3">
        <button
          type="button"
          onClick={bulkAddToSprint}
          disabled={!selectedIds.length}
          className="btn-primary py-2 text-sm disabled:opacity-50"
        >
          Добавить выбранные в спринт ({selectedIds.length})
        </button>
        <p className="text-xs text-gray-500">Или перетащите задачи между колонками</p>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={(e) => setActiveDrag(e.active.data.current?.task || null)}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveDrag(null)}
      >
        <div className="flex-1 overflow-auto p-8">
          <div className="flex gap-6 min-w-max">
            <DropColumn id={SPRINT_ZONE} title="Задачи спринта" count={sprintTasks.length}>
              {sprintTasks.length === 0 ? (
                <p className="text-xs text-gray-500 p-2">Перетащите задачи сюда</p>
              ) : (
                sprintTasks.map((task) => (
                  <DraggableTask key={task.id} task={task} zone={SPRINT_ZONE} />
                ))
              )}
            </DropColumn>

            <DropColumn id={BACKLOG_ZONE} title="Доступные задачи" count={backlogTasks.length}>
              {backlogTasks.map((task) => (
                <div key={task.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(task.id)}
                    onChange={() => toggleSelect(task.id)}
                    className="shrink-0"
                  />
                  <div className="flex-1">
                    <DraggableTask task={task} zone={BACKLOG_ZONE} />
                  </div>
                </div>
              ))}
            </DropColumn>
          </div>
        </div>

        <DragOverlay>
          {activeDrag ? (
            <div className="card-border p-3 shadow-xl opacity-90">
              <span className="text-sm text-white">{activeDrag.title}</span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
