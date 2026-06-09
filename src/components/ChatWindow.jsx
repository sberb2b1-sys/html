import { useState } from 'react'
import ChatMessage from './ChatMessage'
import CreateTaskModal from './CreateTaskModal'
import { useStore } from '../store/useStore'
import { maskPersonalData } from '../utils/mask'
import {
  extractTaskFromMessage,
  resolveAgentIdFromHint,
} from '../utils/extractTaskFromMessage'

export default function ChatWindow({ onSend, selectedAgentId: selectedAgentIdProp }) {
  const [input, setInput] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')
  const [hoveredId, setHoveredId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [savingEdit, setSavingEdit] = useState(false)
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [taskInitialValues, setTaskInitialValues] = useState(null)

  const agents = useStore((s) => s.agents)
  const createTaskFromAgent = useStore((s) => s.createTaskFromAgent)
  const chatMessages = useStore((s) => s.chatMessages)
  const isAgentTyping = useStore((s) => s.isAgentTyping)
  const maskPdn = useStore((s) => s.maskPdn)
  const updateChatMessage = useStore((s) => s.updateChatMessage)
  const deleteChatMessage = useStore((s) => s.deleteChatMessage)

  const selectedAgentId = selectedAgentIdProp
  const agent = selectedAgentId ? agents.find((a) => a.id === selectedAgentId) : null
  const messages = selectedAgentId ? (chatMessages[selectedAgentId] || []) : []

  const formatMessage = (text) => maskPersonalData(text, { enabled: maskPdn })

  const handleSend = () => {
    if (!input.trim() || !selectedAgentId || isAgentTyping) return
    onSend(input.trim())
    setInput('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const startEdit = (msg) => {
    setEditingId(msg.id)
    setEditText(msg.text)
  }

  const saveEdit = async () => {
    if (!editingId || !editText.trim() || !selectedAgentId || savingEdit) return
    setSavingEdit(true)
    try {
      const ok = await updateChatMessage(selectedAgentId, editingId, editText.trim())
      if (ok) {
        setEditingId(null)
        setEditText('')
      }
    } finally {
      setSavingEdit(false)
    }
  }

  const handleDelete = async (msg) => {
    if (!selectedAgentId || deletingId) return
    setDeletingId(msg.id)
    try {
      await deleteChatMessage(selectedAgentId, msg.id)
    } finally {
      setDeletingId(null)
    }
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditText('')
  }

  const openTaskModalFromMessage = (msg) => {
    const extracted = extractTaskFromMessage(msg.text)
    const assigneeFromHint = resolveAgentIdFromHint(extracted?.assigneeHint, agents)
    setTaskInitialValues({
      title: extracted?.title || msg.text.slice(0, 120).trim() || 'Новая задача',
      description: extracted?.description || msg.text,
      assigneeAgentId: assigneeFromHint || selectedAgentId || '',
      priority: 'Medium',
    })
    setTaskModalOpen(true)
  }

  const handleCreateTask = async (data) => {
    const ok = await createTaskFromAgent(data)
    if (ok) {
      setTaskModalOpen(false)
      setTaskInitialValues(null)
    }
  }

  if (!selectedAgentId || !agent) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-w-0 bg-dark p-8">
        <div className="w-16 h-16 rounded-2xl bg-[rgba(124,58,237,0.15)] flex items-center justify-center mb-6">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" stroke="#7C6FF7" strokeWidth="1.5" />
          </svg>
        </div>
        <h2 className="text-lg font-inter-semibold text-white mb-2">Выберите агента, чтобы начать диалог</h2>
        <p className="text-sm text-gray-500 text-center max-w-sm">Нажмите на агента в списке слева</p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-dark">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-dark-border">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-inter-semibold text-white shrink-0"
          style={{ backgroundColor: agent.avatarColor }}
        >
          {agent.name.charAt(0)}
        </div>
        <div>
          <p className="text-sm font-inter-semibold text-white">{agent.name}</p>
          <div className="flex items-center gap-1.5">
            <span className="online-dot" />
            <span className="text-xs text-gray-500">{agent.status} • {agent.role}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4">
        {messages.length === 0 && !isAgentTyping && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-gray-500">Начните диалог — напишите первое сообщение</p>
          </div>
        )}

        {messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            msg={msg}
            agent={agent}
            displayText={formatMessage(msg.text)}
            editingId={editingId}
            editText={editText}
            onEditTextChange={setEditText}
            onSaveEdit={saveEdit}
            onCancelEdit={cancelEdit}
            savingEdit={savingEdit}
            hoveredId={hoveredId}
            onMouseEnter={() => setHoveredId(msg.id)}
            onMouseLeave={() => setHoveredId(null)}
            onStartEdit={startEdit}
            onDelete={handleDelete}
            deletingId={deletingId}
            onCreateTask={openTaskModalFromMessage}
          />
        ))}

        {isAgentTyping && (
          <div className="flex items-center gap-2 px-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-inter-semibold text-white shrink-0"
              style={{ backgroundColor: agent.avatarColor }}
            >
              {agent.name.charAt(0)}
            </div>
            <div className="flex items-center gap-1 px-3 py-2 rounded-full bg-dark-card border border-dark-border">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-pulse" />
              <span className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-pulse" style={{ animationDelay: '0.2s' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-pulse" style={{ animationDelay: '0.4s' }} />
              <span className="text-xs text-gray-500 ml-1">печатает...</span>
            </div>
          </div>
        )}
      </div>

      <div className="px-6 py-4 border-t border-dark-border">
        <div className="flex items-end gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={3}
            placeholder="Напишите сообщение агенту... (Enter — отправить, Shift+Enter — новая строка)"
            disabled={isAgentTyping}
            className="chat-message-input flex-1 px-4 py-3 rounded-xl border border-dark-border bg-dark-card text-sm text-white placeholder:text-gray-500 outline-none focus:border-accent-purple/50 disabled:opacity-50 resize-y min-h-[48px] max-h-[200px]"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || isAgentTyping}
            className="px-4 py-3 rounded-xl flex items-center justify-center gap-2 shrink-0 text-sm font-inter-semibold text-white disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #3B82F6 100%)' }}
          >
            Отправить
          </button>
        </div>
      </div>

      <CreateTaskModal
        open={taskModalOpen}
        agents={agents}
        initialValues={taskInitialValues}
        onClose={() => {
          setTaskModalOpen(false)
          setTaskInitialValues(null)
        }}
        onSave={handleCreateTask}
      />
    </div>
  )
}
