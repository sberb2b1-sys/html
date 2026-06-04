import { useMemo } from 'react'
import { useStore } from '../store/useStore'

export function useStats() {
  const tasks = useStore((s) => s.tasks)
  const projects = useStore((s) => s.projects)
  const agents = useStore((s) => s.agents)

  return useMemo(() => {
    const totalTasks = tasks.length
    const completedTasks = tasks.filter((t) => t.status === 'done').length
    const inProgressTasks = tasks.filter((t) => t.status === 'in_progress').length
    const todoTasks = tasks.filter((t) => t.status === 'todo').length
    const completionPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

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
      tasks: tasks.filter((t) => t.project === project.name).length,
    }))

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
    }
  }, [tasks, projects])
}
