import { useMemo } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { useStore } from '../store/useStore'

function taskWord(count) {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) return 'задача'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'задачи'
  return 'задач'
}

export default function TeamPage() {
  const { projectId } = useOutletContext()
  const navigate = useNavigate()
  const getProjectAgents = useStore((s) => s.getProjectAgents)
  const tasks = useStore((s) => s.tasks)

  const agents = getProjectAgents(projectId)
  const projectTasks = useMemo(
    () => tasks.filter((t) => t.projectId === projectId),
    [tasks, projectId]
  )

  const agentStats = useMemo(() => {
    return agents.map((agent) => {
      const agentTasks = projectTasks.filter((t) => t.assigneeAgentId === agent.id)
      const activeCount = agentTasks.filter(
        (t) => t.status === 'todo' || t.status === 'in_progress'
      ).length
      const doneCount = agentTasks.filter((t) => t.status === 'done').length
      return { agent, activeCount, doneCount, totalCount: agentTasks.length }
    })
  }, [agents, projectTasks])

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="px-8 py-5 border-b border-dark-border">
        <h1 className="text-xl font-inter-bold text-white">Команда проекта</h1>
        <p className="text-sm text-gray-500 mt-1">{agents.length} агентов</p>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="grid grid-cols-2 gap-4">
          {agentStats.map(({ agent, activeCount, doneCount, totalCount }) => (
            <button
              key={agent.id}
              type="button"
              onClick={() => navigate(`/projects/${projectId}/chats?agent=${agent.id}`)}
              className="card-border p-5 text-left hover:border-accent-purple/40 transition-colors"
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-inter-semibold text-white"
                  style={{ backgroundColor: agent.avatarColor }}
                >
                  {agent.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-inter-semibold text-white">{agent.name}</p>
                  <p className="text-xs text-gray-500">{agent.role}</p>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                {activeCount} в работе • {doneCount} готово • {totalCount}{' '}
                {taskWord(totalCount)}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
