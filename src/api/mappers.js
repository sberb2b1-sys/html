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
    systemPrompt: agent.system_prompt || '',
    avatarUrl: agent.avatar_url || '',
    status: 'В работе',
    online: agent.is_online,
    avatarColor: AGENT_COLORS[agent.id] || '#7C3AED',
    lastMessage: '',
    activity: agent.role,
  }
}

export function mapAgentToApi(data) {
  return {
    id: data.id,
    name: data.name,
    role: data.role,
    system_prompt: data.systemPrompt || data.system_prompt || '',
    avatar_url: data.avatarUrl || data.avatar_url || '',
    is_online: data.isOnline ?? data.is_online ?? true,
  }
}

export function mapSprintFromApi(sprint) {
  return {
    id: sprint.id,
    projectId: sprint.project_id,
    name: sprint.name,
    description: sprint.description || '',
    startDate: sprint.start_date,
    endDate: sprint.end_date,
    status: sprint.status,
    createdAt: sprint.created_at ?? null,
  }
}

export function mapSprintToApi(data) {
  return {
    project_id: data.projectId,
    name: data.name,
    description: data.description || '',
    start_date: data.startDate,
    end_date: data.endDate,
    status: data.status || 'planning',
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
    sprintId: task.sprint_id ?? null,
    project: project?.name || '',
    assigneeAgentId: task.assignee_agent_id ?? null,
    assignee: agent?.name || '',
    createdAt: task.created_at ?? null,
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
    sprint_id: data.sprintId ?? data.sprint_id ?? null,
    assignee_agent_id: data.assigneeAgentId || agent?.id || null,
  }
}

export function mapChatMessageFromApi(msg) {
  return {
    id: String(msg.id),
    from: msg.role === 'assistant' ? 'agent' : 'user',
    text: msg.content,
    time: formatTime(msg.created_at),
  }
}

export function mapChatExchange(response) {
  return {
    userMessage: mapChatMessageFromApi(response.user_message),
    agentMessage: mapChatMessageFromApi(response.agent_message),
  }
}

export function mapChatHistory(records) {
  return records.map(mapChatMessageFromApi)
}

export function mapGeneralMessageFromApi(msg) {
  return {
    id: String(msg.id),
    from: 'user',
    userName: msg.user_name,
    text: msg.content,
    time: formatTime(msg.created_at),
    agentId: msg.agent_id,
  }
}

export function parseChatMessageId(messageId) {
  const num = Number(messageId)
  return Number.isFinite(num) && num > 0 ? num : null
}
