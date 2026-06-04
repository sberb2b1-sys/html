import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import RoleSwitcher from '../components/RoleSwitcher'
import { useStore } from '../store/useStore'

function taskWord(count) {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) return 'задача'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'задачи'
  return 'задач'
}

function getAgentTasks(tasks, agent) {
  return tasks.filter(
    (task) =>
      task.assigneeAgentId === agent.id ||
      (!task.assigneeAgentId && task.assignee === agent.name)
  )
}

export default function TeamPage() {
  const navigate = useNavigate()
  const agents = useStore((s) => s.agents)
  const tasks = useStore((s) => s.tasks)

  const agentStats = useMemo(() => {
    return agents.map((agent) => {
      const agentTasks = getAgentTasks(tasks, agent)
      const activeCount = agentTasks.filter(
        (t) => t.status === 'todo' || t.status === 'in_progress'
      ).length
      const doneCount = agentTasks.filter((t) => t.status === 'done').length

      return { agent, activeCount, doneCount, totalCount: agentTasks.length }
    })
  }, [agents, tasks])

  const handleAgentClick = (agentId) => {
    navigate(`/chats?agent=${agentId}`)
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="px-8 py-5 border-b border-dark-border flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-inter-bold text-white">Команда проекта</h1>
          <p className="text-sm text-gray-500 mt-1">
            {agents.length} участников • задачи из бэклога
          </p>
        </div>
        <div className="w-48">
          <RoleSwitcher compact />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="grid grid-cols-2 gap-4">
          {agentStats.map(({ agent, activeCount, doneCount, totalCount }) => (
            <div
              key={agent.id}
              className="card-border p-5 flex flex-col gap-4 cursor-pointer hover:border-accent-purple/50 transition-colors"
              onClick={() => handleAgentClick(agent.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleAgentClick(agent.id)}
            >
              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-base font-inter-semibold text-white"
                    style={{ backgroundColor: agent.avatarColor }}
                  >
                    {agent.name.charAt(0)}
                  </div>
                  {agent.online && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-status-green border-2 border-dark-card" />
                  )}
                </div>
                <div>
                  <p className="text-base font-inter-semibold text-white">{agent.name}</p>
                  <p className="text-xs text-gray-500">{agent.role}</p>
                </div>
              </div>

              <p className="text-sm text-gray-400">{agent.roleShort}</p>

              <div className="flex items-center justify-between pt-2 border-t border-dark-border">
                <div className="flex flex-col gap-1 text-xs text-gray-500">
                  {totalCount === 0 ? (
                    <span>0 задач</span>
                  ) : (
                    <>
                      <span>{activeCount} активных {taskWord(activeCount)}</span>
                      <span className="text-status-green">{doneCount} выполнено</span>
                    </>
                  )}
                </div>
                <span className="status-badge status-working">{agent.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
