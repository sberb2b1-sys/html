import { useMemo } from 'react'
import Header from '../components/Header'
import AgentCard from '../components/AgentCard'
import { useStore } from '../store/useStore'

function taskWord(count) {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) return 'задача'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'задачи'
  return 'задач'
}

export default function DashboardPage() {
  const tasks = useStore((s) => s.tasks)
  const projects = useStore((s) => s.projects)
  const agents = useStore((s) => s.agents)

  const {
    totalTasks,
    completedTasks,
    inProgressTasks,
    completionPercent,
    activeAgentCount,
    agentsWithTasks,
    currentSprintName,
  } = useMemo(() => {
    const total = tasks.length
    const completed = tasks.filter((t) => t.status === 'done').length
    const inProgress = tasks.filter((t) => t.status === 'in_progress').length
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0

    const withWork = agents.filter((agent) =>
      tasks.some((t) => t.assignee === agent.name && t.status === 'in_progress')
    )
    const activeAgents = withWork.length > 0
      ? withWork.length
      : agents.filter((a) => a.online).length

    const enrichedAgents = agents.map((agent) => {
      const assignedCount = tasks.filter((t) => t.assignee === agent.name).length
      return {
        ...agent,
        tasksActive: assignedCount,
        activity: assignedCount > 0
          ? `${assignedCount} ${taskWord(assignedCount)}`
          : 'Нет данных',
      }
    })

    const activeProject = projects.find((p) => p.status === 'В работе') ?? projects[0]

    return {
      totalTasks: total,
      completedTasks: completed,
      inProgressTasks: inProgress,
      completionPercent: percent,
      activeAgentCount: activeAgents,
      agentsWithTasks: enrichedAgents,
      currentSprintName: activeProject?.name ?? 'Нет данных',
    }
  }, [tasks, projects, agents])

  const stats = [
    {
      label: 'Всего задач',
      value: totalTasks > 0 ? String(totalTasks) : '0',
      change: totalTasks > 0 ? `${inProgressTasks} в работе` : 'Нет данных',
      positive: null,
    },
    {
      label: 'Выполнено задач',
      value: String(completedTasks),
      change: totalTasks > 0 ? `из ${totalTasks}` : 'Нет данных',
      positive: completedTasks > 0 ? true : null,
    },
    {
      label: 'Активных агентов',
      value: String(activeAgentCount),
      change: activeAgentCount > 0 ? `из ${agents.length}` : 'Нет данных',
      positive: activeAgentCount > 0 ? true : null,
    },
    {
      label: 'Завершение спринта',
      value: totalTasks > 0 ? `${completionPercent}%` : '0%',
      change: totalTasks > 0
        ? completionPercent >= 70 ? 'Высокая' : completionPercent >= 40 ? 'Средняя' : 'Низкая'
        : 'Нет данных',
      positive: totalTasks > 0 ? completionPercent >= 40 : null,
    },
  ]

  const recentActivities = useMemo(() => {
    const doneTasks = tasks
      .filter((t) => t.status === 'done')
      .slice(-4)
      .reverse()

    if (doneTasks.length === 0) return []

    return doneTasks.map((task) => ({
      text: `${task.assignee}: ${task.title}`,
      time: task.status === 'done' ? 'Завершено' : '',
      color: agents.find((a) => a.name === task.assignee)?.avatarColor ?? '#7C3AED',
    }))
  }, [tasks, agents])

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header
        title="Дашборд команды"
        subtitle={`Мультиагентная IT-команда • ${projects.length > 0 ? `${projects.length} проектов` : 'Нет проектов'}`}
      />

      <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-6">
        <div className="grid grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="stat-card">
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className="text-3xl font-inter-bold text-white">{stat.value}</p>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-500">{stat.change}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-6 flex-1">
          <div className="col-span-2 card-border p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base font-inter-semibold text-white">Агенты команды</p>
                <p className="text-xs text-gray-500">
                  {activeAgentCount > 0 ? `${activeAgentCount} активных` : 'Нет данных'}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2 overflow-y-auto max-h-[480px]">
              {agentsWithTasks.map((agent) => (
                <AgentCard key={agent.id} agent={agent} compact />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="card-border p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-inter-semibold text-white">Текущий спринт</p>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <circle cx="6" cy="6" r="5" stroke="#6B7280" strokeWidth="1.2" />
                    <path d="M6 3V6L8 8" stroke="#6B7280" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                  {totalTasks > 0 ? `${totalTasks} задач` : 'Нет данных'}
                </div>
              </div>
              <p className="text-sm text-gray-300">{currentSprintName}</p>
              <div className="h-2 bg-dark-border rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${completionPercent}%`,
                    background: 'linear-gradient(90deg, #7C3AED, #3B82F6)',
                  }}
                />
              </div>
              <p className="text-xs text-gray-500">
                {totalTasks > 0 ? `${completionPercent}% завершено` : 'Нет данных'}
              </p>
            </div>

            <div className="card-border p-5 flex flex-col gap-4 flex-1">
              <p className="text-sm font-inter-semibold text-white">Последняя активность</p>
              <div className="flex flex-col gap-4">
                {recentActivities.length > 0 ? (
                  recentActivities.map((item) => (
                    <div key={item.text} className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: item.color }} />
                      <div>
                        <p className="text-sm text-gray-300 leading-snug">{item.text}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{item.time}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">Нет данных</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
