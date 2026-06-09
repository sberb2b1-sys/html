import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useStats } from '../hooks/useStats'

export default function StatsPage() {
  const {
    totalTasks,
    completedTasks,
    inProgressTasks,
    todoTasks,
    completionPercent,
    agentActivity,
    statusChartData,
    tasksByDay,
    hasDateData,
    trendMetrics,
  } = useStats()

  const inProgressPercent = totalTasks > 0 ? Math.round((inProgressTasks / totalTasks) * 100) : 0
  const todoPercent = totalTasks > 0 ? Math.round((todoTasks / totalTasks) * 100) : 0
  const donePercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  const mainStats = useMemo(() => [
    {
      label: 'Всего задач',
      value: totalTasks > 0 ? totalTasks : '0',
      hint: totalTasks > 0 ? 'В бэклоге' : 'Нет данных',
    },
    {
      label: 'Выполнено',
      value: completedTasks,
      hint: totalTasks > 0 ? `${donePercent}% от всех` : 'Нет данных',
    },
    {
      label: 'Процент выполнения',
      value: totalTasks > 0 ? `${completionPercent}%` : '0%',
      hint: totalTasks > 0 ? `${completedTasks} из ${totalTasks}` : 'Нет данных',
    },
    {
      label: 'В работе',
      value: inProgressTasks,
      hint: totalTasks > 0 ? `${inProgressPercent}% от всех` : 'Нет данных',
    },
  ], [totalTasks, completedTasks, completionPercent, donePercent, inProgressTasks, inProgressPercent])

  const tooltipStyle = {
    contentStyle: { background: '#1C1C24', border: '1px solid #2A2A35', borderRadius: 8, color: '#fff' },
    cursor: { fill: 'rgba(124,58,237,0.08)' },
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="px-4 md:px-8 py-4 md:py-5 border-b border-dark-border">
        <h1 className="text-lg md:text-xl font-inter-bold text-white">Статистика</h1>
        <p className="text-xs md:text-sm text-gray-500 mt-1">Данные из текущих задач и проектов</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col gap-4 md:gap-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {mainStats.map((stat) => (
            <div key={stat.label} className="stat-card">
              <div className="w-8 h-8 rounded-lg bg-[rgba(124,58,237,0.15)] flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 2V14M2 8H14" stroke="#7C6FF7" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <p className="text-2xl md:text-3xl font-inter-bold text-white">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className="text-xs text-gray-600">{stat.hint}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {trendMetrics.map((metric) => (
            <div key={metric.id} className="stat-card">
              <p className="text-sm text-gray-500">{metric.label}</p>
              {metric.value ? (
                <p
                  className={`text-2xl font-inter-bold ${
                    metric.positive === true
                      ? 'text-status-green'
                      : metric.positive === false
                        ? 'text-status-red'
                        : 'text-white'
                  }`}
                >
                  {metric.value}
                </p>
              ) : (
                <p className="text-lg font-inter-medium text-gray-400">—</p>
              )}
              <p className="text-xs text-gray-600">{metric.hint}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="stat-card">
            <p className="text-2xl font-inter-bold text-gray-400">{todoTasks}</p>
            <p className="text-sm text-gray-500">To Do</p>
            <p className="text-xs text-gray-600">{todoPercent}%</p>
          </div>
          <div className="stat-card">
            <p className="text-2xl font-inter-bold text-status-yellow">{inProgressTasks}</p>
            <p className="text-sm text-gray-500">In Progress</p>
            <p className="text-xs text-gray-600">{inProgressPercent}%</p>
          </div>
          <div className="stat-card">
            <p className="text-2xl font-inter-bold text-status-green">{completedTasks}</p>
            <p className="text-sm text-gray-500">Done</p>
            <p className="text-xs text-gray-600">{donePercent}%</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <div className="card-border p-4 md:p-5 flex flex-col gap-4">
            <div>
              <p className="text-base font-inter-semibold text-white">Задачи по дням</p>
              <p className="text-xs text-gray-500">Новые задачи за последние 7 дней</p>
            </div>
            {hasDateData ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={tasksByDay} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <XAxis dataKey="day" tick={{ fill: '#9CA3AF', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip {...tooltipStyle} />
                  <Bar dataKey="tasks" fill="#6366F1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[220px] text-sm text-gray-500 text-center px-4">
                Данные собираются — создайте задачи, чтобы увидеть динамику
              </div>
            )}
          </div>

          <div className="card-border p-4 md:p-5 flex flex-col gap-4">
            <div>
              <p className="text-base font-inter-semibold text-white">Задачи по статусам</p>
              <p className="text-xs text-gray-500">Распределение по колонкам бэклога</p>
            </div>
            {totalTasks > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={statusChartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip {...tooltipStyle} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {statusChartData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[220px] text-sm text-gray-500">
                Нет данных
              </div>
            )}
          </div>
        </div>

        <div className="card-border p-4 md:p-5 flex flex-col gap-4">
          <div>
            <p className="text-base font-inter-semibold text-white">Активность агентов</p>
            <p className="text-xs text-gray-500">Количество назначенных задач</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <div className="flex flex-col gap-3">
              {agentActivity.map((agent) => {
                const share = totalTasks > 0 ? Math.round((agent.tasks / totalTasks) * 100) : 0
                return (
                  <div key={agent.name} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-sm gap-2">
                      <span className="text-gray-300 truncate">{agent.name}</span>
                      <span className="text-gray-500 shrink-0 text-xs">
                        {agent.tasks} задач
                        {totalTasks > 0 && ` • ${share}%`}
                      </span>
                    </div>
                    <div className="h-1.5 bg-dark-border rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${totalTasks > 0 ? (agent.tasks / totalTasks) * 100 : 0}%`,
                          backgroundColor: agent.color,
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            <div>
              {agentActivity.some((a) => a.tasks > 0) ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={agentActivity.filter((a) => a.tasks > 0)}
                    layout="vertical"
                    margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
                  >
                    <XAxis type="number" tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fill: '#9CA3AF', fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      width={90}
                    />
                    <Tooltip {...tooltipStyle} />
                    <Bar dataKey="tasks" radius={[0, 4, 4, 0]}>
                      {agentActivity.filter((a) => a.tasks > 0).map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[200px] lg:h-[280px] text-sm text-gray-500">
                  Нет назначенных задач
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
