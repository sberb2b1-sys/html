import { useMemo, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import toast from 'react-hot-toast'
import ConfirmDialog from '../components/ConfirmDialog'
import { analysis } from '../api/client'
import { useStore } from '../store/useStore'

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
  const userRole = useStore((s) => s.userRole)
  const getProjectAgents = useStore((s) => s.getProjectAgents)
  const loadTasks = useStore((s) => s.loadTasks)
  const deleteProject = useStore((s) => s.deleteProject)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [idea, setIdea] = useState('')
  const [analyzing, setAnalyzing] = useState(false)

  const projectTasks = useMemo(
    () => tasks.filter((t) => t.projectId === projectId && t.status !== 'pending_approval'),
    [tasks, projectId]
  )
  const agents = getProjectAgents(projectId)
  const isPo = userRole === 'po'

  const handleDelete = async () => {
    await deleteProject(projectId)
    setDeleteOpen(false)
    navigate('/holdings')
  }

  const handleAnalyze = async () => {
    if (!idea.trim()) {
      toast.error('Введите идею')
      return
    }
    setAnalyzing(true)
    try {
      const result = await analysis.run(projectId, idea.trim())
      toast.success(`Задача создана! Победил: ${result.winner}`)
      await loadTasks(projectId)
      navigate(`/projects/${projectId}/approvals`)
    } catch (error) {
      if (!error.handledGlobally) {
        toast.error(error.message || 'Ошибка при анализе')
      }
    } finally {
      setAnalyzing(false)
    }
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
        <div className="flex gap-2 mt-4 flex-wrap">
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

      <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-8">
        {isPo && (
          <section className="card-border p-6">
            <h2 className="text-sm font-inter-semibold text-white mb-1">Авто-анализ идеи</h2>
            <p className="text-xs text-gray-500 mb-4">
              Совет из трёх аналитиков обсудит идею, выберет лучшее решение и создаст задачу на
              согласование. Промежуточные обсуждения скрыты — вы увидите только итоговый отчёт.
            </p>
            <textarea
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="Опишите вашу идею: что нужно сделать, для кого, какие ограничения..."
              className="w-full p-3 rounded-xl border border-dark-border bg-dark-card text-sm text-white placeholder:text-gray-500 outline-none focus:border-accent-purple/50 resize-none"
              rows={5}
              disabled={analyzing}
            />
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={analyzing}
              className="mt-4 btn-primary disabled:opacity-50"
            >
              {analyzing ? 'Анализируем... (это может занять несколько минут)' : 'Запустить авто-анализ'}
            </button>
          </section>
        )}

        <section>
          <h2 className="text-sm font-inter-semibold text-white mb-4">Последние задачи</h2>
          {projectTasks.length === 0 ? (
            <p className="text-sm text-gray-500">Задач пока нет. Создайте в бэклоге или через авто-анализ.</p>
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
        </section>
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
