import toast from 'react-hot-toast'

const DEV_BASE_URL = 'http://localhost:8000/api'

function normalizeBaseUrl(url) {
  if (!url) return ''
  return url.replace(/\/+$/, '')
}

const BASE_URL =
  normalizeBaseUrl(import.meta.env.VITE_API_URL) ||
  (import.meta.env.DEV ? DEV_BASE_URL : '/api')

function parseErrorMessage(data) {
  const detail = data?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg || JSON.stringify(item)).join(', ')
  }
  return 'Ошибка запроса'
}

async function apiRequest(endpoint, options = {}) {
  if (!endpoint || typeof endpoint !== 'string') {
    throw new Error('API endpoint is required')
  }

  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  const { skipAuth = false, ...fetchOptions } = options
  const token = localStorage.getItem('token')

  const headers = {
    ...(fetchOptions.body !== undefined &&
      !(fetchOptions.body instanceof URLSearchParams) && {
        'Content-Type': 'application/json',
      }),
    ...(!skipAuth && token && { Authorization: `Bearer ${token}` }),
    ...fetchOptions.headers,
  }

  let response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...fetchOptions,
      headers,
    })
  } catch {
    toast.error('Нет соединения с сервером')
    const error = new Error('Нет соединения с сервером')
    error.handledGlobally = true
    throw error
  }

  if (response.status === 401) {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    const publicPaths = ['/', '/login', '/register', '/privacy']
    if (!publicPaths.includes(window.location.pathname)) {
      window.location.href = '/login'
    }
    throw new Error('Unauthorized')
  }

  if (response.status === 204) {
    return null
  }

  const text = await response.text()
  let data = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      throw new Error('Некорректный ответ сервера')
    }
  }

  if (!response.ok) {
    const error = new Error(parseErrorMessage(data))
    error.status = response.status
    error.data = data

    if (response.status === 500) {
      toast.error('Ошибка сервера. Попробуйте позже')
      error.handledGlobally = true
    } else if (response.status === 429) {
      toast.error('Лимит запросов исчерпан на сегодня')
      error.handledGlobally = true
    }

    throw error
  }

  return data
}

export const auth = {
  register: (data) =>
    apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
      skipAuth: true,
    }),

  login: async ({ email, password }) => {
    const formData = new URLSearchParams()
    formData.append('username', email)
    formData.append('password', password)

    const data = await apiRequest('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData,
      skipAuth: true,
    })

    localStorage.setItem('token', data.access_token)

    const me = await apiRequest('/auth/me')
    const user = {
      id: me.id,
      name: me.name,
      email: me.email,
      provider: 'email',
    }
    localStorage.setItem('user', JSON.stringify(user))

    return { access_token: data.access_token, user }
  },

  getMe: () => apiRequest('/auth/me'),

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  },
}

