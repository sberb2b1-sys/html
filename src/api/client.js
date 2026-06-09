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
    const hint = import.meta.env.DEV
      ? 'Запустите бэкенд: cd backend && uvicorn main:app --reload --port 8000'
      : 'API-сервер недоступен. Проверьте, что бэкенд развёрнут (api.itteam.tech).'
    throw new Error(`Не удалось подключиться к серверу. ${hint}`)
  }

  if (response.status === 401) {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    if (!window.location.pathname.startsWith('/login') && window.location.pathname !== '/') {
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
}

export const agents = {
  getAll: () => apiRequest('/agents'),
}

export const chat = {
  getMessages: (agentId) => apiRequest(`/chat/${agentId}/messages`),

  send: (agentId, message) =>
    apiRequest(`/chat/${agentId}`, {
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
}
