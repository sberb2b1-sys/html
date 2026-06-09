import { create } from 'zustand'
import toast from 'react-hot-toast'
import { auth, projects, tasks, agents, chat } from '../api/client'
import {
  mapAgentFromApi,
  mapProjectFromApi,
  mapProjectToApi,
  mapTaskFromApi,
  mapTaskToApi,
  mapChatResponse,
  mapChatHistory,
  parseChatMessageId,
} from '../api/mappers'
import { safeLog } from '../utils/mask'
import { agents as fallbackAgents } from '../mocks/agents'

const clone = (data) => JSON.parse(JSON.stringify(data))

const getEmptyState = () => ({
  projects: [],
  tasks: [],
  agents: clone(fallbackAgents),
  currentUser: null,
  selectedAgentId: null,
  chatMessages: {},
  isAgentTyping: false,
  maskPdn: true,
  isHydrated: false,
  isAuthReady: false,
  userRole: 'po',
  generalChatMessages: [],
})

async function fetchLists(get) {
  const [rawProjects, rawTasks, rawAgents] = await Promise.all([
    projects.getAll(),
    tasks.getAll(),
    agents.getAll(),
  ])

  const mappedAgents = rawAgents.map(mapAgentFromApi)
  const mappedTasks = rawTasks.map((t) =>
    mapTaskFromApi(t, mappedAgents, rawProjects)
  )
  const mappedProjects = rawProjects.map((p) =>
    mapProjectFromApi(p, rawTasks)
  )

  return { projects: mappedProjects, tasks: mappedTasks, agents: mappedAgents }
}

