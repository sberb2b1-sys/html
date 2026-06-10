import { useEffect, useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import TaskCard, { TaskCardOverlay } from '../components/TaskCard'
import EditTaskModal from '../components/EditTaskModal'
import CreateTaskModal from '../components/CreateTaskModal'
import ConfirmDialog from '../components/ConfirmDialog'
import { COLUMNS } from '../mocks/tasks'
import { useStore } from '../store/useStore'

const columnColors = {
  todo: 'border-t-gray-500',
  in_progress: 'border-t-status-yellow',
  done: 'border-t-status-green',
}

function KanbanColumn({ column, tasks, agents, sprints, onEdit, onDelete, onAssignSprint }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id })
  const taskIds = tasks.map((t) => t.id)

  return (
    <div className="w-[320px] flex flex-col shrink-0">
      <div className={`flex items-center justify-between mb-4 pb-3 border-t-2 ${columnColors[column.id]} pt-3`}>
        <h3 className="text-sm font-inter-semibold text-white">{column.title}</h3>
        <span className="text-xs text-gray-500 bg-dark-card px-2 py-0.5 rounded-full">
          {tasks.length}
        </span>
      </div>
      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={`flex flex-col gap-3 flex-1 min-h-[200px] rounded-xl p-2 transition-colors duration-200 ${
            isOver ? 'bg-[rgba(124,58,237,0.12)] ring-1 ring-accent-purple/30' : 'bg-dark-sidebar/50'
          }`}
        >
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              agents={agents}
              sprints={sprints}
              onEdit={onEdit}
              onDelete={onDelete}
              onAssignSprint={onAssignSprint}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  )
}

export default function BacklogPage() {
  const { projectId, project } = useOutletContext()
  const tasks = useStore((s) => s.tasks)
  const sprints = useStore((s) => s.sprints)
  const getProjectAgents = useStore((s) => s.getProjectAgents)
  const loadTasks = useStore((s) => s.loadTasks)
  const loadProjectAgents = useStore((s) => s.loadProjectAgents)
  const loadSprints = useStore((s) => s.loadSprints)
  const agents = getProjectAgents(projectId)
  const projectSprints = useMemo(
    () => sprints.filter((s) => s.projectId === projectId),
    [sprints, projectId]
  )
  const projectTasks = useMemo(
    () =>
      tasks.filter(
        (t) =>
          t.projectId === projectId &&
          !['pending_approval', 'waiting_approval', 'approved', 'rejected'].includes(t.status)
      ),
    [tasks, projectId]
  )
  const assignTaskSprint = useStore((s) => s.assignTaskSprint)
  const updateTaskStatus = useStore((s) => s.updateTaskStatus)
  const reorderColumn = useStore((s) => s.reorderColumn)
  const createTask = useStore((s) => s.createTask)
  const updateTask = useStore((s) => s.updateTask)
  const deleteTask = useStore((s) => s.deleteTask)

  useEffect(() => {
    loadTasks(projectId)
    loadProjectAgents(projectId)
    loadSprints(projectId)
  }, [projectId, loadTasks, loadProjectAgents, loadSprints])

  const [editingTask, setEditingTask] = useState(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [activeTaskId, setActiveTaskId] = useState(null)
  const [agentFilter, setAgentFilter] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)

  const filteredTasks = useMemo(() => {
    if (!agentFilter) return projectTasks
    return projectTasks.filter(
      (t) =>
        t.assigneeAgentId === agentFilter ||
        t.assignee === agents.find((a) => a.id === agentFilter)?.name
    )
  }, [projectTasks, agentFilter, agents])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  )

  const activeTask = activeTaskId ? filteredTasks.find((t) => t.id === activeTaskId) : null

  const handleDragStart = (event) => setActiveTaskId(event.active.id)

  const handleDragEnd = (event) => {
    const { active, over } = event
    setActiveTaskId(null)
    if (!over || active.id === over.id) return

    const activeId = active.id
    const activeItem = projectTasks.find((t) => t.id === activeId)
    if (!activeItem) return

    const columnIds = COLUMNS.map((c) => c.id)

    if (columnIds.includes(over.id)) {
      if (activeItem.status !== over.id) {
        updateTaskStatus(activeId, over.id)
      }
      return
    }

    const overItem = projectTasks.find((t) => t.id === over.id)
    if (!overItem) return

    if (activeItem.status === overItem.status) {
      const columnTasks = projectTasks.filter((t) => t.status === activeItem.status)
      const oldIndex = columnTasks.findIndex((t) => t.id === activeId)
      const newIndex = columnTasks.findIndex((t) => t.id === over.id)
      if (oldIndex !== newIndex) {
        reorderColumn(activeItem.status, arrayMove(columnTasks, oldIndex, newIndex))
      }
      return
    }

    updateTaskStatus(activeId, overItem.status)
  }

  const handleCreateTask = async (data) => {
    const ok = await createTask({ ...data, projectId: data.projectId || projectId })
    if (ok) {
      setCreateOpen(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    if (editingTask?.id === deleteTarget) setEditingTask(null)
    await deleteTask(deleteTarget)
    setDeleteTarget(null)
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="px-8 py-5 border-b border-dark-border flex items-center justify-between">
        <div>
          <h1 className="text-xl font-inter-bold text-white">Бэклог</h1>
          <p className="text-sm text-gray-500 mt-1">{project?.name}</p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setCreateOpen(true)}>
          Новая задача
        </button>
      </div>

      <div className="px-8 py-4 border-b border-dark-border flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Агент:</span>
          <select
            value={agentFilter}
            onChange={(e) => setAgentFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-dark-border bg-dark-card text-sm text-gray-300 outline-none focus:border-accent-purple/50"
          >
            <option value="">Все агенты</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
        {agentFilter && (
          <button
            type="button"
            onClick={() => setAgentFilter('')}
            className="text-xs text-accent-violet hover:underline"
          >
            Сбросить фильтр
          </button>
        )}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveTaskId(null)}
      >
        <div className="flex-1 overflow-x-auto p-8">
          <div className="flex gap-4 h-full min-w-max">
            {COLUMNS.map((column) => {
              const columnTasks = filteredTasks.filter((t) => t.status === column.id)
              return (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  tasks={columnTasks}
                  agents={agents}
                  sprints={projectSprints}
                  onEdit={setEditingTask}
                  onDelete={setDeleteTarget}
                  onAssignSprint={assignTaskSprint}
                />
              )
            })}
          </div>
        </div>

        <DragOverlay dropAnimation={{ duration: 200, easing: 'ease' }}>
          {activeTask ? <TaskCardOverlay task={activeTask} agents={agents} /> : null}
        </DragOverlay>
      </DndContext>

      <CreateTaskModal
        open={createOpen}
        agents={agents}
        projects={project ? [project] : []}
        sprints={projectSprints}
        defaultProjectId={projectId}
        onClose={() => setCreateOpen(false)}
        onSave={handleCreateTask}
      />

      <EditTaskModal
        open={!!editingTask}
        task={editingTask}
        agents={agents}
        sprints={projectSprints}
        onClose={() => setEditingTask(null)}
        onSave={async (updates) => {
          if (editingTask) {
            const ok = await updateTask(editingTask.id, updates)
            if (ok !== false) setEditingTask(null)
          }
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Удалить задачу?"
        message="Задача будет удалена без возможности восстановления."
        confirmLabel="Удалить"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
