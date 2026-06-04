import { agents as initialAgents } from '../mocks/agents'
import { initialTasks } from '../mocks/tasks'
import { sampleChatHistory } from '../mocks/sampleChatHistory'

const STORAGE_KEY = 'itteam-mock-server'

const AGENT_NAMES = {
  ba: 'Бизнес Аналитик',
  sa: 'Системный Аналитик',
  arch: 'Архитектор',
  fe: 'Фронтенд Разработчик',
  be: 'Бэкенд Разработчик',
  lead: 'Лид Разработки',
  design: 'Дизайнер',
  sm: 'Скрам Мастер',
}

const clone = (data) => JSON.parse(JSON.stringify(data))

function formatTime() {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

function createDefaultDb() {
  return {
    projects: [],
    tasks: clone(initialTasks),
    agents: clone(initialAgents),
    messages: {},
  }
}

function loadDb() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      return {
        projects: Array.isArray(parsed.projects) ? parsed.projects : [],
        tasks: Array.isArray(parsed.tasks) ? parsed.tasks : clone(initialTasks),
        agents: Array.isArray(parsed.agents) ? parsed.agents : clone(initialAgents),
        messages: parsed.messages && typeof parsed.messages === 'object' ? parsed.messages : {},
      }
    }

    const legacy = localStorage.getItem('itteam-storage')
    if (legacy) {
      const parsed = JSON.parse(legacy)
      const state = parsed.state ?? parsed
      return {
        projects: Array.isArray(state.projects) ? state.projects : [],
        tasks: Array.isArray(state.tasks) ? state.tasks : clone(initialTasks),
        agents: Array.isArray(state.agents) ? state.agents : clone(initialAgents),
        messages: {},
      }
    }
  } catch {
    // fall through to default
  }

  return createDefaultDb()
}

let db = loadDb()

function persist() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      projects: db.projects,
      tasks: db.tasks,
      agents: db.agents,
      messages: db.messages,
    })
  )
}

function ok(data) {
  return { data }
}

function fail(message, status = 400) {
  return { error: message, status }
}

function findProject(id) {
  return db.projects.find((p) => p.id === id || String(p.id) === String(id))
}

function findTask(id) {
  return db.tasks.find((t) => t.id === id)
}

function moveTaskInDb(taskId, newStatus, newIndex) {
  const tasks = [...db.tasks]
  const taskIndex = tasks.findIndex((t) => t.id === taskId)
  if (taskIndex === -1) return null

  const [task] = tasks.splice(taskIndex, 1)
  task.status = newStatus

  const columnTasks = tasks.filter((t) => t.status === newStatus)
  columnTasks.splice(newIndex, 0, task)

  const otherTasks = tasks.filter((t) => t.status !== newStatus)
  db.tasks = [...otherTasks, ...columnTasks]
  persist()
  return task
}

function reorderColumnInDb(status, reorderedTasks) {
  db.tasks = [...db.tasks.filter((t) => t.status !== status), ...reorderedTasks]
  persist()
  return db.tasks
}

export function resetMockServer() {
  db = createDefaultDb()
  persist()
}

export function getMockDb() {
  return db
}

