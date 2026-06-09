const AGENT_COLORS = {
  ba: '#7C3AED',
  sa: '#3B82F6',
  arch: '#8B5CF6',
  fe: '#06B6D4',
  be: '#10B981',
  lead: '#F59E0B',
  design: '#EC4899',
  sm: '#6366F1',
}

export function formatTime(isoString) {
  if (!isoString) {
    const now = new Date()
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  }
  const date = new Date(isoString)
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

export function mapAgentFromApi(agent) {
  return {
    id: agent.id,
    name: agent.name,
    role: agent.role,
    roleShort: agent.role,
    status: 'В работе',
    online: agent.is_online,
    avatarColor: AGENT_COLORS[agent.id] || '#7C3AED',
    lastMessage: '',
    activity: agent.role,
  }
}

export function mapTaskFromApi(task, agents = [], projects = []) {
  const agent = agents.find((a) => a.id === task.assignee_agent_id)
  const project = projects.find((p) => p.id === task.project_id)

  return {
    id: String(task.id),
    title: task.title,
    description: task.description || '',
    status: task.status,
    priority: task.priority,
    projectId: task.project_id ?? null,
    project: project?.name || '',
    assigneeAgentId: task.assignee_agent_id ?? null,
    assignee: agent?.name || '',
  }
}

export function mapProjectFromApi(project, rawTasks = []) {
  const projectTasks = rawTasks.filter((t) => t.project_id === project.id)
  const doneCount = projectTasks.filter((t) => t.status === 'done').length
  const progress = projectTasks.length
    ? Math.round((doneCount / projectTasks.length) * 100)
    : 0

  return {
    id: project.id,
    name: project.name,
    subtitle: projectTasks.length ? `Спринт • ${projectTasks.length} задач` : 'Новый проект',
    description: project.description || '',
    progress,
    status: progress >= 100 ? 'Завершён' : 'В работе',
    tasksDone: doneCount,
    deadline: project.deadline || 'Без срока',
  }
}

export function mapProjectToApi(data) {
  return {
    name: data.name,
    description: data.description || '',
    deadline: data.deadline || 'Без срока',
  }
}

export function mapTaskToApi(data, agents = []) {
  const agent = agents.find(
    (a) => a.id === data.assigneeAgentId || a.name === data.assignee
  )

  return {
    title: data.title,
    description: data.description || '',
    status: data.status || 'todo',
    priority: data.priority || 'Medium',
    project_id: data.projectId ?? data.project_id ?? null,
    assignee_agent_id: data.assigneeAgentId ?? agent?.id ?? null,
  }
}

export function mapChatResponse(response) {
  const time = formatTime(response.timestamp)
  return {
    userMessage: {
      id: `msg-${response.id}-user`,
      chatId: response.id,
      from: 'user',
      text: response.user_message,
      time,
    },
    agentMessage: {
      id: `msg-${response.id}-agent`,
      chatId: response.id,
      from: 'agent',
      text: response.reply || response.agent_response,
      time,
    },
  }
}

export function mapChatHistory(records) {
  return records.flatMap((record) => {
    const { userMessage, agentMessage } = mapChatResponse(record)
    return [userMessage, agentMessage]
  })
}

/** Извлекает ID записи в БД из id пузырька чата (msg-42-user → 42). */
export function parseChatMessageId(messageId) {
  const match = String(messageId).match(/^msg-(\d+)-user$/)
  return match ? Number(match[1]) : null
}
