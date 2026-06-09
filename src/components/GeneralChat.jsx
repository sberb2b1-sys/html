import { useState } from 'react'

export default function GeneralChat({ messages, projectName, onSend }) {
  const [input, setInput] = useState('')

  const handleSend = () => {
    if (!input.trim()) return
    onSend(input)
    setInput('')
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="px-8 py-5 border-b border-dark-border">
        <h1 className="text-xl font-inter-bold text-white">Общий чат</h1>
        <p className="text-sm text-gray-500 mt-1">
          {projectName ? `Проект: ${projectName}` : 'Выберите проект'} — сообщения видны всем участникам
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-4">
        {messages.length === 0 && (
          <p className="text-sm text-gray-500 text-center mt-12">Напишите первое сообщение команде</p>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className="flex flex-col gap-1 max-w-[70%]">
            <span className="text-xs text-gray-500">{msg.userName || 'Участник'}</span>
            <div className="px-4 py-3 rounded-xl bg-dark-card border border-dark-border text-sm text-gray-200">
              {msg.text}
            </div>
            <span className="text-xs text-gray-600">{msg.time}</span>
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
