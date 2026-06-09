import { useState } from 'react'
import toast from 'react-hot-toast'
import Modal from './Modal'

const STATUSES = [
  { value: 'planning', label: 'Планирование' },
  { value: 'active', label: 'Активный' },
  { value: 'completed', label: 'Завершён' },
]

export default function SprintsManager({
  projectId,
  sprints,
  tasks,
  onCreateSprint,
  onAssignTaskSprint,
}) {
  const [modalOpen, setModalOpen] = useState(false)
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedSprintId, setSelectedSprintId] = useState(null)

  const projectSprints = sprints.filter((s) => s.projectId === projectId)
  const sprintTasks = selectedSprintId
    ? tasks.filter((t) => t.projectId === projectId && t.sprintId === selectedSprintId)
    : []

  const handleCreate = async () => {
    if (!name.trim() || !startDate || !endDate) {
      toast.error('Заполните все поля спринта')
      return
    }
    await onCreateSprint({
      projectId,
      name: name.trim(),
      startDate,
      endDate,
      status: 'planning',
    })
    setModalOpen(false)
    setName('')
    setStartDate('')
    setEndDate('')
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-inter-semibold text-white">Спринты проекта</h2>
        <button type="button" className="btn-primary py-2 text-sm" onClick={() => setModalOpen(true)}>
          + Новый спринт
        </button>
      </div>

      {projectSprints.length === 0 ? (
        <p className="text-sm text-gray-500">Спринтов пока нет</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {projectSprints.map((sprint) => (
            <button
              key={sprint.id}
              type="button"
              onClick={() => setSelectedSprintId(sprint.id)}
              className={`card-border p-4 text-left transition-colors ${
                selectedSprintId === sprint.id ? 'border-accent-purple/50 bg-[rgba(124,58,237,0.08)]' : ''
              }`}
            >
              <p className="text-sm font-inter-medium text-white">{sprint.name}</p>
              <p className="text-xs text-gray-500 mt-1">
                {sprint.startDate} — {sprint.endDate}
              </p>
              <span className="status-badge mt-2 inline-block">{sprint.status}</span>
            </button>
          ))}
        </div>
      )}

      {selectedSprintId && (
        <div>
          <h3 className="text-sm font-inter-semibold text-white mb-3">Задачи спринта</h3>
          {sprintTasks.length === 0 ? (
            <p className="text-sm text-gray-500">Нет задач в этом спринте</p>
          ) : (
            <div className="flex flex-col gap-2">
              {sprintTasks.map((task) => (
                <div key={task.id} className="card-border p-3 flex items-center justify-between">
                  <span className="text-sm text-white">{task.title}</span>
                  <span className="text-xs text-gray-500">{task.status}</span>
                </div>
              ))}
            </div>
          )}

          <h3 className="text-sm font-inter-semibold text-white mt-6 mb-3">Привязать задачу</h3>
          <div className="flex flex-col gap-2">
            {tasks
              .filter((t) => t.projectId === projectId)
              .map((task) => (
                <div key={task.id} className="card-border p-3 flex items-center justify-between gap-3">
                  <span className="text-sm text-white truncate">{task.title}</span>
                  <select
                    value={task.sprintId || ''}
                    onChange={(e) =>
                      onAssignTaskSprint(task.id, e.target.value ? Number(e.target.value) : null)
                    }
                    className="px-2 py-1 rounded-lg border border-dark-border bg-dark-card text-xs text-gray-300"
                  >
                    <option value="">Без спринта</option>
                    {projectSprints.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              ))}
          </div>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Новый спринт">
        <div className="flex flex-col gap-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Название спринта"
            className="px-4 py-3 rounded-xl border border-dark-border bg-dark-card text-sm text-white outline-none"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-4 py-3 rounded-xl border border-dark-border bg-dark-card text-sm text-white outline-none"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-4 py-3 rounded-xl border border-dark-border bg-dark-card text-sm text-white outline-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="flex-1 px-4 py-2.5 rounded-lg border border-dark-border text-sm text-gray-400">
              Отмена
            </button>
            <button type="button" onClick={handleCreate} className="flex-1 btn-primary justify-center py-2.5">
              Создать
            </button>
          </div>
        </div>
      </Modal>
    </section>
  )
}
