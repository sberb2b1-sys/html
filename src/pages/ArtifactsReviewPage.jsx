import { useCallback, useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import toast from 'react-hot-toast'
import { artifacts as artifactsApi } from '../api/client'
import { useStore } from '../store/useStore'

const TYPE_LABELS = {
  BRD: 'Бизнес-требования',
  SRS: 'Техническое задание',
  architecture: 'Архитектура',
  code: 'Код',
  test_plan: 'План тестирования',
}

export default function ArtifactsReviewPage() {
  const { projectId, project } = useOutletContext()
  const userRole = useStore((s) => s.userRole)
  const [items, setItems] = useState([])
  const [history, setHistory] = useState([])
  const [selected, setSelected] = useState(null)
  const [feedback, setFeedback] = useState('')
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('pending')

  const isPo = userRole === 'po'

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [pending, all] = await Promise.all([
        artifactsApi.getPending(projectId),
        artifactsApi.getAll(projectId),
      ])
      setItems(pending)
      setHistory(all)
      if (selected && !pending.find((a) => a.id === selected.id)) {
        setSelected(null)
      }
    } catch (error) {
      if (!error.handledGlobally) {
        toast.error(error.message || 'Не удалось загрузить артефакты')
      }
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    load()
  }, [load])

  const approve = async (artifact) => {
    try {
      await artifactsApi.approve(projectId, artifact.id)
      toast.success(`«${artifact.title}» утверждён`)
      setSelected(null)
      setFeedback('')
      load()
    } catch (error) {
      if (!error.handledGlobally) {
        toast.error(error.message || 'Не удалось утвердить')
      }
    }
  }

  const reject = async (artifact) => {
    if (!feedback.trim()) {
      toast.error('Укажите причину доработки')
      return
    }
    try {
      await artifactsApi.reject(projectId, artifact.id, feedback.trim())
      toast.error(`«${artifact.title}» отправлен на доработку`)
      setSelected(null)
      setFeedback('')
      load()
    } catch (error) {
      if (!error.handledGlobally) {
        toast.error(error.message || 'Не удалось отклонить')
      }
    }
  }

  if (!isPo) {
    return (
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="px-8 py-5 border-b border-dark-border">
          <h1 className="text-xl font-inter-bold text-white">Артефакты</h1>
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <p className="text-sm text-gray-500">Раздел доступен только Product Owner</p>
        </div>
      </div>
    )
  }

  const list = tab === 'pending' ? items : history

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="px-8 py-5 border-b border-dark-border">
        <h1 className="text-xl font-inter-bold text-white">Артефакты</h1>
        <p className="text-sm text-gray-500 mt-1">
          {project?.name} • согласование документов агентов
        </p>
        <div className="flex gap-2 mt-4">
          <button
            type="button"
            onClick={() => setTab('pending')}
            className={`px-3 py-1.5 rounded-lg text-sm ${
              tab === 'pending'
                ? 'bg-[rgba(124,58,237,0.15)] text-white'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            На согласовании ({items.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('history')}
            className={`px-3 py-1.5 rounded-lg text-sm ${
              tab === 'history'
                ? 'bg-[rgba(124,58,237,0.15)] text-white'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            История
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex">
        <div className="w-80 shrink-0 border-r border-dark-border overflow-y-auto p-4 space-y-2">
          {loading ? (
            <p className="text-sm text-gray-500">Загрузка...</p>
          ) : list.length === 0 ? (
            <p className="text-sm text-gray-500">
              {tab === 'pending'
                ? 'Нет артефактов на согласовании. Утвердите задачу в разделе «Согласование».'
                : 'История пуста'}
            </p>
          ) : (
            list.map((artifact) => (
              <button
                key={artifact.id}
                type="button"
                onClick={() => setSelected(artifact)}
                className={`w-full text-left card-border p-3 transition-colors ${
                  selected?.id === artifact.id
                    ? 'border-accent-purple/50 bg-[rgba(124,58,237,0.1)]'
                    : 'hover:border-accent-purple/30'
                }`}
              >
                <p className="text-sm font-inter-medium text-white line-clamp-2">
                  {artifact.title}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {TYPE_LABELS[artifact.artifact_type] || artifact.artifact_type}
                </p>
                <p className="text-xs text-gray-600 mt-0.5 truncate">
                  {artifact.task_title}
                </p>
                {tab === 'history' && (
                  <span className="text-xs text-gray-500 mt-1 inline-block">
                    {artifact.status}
                  </span>
                )}
              </button>
            ))
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          {!selected ? (
            <p className="text-sm text-gray-500">Выберите артефакт слева</p>
          ) : (
            <div className="max-w-3xl">
              <h2 className="text-lg font-inter-bold text-white">{selected.title}</h2>
              <p className="text-sm text-gray-500 mt-1">
                {TYPE_LABELS[selected.artifact_type] || selected.artifact_type} •{' '}
                {selected.agent_name || 'Агент'} • Задача: {selected.task_title}
              </p>

              <div className="card-border p-4 mt-4 max-h-[420px] overflow-auto prose prose-invert prose-sm max-w-none">
                <ReactMarkdown>{selected.content}</ReactMarkdown>
              </div>

              {tab === 'pending' && (
                <>
                  <div className="mt-4">
                    <label className="text-sm text-gray-400 block mb-2">
                      Замечания (при отклонении)
                    </label>
                    <textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      rows={3}
                      className="w-full p-3 rounded-xl border border-dark-border bg-dark-card text-sm text-white outline-none focus:border-accent-purple/50 resize-none"
                      placeholder="Что нужно исправить?"
                    />
                  </div>
                  <div className="flex gap-3 mt-4">
                    <button
                      type="button"
                      onClick={() => approve(selected)}
                      className="px-4 py-2 rounded-lg bg-green-600 text-sm text-white hover:bg-green-700"
                    >
                      Утвердить
                    </button>
                    <button
                      type="button"
                      onClick={() => reject(selected)}
                      className="px-4 py-2 rounded-lg bg-red-600 text-sm text-white hover:bg-red-700"
                    >
                      На доработку
                    </button>
                  </div>
                </>
              )}

              {selected.feedback && tab === 'history' && (
                <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-300">
                  Замечания PO: {selected.feedback}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
