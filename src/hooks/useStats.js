import { useMemo } from 'react'
import { useStore } from '../store/useStore'

const DAY_LABELS = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']

function startOfDay(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function percentChange(current, previous) {
  if (previous === 0 && current === 0) return null
  if (previous === 0) return current > 0 ? 100 : null
  return Math.round(((current - previous) / previous) * 100)
}

function formatTrend(value) {
  if (value === null || value === undefined) return null
  const sign = value > 0 ? '+' : ''
  return `${sign}${value}%`
}

export function useStats() {
  const tasks = useStore((s) => s.tasks)
  const projects = useStore((s) => s.projects)
  const agents = useStore((s) => s.agents)
  const sprints = useStore((s) => s.sprints)

  return useMemo(() => {
    const totalTasks = tasks.length
    const completedTasks = tasks.filter((t) => t.status === 'done').length
    const inProgressTasks = tasks.filter((t) => t.status === 'in_progress').length
    const todoTasks = tasks.filter((t) => t.status === 'todo').length
    const completionPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    const now = new Date()
    const todayStart = startOfDay(now)
    const weekAgo = new Date(todayStart)
    weekAgo.setDate(weekAgo.getDate() - 7)
    const twoWeeksAgo = new Date(todayStart)
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)

    const tasksWithDates = tasks.filter((t) => t.createdAt)
    const hasDateData = tasksWithDates.length > 0

    const tasksThisWeek = tasksWithDates.filter((t) => {
      const created = new Date(t.createdAt)
      return created >= weekAgo
    }).length

    const tasksPrevWeek = tasksWithDates.filter((t) => {
      const created = new Date(t.createdAt)
      return created >= twoWeeksAgo && created < weekAgo
    }).length

    const weeklyTaskChange = hasDateData
      ? percentChange(tasksThisWeek, tasksPrevWeek)
      : null

    const activeSprints = sprints.filter((s) => s.status === 'active')
    const sprintTasks = activeSprints.length > 0
      ? tasks.filter((t) => activeSprints.some((s) => s.id === t.sprintId))
      : tasks.filter((t) => t.sprintId)

    const sprintDone = sprintTasks.filter((t) => t.status === 'done').length
    const sprintVelocity = sprintTasks.length > 0
      ? Math.round((sprintDone / sprintTasks.length) * 100)
      : null

    const completedSprints = sprints.filter((s) => s.status === 'completed')
    let prevSprintVelocity = null
    if (completedSprints.length > 0) {
      const lastSprint = completedSprints[completedSprints.length - 1]
      const lastSprintTasks = tasks.filter((t) => t.sprintId === lastSprint.id)
      const lastDone = lastSprintTasks.filter((t) => t.status === 'done').length
      prevSprintVelocity = lastSprintTasks.length > 0
        ? Math.round((lastDone / lastSprintTasks.length) * 100)
        : null
    }

    const sprintVelocityChange =
      sprintVelocity !== null && prevSprintVelocity !== null
        ? sprintVelocity - prevSprintVelocity
        : null

    const highPriorityOpen = tasks.filter(
      (t) => t.priority === 'High' && t.status !== 'done'
    ).length
    const errorShare = totalTasks > 0
      ? Math.round((highPriorityOpen / totalTasks) * 100)
      : null

    const tasksByDay = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(todayStart)
      day.setDate(day.getDate() - (6 - i))
      const dayStart = startOfDay(day)
      const dayEnd = new Date(dayStart)
      dayEnd.setDate(dayEnd.getDate() + 1)

      const count = tasksWithDates.filter((t) => {
        const created = new Date(t.createdAt)
        return created >= dayStart && created < dayEnd
      }).length

      return {
        day: DAY_LABELS[dayStart.getDay()],
        tasks: count,
      }
    })

    const agentActivity = agents.map((agent) => ({
      name: agent.name,
      tasks: tasks.filter(
        (t) => t.assigneeAgentId === agent.id || t.assignee === agent.name
      ).length,
      color: agent.avatarColor,
    }))

    const maxAgentTasks = Math.max(...agentActivity.map((a) => a.tasks), 1)

    const statusChartData = [
      { name: 'To Do', value: todoTasks, fill: '#6B7280' },
      { name: 'In Progress', value: inProgressTasks, fill: '#EAB308' },
      { name: 'Done', value: completedTasks, fill: '#22C55E' },
    ]

    const projectTaskCounts = projects.map((project) => ({
      name: project.name.length > 20 ? `${project.name.slice(0, 18)}…` : project.name,
      tasks: tasks.filter((t) => t.project === project.name || t.projectId === project.id).length,
    }))

    const trendMetrics = [
      {
        id: 'weekly-tasks',
        label: 'Задачи за неделю',
        value: hasDateData ? formatTrend(weeklyTaskChange) : null,
        hint: hasDateData
          ? `${tasksThisWeek} новых (было ${tasksPrevWeek})`
          : 'Данные собираются',
        positive: weeklyTaskChange !== null ? weeklyTaskChange >= 0 : null,
      },
      {
        id: 'sprint-velocity',
        label: 'Скорость спринта',
        value: sprintVelocity !== null ? `${sprintVelocity}%` : null,
        hint:
          sprintVelocityChange !== null
            ? `${sprintVelocityChange >= 0 ? '+' : ''}${sprintVelocityChange} п.п. к прошлому`
            : sprintTasks.length > 0
              ? `${sprintDone} из ${sprintTasks.length} выполнено`
              : 'Данные собираются',
        positive: sprintVelocityChange !== null ? sprintVelocityChange >= 0 : null,
      },
      {
        id: 'error-share',
        label: 'Доля критичных задач',
        value: errorShare !== null ? `${errorShare}%` : null,
        hint: totalTasks > 0
          ? `${highPriorityOpen} High не в Done`
          : 'Данные собираются',
        positive: errorShare !== null ? errorShare <= 20 : null,
      },
    ]

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      todoTasks,
      completionPercent,
      agentActivity,
      maxAgentTasks,
      statusChartData,
      projectTaskCounts,
      activeProjects: projects.filter((p) => p.status === 'В работе').length,
      tasksByDay,
      hasDateData,
      trendMetrics,
    }
  }, [tasks, projects, agents, sprints])
}
