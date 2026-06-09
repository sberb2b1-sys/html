import ReactMarkdown from 'react-markdown'
import remarkBreaks from 'remark-breaks'

export default function ChatMessage({
  msg,
  displayText,
  agent,
  editingId,
  editText,
  onEditTextChange,
  onSaveEdit,
  onCancelEdit,
  savingEdit,
  hoveredId,
  onMouseEnter,
  onMouseLeave,
  onStartEdit,
  onDelete,
  deletingId,
  onCreateTask,
}) {
  const isUser = msg.from === 'user'
  const isEditing = editingId === msg.id && isUser

  return (
    <div
      className={`group flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {!isUser && (
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-inter-semibold text-white shrink-0 mt-1"
          style={{ backgroundColor: agent.avatarColor }}
        >
          {agent.name.charAt(0)}
        </div>
      )}

      <div className={`relative max-w-[70%] ${isUser ? 'items-end' : ''}`}>
        {isEditing ? (
          <div className="flex flex-col gap-2">
            <textarea
              value={editText}
              onChange={(e) => onEditTextChange(e.target.value)}
              rows={3}
              className="chat-message-input px-3 py-2 rounded-lg border border-dark-border bg-dark-card text-sm text-white outline-none focus:border-accent-purple/50 resize-y w-full min-w-[200px]"
            />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={onSaveEdit}
                disabled={savingEdit}
                className="text-xs text-accent-violet hover:underline disabled:opacity-50"
              >
                {savingEdit ? 'Сохранение...' : 'Сохранить'}
              </button>
              <button
                type="button"
                onClick={onCancelEdit}
                disabled={savingEdit}
                className="text-xs text-gray-500 hover:underline disabled:opacity-50"
              >
                Отменить
              </button>
            </div>
          </div>
        ) : (
          <>
            <div
              className={`px-4 py-3 rounded-xl text-sm ${
                isUser
                  ? 'chat-message-user bg-accent-purple text-white rounded-tr-sm'
                  : 'chat-message-agent bg-dark-card border border-dark-border text-gray-200 rounded-tl-sm'
              }`}
            >
              {isUser ? (
                displayText
              ) : (
                <div className="agent-message-markdown">
                  <ReactMarkdown remarkPlugins={[remarkBreaks]}>{displayText}</ReactMarkdown>
                </div>
              )}
            </div>
            <p className={`text-xs text-gray-500 mt-1 ${isUser ? 'text-right' : ''}`}>
              {msg.time}
            </p>
            {!isUser && onCreateTask && (
              <button
                type="button"
                onClick={() => onCreateTask(msg)}
                className="mt-2 text-xs text-accent-violet hover:text-accent-purple transition-colors flex items-center gap-1"
              >
                📋 Создать задачу
              </button>
            )}
          </>
        )}

        {isUser && hoveredId === msg.id && !isEditing && (
          <div className="absolute -left-14 top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => onStartEdit(msg)}
              className="text-sm hover:scale-110 transition-transform"
              title="Редактировать"
            >
              ✏️
            </button>
            <button
              type="button"
              onClick={() => onDelete(msg)}
              disabled={deletingId === msg.id}
              className="text-sm hover:scale-110 transition-transform disabled:opacity-40 disabled:hover:scale-100"
              title="Удалить"
            >
              {deletingId === msg.id ? '…' : '🗑️'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