export function handleRequest(method, path, body = {}) {
  const normalizedPath = path.replace(/\/$/, '') || '/'

  try {
    if (method === 'POST' && normalizedPath === '/auth/login') {
      const { email, password } = body
      if (!email || !password) {
        return fail('Email и пароль обязательны')
      }
      if (!email.includes('@') || !email.includes('.')) {
        return fail('Некорректный email')
      }
      if (password.length < 3) {
        return fail('Пароль слишком короткий')
      }
      const token = `mock-token-${Date.now()}`
      const user = {
        name: email.split('@')[0],
        email,
        provider: 'email',
      }
      return ok({ token, user })
    }

    if (method === 'GET' && normalizedPath === '/projects') {
      return ok(db.projects)
    }

    if (method === 'POST' && normalizedPath === '/projects') {
      if (!body?.name?.trim()) {
        return fail('Укажите название проекта')
      }
      const project = {
        id: Date.now(),
        name: body.name.trim(),
        subtitle: body.subtitle || 'Новый • Спринт 1',
        description: body.description || '',
        progress: body.progress ?? 0,
        status: body.status || 'В работе',
        tasksDone: body.tasksDone ?? 0,
        deadline: body.deadline || 'Без срока',
      }
      db.projects.push(project)
      persist()
      return ok(project)
    }

    if (method === 'PUT' && normalizedPath.startsWith('/projects/')) {
      const id = normalizedPath.split('/')[2]
      const project = findProject(id)
      if (!project) return fail('Проект не найден', 404)
      Object.assign(project, body)
      persist()
      return ok(project)
    }

    if (method === 'DELETE' && normalizedPath.startsWith('/projects/')) {
      const id = normalizedPath.split('/')[2]
      const project = findProject(id)
      if (!project) return fail('Проект не найден', 404)
      const projectName = project.name
      db.projects = db.projects.filter((p) => p.id !== project.id)
      db.tasks = db.tasks.filter((t) => {
        if (t.projectId != null) return t.projectId !== project.id
        if (projectName) return t.project !== projectName
        return true
      })
      persist()
      return ok({ success: true })
    }

    if (method === 'GET' && normalizedPath === '/tasks') {
      return ok(db.tasks)
    }

    if (method === 'POST' && normalizedPath === '/tasks') {
      const assignee = body.assignee || 'Бизнес Аналитик'
      const agent = db.agents.find(
        (a) => a.name === assignee || a.id === body.assigneeAgentId
      )
      const task = {
        id: `task-${Date.now()}`,
        title: body.title || 'Новая задача',
        description: body.description || '',
        status: body.status || 'todo',
        priority: body.priority || 'Medium',
        projectId: body.projectId ?? null,
        project: body.project || '',
        assigneeAgentId: body.assigneeAgentId ?? agent?.id ?? null,
        assignee,
      }
      db.tasks.push(task)
      persist()
      return ok(task)
    }

    if (method === 'PUT' && normalizedPath.startsWith('/tasks/reorder-')) {
      const status = normalizedPath.replace('/tasks/reorder-', '')
      if (!body.reorderedColumn) return fail('Нет данных для сортировки')
      reorderColumnInDb(status, body.reorderedColumn)
      return ok(db.tasks)
    }

    if (method === 'PUT' && normalizedPath.startsWith('/tasks/')) {
      const id = normalizedPath.split('/')[2]
      const task = findTask(id)
      if (!task) return fail('Задача не найдена', 404)

      if (body.reorderedColumn && body.status) {
        reorderColumnInDb(body.status, body.reorderedColumn)
        return ok(db.tasks)
      }

      if (body.status != null && body.index != null) {
        const moved = moveTaskInDb(id, body.status, body.index)
        return ok(moved)
      }

      Object.assign(task, body)
      persist()
      return ok(task)
    }

    if (method === 'DELETE' && normalizedPath.startsWith('/tasks/')) {
      const id = normalizedPath.split('/')[2]
      if (!findTask(id)) return fail('Задача не найдена', 404)
      db.tasks = db.tasks.filter((t) => t.id !== id)
      persist()
      return ok({ success: true })
    }

    if (method === 'GET' && normalizedPath === '/agents') {
      return ok(db.agents)
    }

    if (method === 'GET' && normalizedPath.startsWith('/chat/')) {
      const parts = normalizedPath.split('/')
      const agentId = parts[2]
      if (parts[3] === 'history' || parts.length === 3) {
        if (!db.messages[agentId]) {
          db.messages[agentId] = sampleChatHistory[agentId]
            ? clone(sampleChatHistory[agentId])
            : []
          persist()
        }
        return ok(db.messages[agentId] || [])
      }
    }

    if (method === 'POST' && normalizedPath.match(/^\/chat\/[^/]+\/send$/)) {
      const agentId = normalizedPath.split('/')[2]
      const text = body.message?.trim()
      if (!text) return fail('Введите сообщение')

      if (!db.messages[agentId]) {
        db.messages[agentId] = []
      }

      const userMsg = {
        id: `msg-${Date.now()}`,
        from: 'user',
        text,
        time: formatTime(),
      }
      db.messages[agentId].push(userMsg)
      persist()

      const agentName = AGENT_NAMES[agentId] || 'Агент'
      const reply = `Спасибо за сообщение, ${agentName} обрабатывает запрос: ${text}`

      return ok({ userMessage: userMsg, reply })
    }

    return fail(`Маршрут не найден: ${method} ${path}`, 404)
  } catch (error) {
    return fail(error.message || 'Внутренняя ошибка сервера', 500)
  }
}
