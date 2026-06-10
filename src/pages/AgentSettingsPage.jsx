import { useEffect, useState } from 'react'
import { Navigate, useOutletContext } from 'react-router-dom'
import { useStore } from '../store/useStore'

export default function AgentSettingsPage() {
  const { projectId } = useOutletContext()
  const userRole = useStore((s) => s.userRole)
  const getProjectAgents = useStore((s) => s.getProjectAgents)
  const loadProjectAgents = useStore((s) => s.loadProjectAgents)
  const updateProjectAgentPrompt = useStore((s) => s.updateProjectAgentPrompt)

  const [editingAgent, setEditingAgent] = useState(null)
  const [prompt, setPrompt] = useState('')

  useEffect(() => {
    loadProjectAgents(projectId)
  }, [projectId, loadProjectAgents])

  if (userRole !== 'po') {
    return <Navigate to={`/projects/${projectId}`} replace />
  }

  const agents = getProjectAgents(projectId)

  const savePrompt = async (agentId) => {
    const ok = await updateProjectAgentPrompt(projectId, agentId, prompt)
    if (ok) setEditingAgent(null)
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="px-8 py-5 border-b border-dark-border">
        <h1 className="text-xl font-inter-bold text-white">Настройка агентов</h1>
        <p className="text-sm text-gray-500 mt-1">Системные промты агентов этого проекта</p>
      </div>
      <div className="flex-1 overflow-y-auto p-8 space-y-4">
        {agents.map((agent) => (
          <div key={agent.id} className="card-border p-4">
            <div className="flex justify-between items-start mb-2 gap-4">
              <div>
                <h3 className="text-lg font-inter-semibold text-white">{agent.name}</h3>
                <p className="text-sm text-gray-400">{agent.role}</p>
              </div>
              {editingAgent === agent.id ? (
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => savePrompt(agent.id)}
                    className="px-3 py-1 bg-green-600 rounded text-sm text-white"
                  >
                    Сохранить
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingAgent(null)}
                    className="px-3 py-1 bg-slate-600 rounded text-sm text-white"
                  >
                    Отмена
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setEditingAgent(agent.id)
                    setPrompt(agent.systemPrompt || '')
                  }}
                  className="px-3 py-1 bg-purple-600 rounded text-sm text-white shrink-0"
                >
                  Редактировать промт
                </button>
              )}
            </div>
            {editingAgent === agent.id ? (
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full p-3 bg-dark-card rounded text-white font-mono text-sm border border-dark-border"
                rows={8}
              />
            ) : (
              <div className="bg-dark-card p-3 rounded text-sm text-gray-300 font-mono whitespace-pre-wrap max-h-48 overflow-auto">
                {agent.systemPrompt || 'Промт не задан'}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
