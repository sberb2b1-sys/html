import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import Modal from './Modal'

const PRIORITIES = ['High', 'Medium', 'Low']

export default function CreateTaskModal({
  open,
  agents = [],
  initialValues = null,
  onClose,
  onSave,
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('Medium')
  const [assigneeAgentId, setAssigneeAgentId] = useState('')

  useEffect(() => {
    if (open) {
      setTitle(initialValues?.title || '')
      setDescription(initialValues?.description || '')
      setPriority(initialValues?.priority || 'Medium')
      setAssigneeAgentId(
        initialValues?.assigneeAgentId || agents[0]?.id || ''
      )
    }
  }, [open, agents, initialValues])

  const handleSave = () => {
    if (!title.trim()) {
      toast.error('Введите название задачи')
      return
    }
    onSave({
      title: title.trim(),
      description: description.trim(),
      priority,
      assigneeAgentId: assigneeAgentId || null,
      status: 'todo',
    })
    onClose()
  }

  if (!open) return null

  return (
    <Modal open={open} onClose={onClose} title="Новая задача">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="new-task-title" className="text-sm text-gray-400">
            Название <span className="text-red-400">*</span>
          </label>
          <input
            id="new-task-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Что нужно сделать?"
            className="px-4 py-3 rounded-xl border border-dark-border bg-dark-card text-sm text-white placeholder:text-gray-500 outline-none focus:border-accent-purple/50"
            autoFocus
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="new-task-desc" className="text-sm text-gray-400">Описание</label>
          <textarea
            id="new-task-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Дополнительные детали..."
            className="px-4 py-3 rounded-xl border border-dark-border bg-dark-card text-sm text-white placeholder:text-gray-500 outline-none focus:border-accent-purple/50 resize-none"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="new-task-priority" className="text-sm text-gray-400">Приоритет</label>
          <select
            id="new-task-priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="px-4 py-3 rounded-xl border border-dark-border bg-dark-card text-sm text-white outline-none focus:border-accent-purple/50"
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="new-task-agent" className="text-sm text-gray-400">Агент</label>
          <select
            id="new-task-agent"
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
            Создать
          </button>
        </div>
      </div>
    </Modal>
  )
}
