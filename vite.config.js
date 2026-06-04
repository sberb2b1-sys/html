import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

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

function mockAssignTaskApi() {
  return {
    name: 'mock-assign-task-api',
    configureServer(server) {
      server.middlewares.use('/api/mock/assign-task', (req, res, next) => {
        if (req.method !== 'POST') {
          next()
          return
        }

        let body = ''
        req.on('data', (chunk) => {
          body += chunk
        })
        req.on('end', () => {
          res.setHeader('Content-Type', 'application/json')
          res.statusCode = 200
          res.end(JSON.stringify({ ok: true, received: JSON.parse(body || '{}') }))
        })
      })
    },
  }
}

function mockChatApi() {
  return {
    name: 'mock-chat-api',
    configureServer(server) {
      server.middlewares.use('/api/mock/chat', (req, res, next) => {
        if (req.method !== 'POST') {
          next()
          return
        }

        let body = ''
        req.on('data', (chunk) => {
          body += chunk
        })
        req.on('end', () => {
          const { message, agentId } = JSON.parse(body || '{}')
          const agentName = AGENT_NAMES[agentId] || 'Агент'
          const reply = `Спасибо за сообщение, ${agentName} обрабатывает запрос: ${message}`

          res.setHeader('Content-Type', 'application/json')
          res.statusCode = 200
          res.end(JSON.stringify({ reply }))
        })
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), mockAssignTaskApi(), mockChatApi()],
})
