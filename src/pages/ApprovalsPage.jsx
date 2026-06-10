import { useCallback, useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import toast from 'react-hot-toast'
import { approvals as approvalsApi } from '../api/client'
import { useStore } from '../store/useStore'

export default function ApprovalsPage() {
  const { projectId, project } = useOutletContext()
  const userRole = useStore((s) => s.userRole)
  const loadTasks = useStore((s) => s.loadTasks)

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [rejectTarget, setRejectTarget] = useState(null)
  const [rejectReason, setRejectReason] = useState('Требуются доработки')

  const isPo = userRole === 'po'

  const loadApprovals = useCallback(async () => {
    setLoading(true)
    try {
      const data = await approvalsApi.getAll(projectId, true)
      setItems(data)
    } catch (error) {
      if (!error.handledGlobally) {
        toast.error(error.message || 'Не удалось загрузить согласования')
      }
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    loadApprovals()
  }, [loadApprovals])

  const approveTask = async (taskId) => {
    try {
      await approvalsApi.approve(projectId, taskId)
      toast.success('Задача утверждена')
      await loadTasks(projectId)
      loadApprovals()
    } catch (error) {
      if (!error.handledGlobally) {
        toast.error(error.message || 'Не удалось утвердить задачу')
      }
    }
  }

  const rejectTask = async () => {
    if (!rejectTarget) return
    try {
      await approvalsApi.reject(projectId, rejectTarget, rejectReason.trim() || 'Требуются доработки')
      toast.error('Задача отправлена на доработку')
      setRejectTarget(null)
      await loadTasks(projectId)
      loadApprovals()
    } catch (error) {
      if (!error.handledGlobally) {
        toast.error(error.message || 'Не удалось отклонить задачу')
      }
    }
  }

  if (!isPo) {
    return (
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="px-8 py-5 border-b border-dark-border">
          <h1 className="text-xl font-inter-bold text-white">Согласование</h1>
          <p className="text-sm text-gray-500 mt-1">{project?.name}</p>
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <p className="text-sm text-gray-500">Раздел доступен только Product Owner</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="px-8 py-5 border-b border-dark-border">
        <h1 className="text-xl font-inter-bold text-white">Согласование</h1>
        <p className="text-sm text-gray-500 mt-1">
          {project?.name} • задачи после авто-анализа
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        {loading ? (
          <p className="text-sm text-gray-500">Загрузка...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-gray-500">
            Нет задач на согласовании. Запустите авто-анализ на странице обзора проекта.
          </p>
        ) : (
          <div className="space-y-4">
            {items.map((approval) => (
              <div key={approval.id} className="card-border p-6">
                <h3 className="text-lg font-inter-semibold text-white">
                  {approval.task?.title}
                </h3>
                <p className="text-sm text-gray-400 mt-2 whitespace-pre-wrap">
                  {approval.task?.description}
                </p>
                <p className="text-xs text-gray-600 mt-2">
                  Приоритет: {approval.task?.priority} • Статус: {approval.task?.status}
                </p>

                {approval.report && (
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm text-accent-violet hover:underline">
                      Посмотреть отчёт аналитиков
                    </summary>
                    <pre className="mt-4 p-4 bg-dark-card rounded-xl overflow-auto text-xs text-gray-300 whitespace-pre-wrap border border-dark-border max-h-96">
                      {approval.report}
                    </pre>
                  </details>
                )}

                <div className="flex gap-3 mt-6 flex-wrap">
                  <button
                    type="button"
                    onClick={() => approveTask(approval.task_id)}
                    className="px-4 py-2 rounded-lg bg-green-600 text-sm text-white hover:bg-green-700"
                  >
                    Утвердить
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRejectTarget(approval.task_id)
                      setRejectReason('Требуются доработки')
                    }}
                    className="px-4 py-2 rounded-lg bg-red-600/90 text-sm text-white hover:bg-red-700"
                  >
                    Отправить на доработку
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="card-border p-6 w-full max-w-md">
            <h3 className="text-sm font-inter-semibold text-white mb-3">Причина отклонения</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              className="w-full p-3 rounded-xl border border-dark-border bg-dark-card text-sm text-white outline-none focus:border-accent-purple/50 resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={() => setRejectTarget(null)}
                className="flex-1 px-4 py-2 rounded-lg border border-dark-border text-sm text-gray-400"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={rejectTask}
                className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-sm text-white"
              >
                Отклонить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
