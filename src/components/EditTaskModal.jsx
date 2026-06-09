import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import Modal from './Modal'

const PRIORITIES = ['High', 'Medium', 'Low']

export default function EditTaskModal({
  open,
  task,
  agents = [],
  sprints = [],
  onClose,
  onSave,
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('Medium')
  const [assigneeAgentId, setAssigneeAgentId] = useState('')
  const [sprintId, setSprintId] = useState('')

  const projectSprints = useMemo(() => {
    if (!task?.projectId) return []
    return sprints.filter((s) => s.projectId === task.projectId)
  }, [sprints, task])

  useEffect(() => {
    if (task) {
      setTitle(task.title || '')
      setDescription(task.description || '')
      setPriority(task.priority || 'Medium')
      setAssigneeAgentId(task.assigneeAgentId || '')
      setSprintId(task.sprintId ? String(task.sprintId) : '')
    }
  }, [task])

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Введите название задачи')
      return
    }
    const ok = await onSave({
      title: title.trim(),
      description: description.trim(),
      priority,
      assigneeAgentId: assigneeAgentId || null,
      sprintId: sprintId ? Number(sprintId) : null,
    })
    if (ok !== false) {
      onClose()
    }
  }

  if (!open || !task) return null

  return (
    <Modal open={open} onClose={onClose} title="Редактировать задачу">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="edit-task-title" className="text-sm text-gray-400">Название задачи</label>
          <input
            id="edit-task-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="px-4 py-3 rounded-xl border border-dark-border bg-dark-card text-sm text-white outline-none focus:border-accent-purple/50"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="edit-task-desc" className="text-sm text-gray-400">Описание</label>
          <textarea
            id="edit-task-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="px-4 py-3 rounded-xl border border-dark-border bg-dark-card text-sm text-white placeholder:text-gray-500 outline-none focus:border-accent-purple/50 resize-none"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="edit-task-priority" className="text-sm text-gray-400">Приоритет</label>
          <select
            id="edit-task-priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="px-4 py-3 rounded-xl border border-dark-border bg-dark-card text-sm text-white outline-none focus:border-accent-purple/50"
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
        {task.projectId && projectSprints.length > 0 && (
          <div className="flex flex-col gap-2">
            <label htmlFor="edit-task-sprint" className="text-sm text-gray-400">Спринт</label>
            <select
              id="edit-task-sprint"
              value={sprintId}
              onChange={(e) => setSprintId(e.target.value)}
              className="px-4 py-3 rounded-xl border border-dark-border bg-dark-card text-sm text-white outline-none focus:border-accent-purple/50"
            >
              <option value="">Без спринта</option>
              {projectSprints.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.startDate} — {s.endDate})
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="flex flex-col gap-2">
          <label htmlFor="edit-task-agent" className="text-sm text-gray-400">Агент</label>
          <select
            id="edit-task-agent"
            value={assigneeAgentId}
            onChange={(e) => setAssigneeAgentId(e.target.value)}
            className="px-4 py-3 rounded-xl border border-dark-border bg-dark-card text-sm text-white outline-none focus:border-accent-purple/50"
          >
            <option value="">Не назначен</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg border border-dark-border text-sm text-gray-400 hover:bg-dark-hover">
            Отмена
          </button>
          <button type="button" onClick={handleSave} className="flex-1 btn-primary justify-center py-2.5">
            Сохранить
          </button>
        </div>
      </div>
    </Modal>
  )
}
