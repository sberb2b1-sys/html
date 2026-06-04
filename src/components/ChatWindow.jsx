import { useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { maskPersonalData } from '../utils/mask'

export default function ChatWindow({ onSend, selectedAgentId: selectedAgentIdProp }) {
  const [input, setInput] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')
  const [hoveredId, setHoveredId] = useState(null)

  const storeSelectedAgentId = useAppStore((s) => s.selectedAgentId)
  const agents = useAppStore((s) => s.agents)
  const chatMessages = useAppStore((s) => s.chatMessages)
  const isAgentTyping = useAppStore((s) => s.isAgentTyping)
  const maskPdn = useAppStore((s) => s.maskPdn)
  const updateChatMessage = useAppStore((s) => s.updateChatMessage)
  const deleteChatMessage = useAppStore((s) => s.deleteChatMessage)

  const selectedAgentId = selectedAgentIdProp !== undefined ? selectedAgentIdProp : storeSelectedAgentId
  const agent = selectedAgentId ? agents.find((a) => a.id === selectedAgentId) : null
  const messages = selectedAgentId ? (chatMessages[selectedAgentId] || []) : []

  const formatMessage = (text) => maskPersonalData(text, { enabled: maskPdn })

  const handleSend = () => {
    if (!input.trim() || !selectedAgentId || isAgentTyping) return
    onSend(input)
    setInput('')
  }

  const startEdit = (msg) => {
    setEditingId(msg.id)
    setEditText(msg.text)
  }

  const saveEdit = () => {
    if (editingId && editText.trim() && selectedAgentId) {
      updateChatMessage(selectedAgentId, editingId, editText.trim())
    }
    setEditingId(null)
    setEditText('')
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
          <div
            key={msg.id}
            className={`group flex gap-3 ${msg.from === 'user' ? 'flex-row-reverse' : ''}`}
            onMouseEnter={() => setHoveredId(msg.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            {msg.from === 'agent' && (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-inter-semibold text-white shrink-0 mt-1"
                style={{ backgroundColor: agent.avatarColor }}
              >
                {agent.name.charAt(0)}
              </div>
            )}
            <div className={`relative max-w-[70%] ${msg.from === 'user' ? 'items-end' : ''}`}>
              {editingId === msg.id && msg.from === 'user' ? (
                <div className="flex flex-col gap-2">
                  <input
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-dark-border bg-dark-card text-sm text-white outline-none"
                    onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                  />
                  <div className="flex gap-2 justify-end">
                    <button type="button" onClick={saveEdit} className="text-xs text-accent-violet">Сохранить</button>
                    <button type="button" onClick={() => setEditingId(null)} className="text-xs text-gray-500">Отмена</button>
                  </div>
                </div>
              ) : (
                <>
                  <div
                    className={`px-4 py-3 rounded-xl text-sm leading-relaxed ${
                      msg.from === 'user'
                        ? 'bg-accent-purple text-white rounded-tr-sm'
                        : 'bg-dark-card border border-dark-border text-gray-200 rounded-tl-sm'
                    }`}
                  >
                    {formatMessage(msg.text)}
                  </div>
                  <p className={`text-xs text-gray-500 mt-1 ${msg.from === 'user' ? 'text-right' : ''}`}>
                    {msg.time}
                  </p>
                </>
              )}
              {msg.from === 'user' && hoveredId === msg.id && editingId !== msg.id && (
                <div className="absolute -left-14 top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button type="button" onClick={() => startEdit(msg)} title="Редактировать">✏️</button>
                  <button type="button" onClick={() => deleteChatMessage(selectedAgentId, msg.id)} title="Удалить">🗑️</button>
                </div>
              )}
            </div>
          </div>
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
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
            placeholder="Напишите сообщение агенту..."
            disabled={isAgentTyping}
            className="flex-1 px-4 py-3 rounded-xl border border-dark-border bg-dark-card text-sm text-white placeholder:text-gray-500 outline-none focus:border-accent-purple/50 disabled:opacity-50"
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
    </div>
  )
}