export const useStore = create((set, get) => ({
  ...getEmptyState(),

  initSession: async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      set({ isAuthReady: true })
      return
    }

    try {
      const user = await auth.getMe()
      const storedUser = localStorage.getItem('user')
      const currentUser = storedUser
        ? { ...JSON.parse(storedUser), ...user, provider: 'email' }
        : { ...user, provider: 'email' }

      set({ currentUser, isAuthReady: true })
      await get().loadAllData()
    } catch {
      auth.logout()
      set({ ...getEmptyState(), isAuthReady: true })
    }
  },

  loadAllData: async () => {
    try {
      const data = await fetchLists(get)
      set({ ...data, isHydrated: true })
    } catch (error) {
      toast.error(`Ошибка: ${error.message || 'не удалось загрузить данные'}`)
    }
  },

  login: async (email, password) => {
    try {
      const { user } = await auth.login({ email, password })
      set({ currentUser: user })
      await get().loadAllData()
      return user
    } catch (error) {
      const message =
        error.status === 401 || error.message === 'Unauthorized'
          ? 'Неверный email или пароль'
          : error.message || 'не удалось войти'
      toast.error(message)
      throw new Error(message)
    }
  },

  register: async (name, email, password) => {
    try {
      await auth.register({ name, email, password })
      const user = await get().login(email, password)
      toast.success('Регистрация успешна')
      return user
    } catch (error) {
      toast.error(error.message || 'не удалось зарегистрироваться')
      throw error
    }
  },

  logout: () => {
    auth.logout()
    set(getEmptyState())
    set({ isAuthReady: true })
    toast.success('Вы вышли из системы')
  },

  setCurrentUser: (user) => {
    set({ currentUser: user })
    if (user) {
      localStorage.setItem('user', JSON.stringify(user))
    }
    safeLog('[auth] current user updated', user, { enabled: get().maskPdn })
  },

  setMaskPdn: (enabled) => set({ maskPdn: enabled }),
  toggleMaskPdn: () => set((state) => ({ maskPdn: !state.maskPdn })),
  setUserRole: (role) => set({ userRole: role }),

  updateChatMessage: async (agentId, messageId, text) => {
    const dbId = parseChatMessageId(messageId)
    if (!dbId) {
      set((state) => ({
        chatMessages: {
          ...state.chatMessages,
          [agentId]: (state.chatMessages[agentId] || []).map((m) =>
            m.id === messageId ? { ...m, text } : m
          ),
        },
      }))
      return true
    }

    try {
      const response = await chat.updateMessage(dbId, text)
      const { userMessage } = mapChatResponse(response)
      set((state) => ({
        chatMessages: {
          ...state.chatMessages,
          [agentId]: (state.chatMessages[agentId] || []).map((m) =>
            m.id === messageId ? { ...m, text: userMessage.text } : m
          ),
        },
      }))
      toast.success('Сообщение обновлено')
      return true
    } catch (error) {
      toast.error(error.message || 'Не удалось обновить сообщение')
      return false
    }
  },

  deleteChatMessage: async (agentId, messageId) => {
    const dbId = parseChatMessageId(messageId)
    if (!dbId) {
      set((state) => ({
        chatMessages: {
          ...state.chatMessages,
          [agentId]: (state.chatMessages[agentId] || []).filter((m) => m.id !== messageId),
        },
      }))
      return true
    }

    try {
      await chat.deleteMessage(dbId)
      set((state) => ({
        chatMessages: {
          ...state.chatMessages,
          [agentId]: (state.chatMessages[agentId] || []).filter(
            (m) => m.id !== messageId && m.id !== `msg-${dbId}-agent`
          ),
        },
      }))
      toast.success('Сообщение удалено')
      return true
    } catch (error) {
      toast.error(error.message || 'Не удалось удалить сообщение')
      return false
    }
  },

  loadChatMessages: async (agentId) => {
    if (!agentId) return
    try {
      const records = await chat.getMessages(agentId)
      set((state) => ({
        chatMessages: {
          ...state.chatMessages,
          [agentId]: mapChatHistory(records),
        },
      }))
    } catch (error) {
      toast.error(error.message || 'Не удалось загрузить историю чата')
    }
  },

  sendGeneralChatMessage: (message) => {
    const text = message.trim()
    if (!text) return

    const time = new Date().toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    })
    const userMsg = {
      id: `gen-user-${Date.now()}`,
      from: 'user',
      text,
      time,
    }
    const agentMsg = {
      id: `gen-agent-${Date.now()}`,
      from: 'agent',
      text: 'Сообщение получено командой.',
      time,
    }

    set((state) => ({
      generalChatMessages: [...state.generalChatMessages, userMsg, agentMsg],
    }))
  },

  updateGeneralChatMessage: (messageId, text) => {
    set((state) => ({
      generalChatMessages: state.generalChatMessages.map((m) =>
        m.id === messageId ? { ...m, text } : m
      ),
    }))
  },

  deleteGeneralChatMessage: (messageId) => {
    set((state) => ({
      generalChatMessages: state.generalChatMessages.filter((m) => m.id !== messageId),
    }))
  },

  loadProjects: async () => {
    try {
      const rawProjects = await projects.getAll()
      const rawTasks = await tasks.getAll()
      const mappedAgents = get().agents
      set({
        projects: rawProjects.map((p) => mapProjectFromApi(p, rawTasks)),
        tasks: rawTasks.map((t) =>
          mapTaskFromApi(t, mappedAgents, rawProjects)
        ),
      })
    } catch (error) {
      toast.error(`Ошибка: ${error.message || 'не удалось загрузить проекты'}`)
    }
  },

  createProject: async (data) => {
    try {
      await projects.create(mapProjectToApi(data))
      await get().loadProjects()
      await get().loadTasks()
      toast.success('Проект создан')
    } catch (error) {
      toast.error(`Ошибка: ${error.message || 'не удалось создать проект'}`)
    }
  },

  updateProject: async (id, data) => {
    try {
      const payload = {}
      if (data.name != null) payload.name = data.name
      if (data.description != null) payload.description = data.description
      if (data.deadline != null) payload.deadline = data.deadline

      await projects.update(id, payload)
      await get().loadProjects()
      toast.success('Проект обновлён')
    } catch (error) {
      toast.error(`Ошибка: ${error.message || 'не удалось обновить проект'}`)
    }
  },

  deleteProject: async (id) => {
    try {
      await projects.delete(id)
      await get().loadProjects()
      await get().loadTasks()
      toast.success('Проект удалён')
    } catch (error) {
      toast.error(`Ошибка: ${error.message || 'не удалось удалить проект'}`)
    }
  },

  loadTasks: async (projectId) => {
    try {
      const rawTasks = await tasks.getAll(projectId)
      const rawProjects = await projects.getAll()
      const mappedAgents = get().agents
      set({
        tasks: rawTasks.map((t) =>
          mapTaskFromApi(t, mappedAgents, rawProjects)
        ),
      })
    } catch (error) {
      toast.error(`Ошибка: ${error.message || 'не удалось загрузить задачи'}`)
    }
  },

  createTask: async (data) => {
    try {
      await tasks.create(mapTaskToApi(data, get().agents))
      await get().loadTasks()
      await get().loadProjects()
      toast.success('Задача создана')
    } catch (error) {
      toast.error(`Ошибка: ${error.message || 'не удалось создать задачу'}`)
    }
  },

  updateTask: async (id, data) => {
    try {
      await tasks.update(id, mapTaskToApi(data, get().agents))
      await get().loadTasks()
      toast.success('Задача обновлена')
    } catch (error) {
      toast.error(`Ошибка: ${error.message || 'не удалось обновить задачу'}`)
    }
  },

  deleteTask: async (id) => {
    try {
      await tasks.delete(id)
      await get().loadTasks()
      await get().loadProjects()
      toast.success('Задача удалена')
    } catch (error) {
      toast.error(`Ошибка: ${error.message || 'не удалось удалить задачу'}`)
    }
  },

  updateTaskStatus: async (id, status) => {
    try {
      await tasks.updateStatus(id, status)
      await get().loadTasks()
    } catch (error) {
      toast.error(`Ошибка: ${error.message || 'не удалось обновить статус'}`)
    }
  },

  reorderColumn: (status, reorderedTasks) => {
    set((state) => ({
      tasks: [
        ...state.tasks.filter((t) => t.status !== status),
        ...reorderedTasks,
      ],
    }))
  },

  loadAgents: async () => {
    try {
      const rawAgents = await agents.getAll()
      set({ agents: rawAgents.map(mapAgentFromApi) })
    } catch (error) {
      toast.error(`Ошибка: ${error.message || 'не удалось загрузить агентов'}`)
    }
  },

  sendMessageToAgent: async (message, agentId) => {
    const text = message.trim()
    if (!text || !agentId) {
      toast.error('Ошибка: введите сообщение')
      return
    }

    const userMessage = {
      id: `msg-pending-user-${Date.now()}`,
      from: 'user',
      text,
      time: new Date().toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    }

    set((state) => ({
      isAgentTyping: true,
      chatMessages: {
        ...state.chatMessages,
        [agentId]: [...(state.chatMessages[agentId] || []), userMessage],
      },
    }))

    try {
      const response = await chat.send(agentId, text)
      const { userMessage: savedUser, agentMessage } = mapChatResponse(response)

      set((state) => {
        const history = state.chatMessages[agentId] || []
        const withoutPending = history.filter((m) => m.id !== userMessage.id)
        return {
          chatMessages: {
            ...state.chatMessages,
            [agentId]: [...withoutPending, savedUser, agentMessage],
          },
          isAgentTyping: false,
        }
      })
    } catch (error) {
      set({ isAgentTyping: false })
      toast.error(error.message || 'не удалось отправить сообщение')
    }
  },

  getTasksByStatus: (status) => get().tasks.filter((t) => t.status === status),

  addProject: (data) => get().createProject(data),
  addTask: (data) => get().createTask(data),
}))