export const projects = {
  getAll: () => apiRequest('/projects'),
  create: (data) =>
    apiRequest('/projects', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) =>
    apiRequest(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiRequest(`/projects/${id}`, { method: 'DELETE' }),
}

export const tasks = {
  getAll: (projectId) =>
    apiRequest(`/tasks${projectId ? `?project_id=${projectId}` : ''}`),
  create: (data) =>
    apiRequest('/tasks', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) =>
    apiRequest(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiRequest(`/tasks/${id}`, { method: 'DELETE' }),
  updateStatus: (id, status) =>
    apiRequest(`/tasks/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  assignSprint: (id, sprintId) =>
    apiRequest(`/tasks/${id}/sprint`, {
      method: 'PATCH',
      body: JSON.stringify({ sprint_id: sprintId }),
    }),
}

export const sprints = {
  getAll: (projectId) => apiRequest(`/sprints?project_id=${projectId}`),
  getById: (id) => apiRequest(`/sprints/${id}`),
  create: (data) =>
    apiRequest('/sprints', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) =>
    apiRequest(`/sprints/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiRequest(`/sprints/${id}`, { method: 'DELETE' }),
}

export const agents = {
  getAll: () => apiRequest('/agents'),
  create: (data) =>
    apiRequest('/agents', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) =>
    apiRequest(`/agents/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiRequest(`/agents/${id}`, { method: 'DELETE' }),
  createTask: (data) =>
    apiRequest('/agent/create-task', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
}

export const projectAgents = {
  getAll: (projectId) => apiRequest(`/projects/${projectId}/agents`),
  create: (projectId, data) =>
    apiRequest(`/projects/${projectId}/agents`, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'X-User-Role': 'po' },
    }),
  updatePrompt: (projectId, agentId, systemPrompt) =>
    apiRequest(`/projects/${projectId}/agents/${agentId}`, {
      method: 'PATCH',
      body: JSON.stringify({ system_prompt: systemPrompt }),
      headers: { 'X-User-Role': 'po' },
    }),
}

export const chat = {
  getHistory: (agentId, limit = 50) =>
    apiRequest(`/chat/history/${agentId}?limit=${limit}`),

  getMessages: (agentId) => apiRequest(`/chat/history/${agentId}?limit=50`),

  getProjectHistory: (projectId, agentId, limit = 50) =>
    apiRequest(`/projects/${projectId}/chats/${agentId}?limit=${limit}`),

  send: (agentId, message) =>
    apiRequest(`/chat/${agentId}`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),

  sendProject: (projectId, agentId, message) =>
    apiRequest(`/projects/${projectId}/chats/${agentId}`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),

  updateMessage: (messageId, message) =>
    apiRequest(`/chat/messages/${messageId}`, {
      method: 'PUT',
      body: JSON.stringify({ message }),
    }),

  deleteMessage: (messageId) =>
    apiRequest(`/chat/messages/${messageId}`, { method: 'DELETE' }),

  getGeneral: (projectId) => apiRequest(`/chat/general?project_id=${projectId}`),

  sendGeneral: (data) =>
    apiRequest('/chat/general', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
}

export const analysis = {
  run: (projectId, idea) =>
    apiRequest(`/projects/${projectId}/analyze`, {
      method: 'POST',
      body: JSON.stringify({ idea }),
      headers: { 'X-User-Role': 'po' },
    }),
  getJob: (projectId, jobId) =>
    apiRequest(`/projects/${projectId}/analyze/jobs/${jobId}`),
  waitForJob: async (projectId, jobId, { intervalMs = 3000, maxWaitMs = 900000 } = {}) => {
    const started = Date.now()
    while (Date.now() - started < maxWaitMs) {
      const status = await apiRequest(`/projects/${projectId}/analyze/jobs/${jobId}`)
      if (status.status === 'completed' && status.result) {
        return status.result
      }
      if (status.status === 'failed') {
        throw new Error(status.error || 'Анализ не удался')
      }
      await new Promise((resolve) => setTimeout(resolve, intervalMs))
    }
    throw new Error('Превышено время ожидания анализа')
  },
  getHistory: (projectId) =>
    apiRequest(`/projects/${projectId}/analysis-history`),
}

export const artifacts = {
  getPending: (projectId) =>
    apiRequest(`/projects/${projectId}/artifacts/pending`),
  getAll: (projectId) => apiRequest(`/projects/${projectId}/artifacts`),
  approve: (projectId, artifactId) =>
    apiRequest(`/projects/${projectId}/artifacts/${artifactId}/approve`, {
      method: 'POST',
      headers: { 'X-User-Role': 'po' },
    }),
  reject: (projectId, artifactId, feedback) =>
    apiRequest(`/projects/${projectId}/artifacts/${artifactId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ feedback }),
      headers: { 'X-User-Role': 'po' },
    }),
}

export const approvals = {
  getAll: (projectId, pendingOnly = true) =>
    apiRequest(
      `/projects/${projectId}/approvals?pending_only=${pendingOnly ? 'true' : 'false'}`
    ),
  approve: (projectId, taskId) =>
    apiRequest(`/projects/${projectId}/approvals/${taskId}/approve`, {
      method: 'POST',
      headers: { 'X-User-Role': 'po' },
    }),
  reject: (projectId, taskId, reason) =>
    apiRequest(`/projects/${projectId}/approvals/${taskId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
      headers: { 'X-User-Role': 'po' },
    }),
}
