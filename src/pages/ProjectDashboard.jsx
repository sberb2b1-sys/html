import { useMemo } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import ConfirmDialog from '../components/ConfirmDialog'
import { useStore } from '../store/useStore'
import { useState } from 'react'

function taskWord(count) {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) return 'задача'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'задачи'
  return 'задач'
}

export default function ProjectDashboard() {
  const { projectId, project } = useOutletContext()
  const navigate = useNavigate()
  const tasks = useStore((s) => s.tasks)
  const getProjectAgents = useStore((s) => s.getProjectAgents)
  const loadTasks = useStore((s) => s.loadTasks)
  const deleteProject = useStore((s) => s.deleteProject)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const projectTasks = useMemo(
    () => tasks.filter((t) => t.projectId === projectId),
    [tasks, projectId]
  )
  const agents = getProjectAgents(projectId)

  const handleDelete = async () => {
    await deleteProject(projectId)
    setDeleteOpen(false)
    navigate('/holdings')
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="px-8 py-5 border-b border-dark-border">
        <h1 className="text-xl font-inter-bold text-white">{project?.name}</h1>
        <p className="text-sm text-gray-500 mt-1">{project?.description || 'Без описания'}</p>
        <p className="text-xs text-gray-600 mt-2">
          {projectTasks.length} {taskWord(projectTasks.length)} • {agents.length} агентов •{' '}
          {project?.progress ?? 0}% выполнено
        </p>
        <div className="flex gap-2 mt-4">
          <button
            type="button"
            onClick={() => navigate(`/projects/${projectId}/backlog`)}
            className="btn-primary text-sm"
          >
            Открыть бэклог
          </button>
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className="px-4 py-2 rounded-lg border border-red-500/40 text-sm text-red-400 hover:bg-red-500/10"
          >
            Удалить проект
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <h2 className="text-sm font-inter-semibold text-white mb-4">Последние задачи</h2>
        {projectTasks.length === 0 ? (
          <p className="text-sm text-gray-500">Задач пока нет. Создайте в бэклоге.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {projectTasks.slice(0, 6).map((task) => (
              <div key={task.id} className="card-border p-4">
                <p className="text-sm font-inter-medium text-white">{task.title}</p>
                <p className="text-xs text-gray-500 mt-1">{task.status}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={deleteOpen}
        title="Удалить проект?"
        message={`Проект «${project?.name}» и все данные будут удалены.`}
        confirmLabel="Удалить"
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  )
}
