import { useState } from 'react'
import { useAppStore } from '../store/useAppStore'

export default function GeneralChatPage() {
  const [input, setInput] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')
  const [hoveredId, setHoveredId] = useState(null)

  const messages = useAppStore((s) => s.generalChatMessages)
  const sendGeneralChatMessage = useAppStore((s) => s.sendGeneralChatMessage)
  const updateGeneralChatMessage = useAppStore((s) => s.updateGeneralChatMessage)
  const deleteGeneralChatMessage = useAppStore((s) => s.deleteGeneralChatMessage)

  const handleSend = () => {
    if (!input.trim()) return
    sendGeneralChatMessage(input)
    setInput('')
  }

  const startEdit = (msg) => {
    setEditingId(msg.id)
    setEditText(msg.text)
  }

  const saveEdit = () => {
    if (editingId && editText.trim()) {
      updateGeneralChatMessage(editingId, editText.trim())
    }
    setEditingId(null)
    setEditText('')
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="px-8 py-5 border-b border-dark-border">
        <h1 className="text-xl font-inter-bold text-white">Общий чат команды</h1>
        <p className="text-sm text-gray-500 mt-1">Сообщение видят все агенты (имитация)</p>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-4">
        {messages.length === 0 && (
          <p className="text-sm text-gray-500 text-center mt-12">
            Напишите первое сообщение команде
          </p>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.from === 'user' ? 'flex-row-reverse' : ''}`}
            onMouseEnter={() => setHoveredId(msg.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            {msg.from === 'agent' && (
              <div className="w-8 h-8 rounded-full bg-accent-purple flex items-center justify-center text-xs text-white shrink-0">
                AI
              </div>
            )}
            <div className={`max-w-[70%] relative ${msg.from === 'user' ? 'items-end' : ''}`}>
              {editingId === msg.id ? (
                <div className="flex flex-col gap-2">
                  <input
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-dark-border bg-dark-card text-sm text-white outline-none"
                    onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                  />
                  <div className="flex gap-2">
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
                    {msg.text}
                  </div>
                  <p className={`text-xs text-gray-500 mt-1 ${msg.from === 'user' ? 'text-right' : ''}`}>
                    {msg.time}
                  </p>
                </>
              )}
              {msg.from === 'user' && hoveredId === msg.id && editingId !== msg.id && (
                <div className={`absolute top-0 flex gap-1 ${msg.from === 'user' ? '-left-16' : '-right-16'}`}>
                  <button type="button" onClick={() => startEdit(msg)} className="text-xs opacity-70 hover:opacity-100" title="Редактировать">✏️</button>
                  <button type="button" onClick={() => deleteGeneralChatMessage(msg.id)} className="text-xs opacity-70 hover:opacity-100" title="Удалить">🗑️</button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="px-8 py-4 border-t border-dark-border">
        <div className="flex items-center gap-3 max-w-3xl">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Сообщение для всей команды..."
            className="flex-1 px-4 py-3 rounded-xl border border-dark-border bg-dark-card text-sm text-white placeholder:text-gray-500 outline-none focus:border-accent-purple/50"
          />
          <button type="button" onClick={handleSend} disabled={!input.trim()} className="btn-primary py-3">
            Отправить
          </button>
        </div>
      </div>
    </div>
  )
}
