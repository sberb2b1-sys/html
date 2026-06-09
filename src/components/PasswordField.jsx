import { useState } from 'react'

export default function PasswordField({
  id,
  value,
  onChange,
  onKeyDown,
  placeholder = '••••••••',
  className = '',
}) {
  const [visible, setVisible] = useState(false)

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border border-dark-border bg-dark-card ${className}`}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
        <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="#6B7280" strokeWidth="1.2" />
        <path d="M5 7V5C5 3.34 6.34 2 8 2C9.66 2 11 3.34 11 5V7" stroke="#6B7280" strokeWidth="1.2" />
      </svg>
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-sm text-white placeholder:text-gray-500 outline-none"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="text-gray-500 hover:text-gray-300 transition-colors shrink-0"
        aria-label={visible ? 'Скрыть пароль' : 'Показать пароль'}
      >
        {visible ? (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 2L14 14M6.5 6.5C6.2 6.8 6 7.4 6 8C6 9.1 6.9 10 8 10C8.6 10 9.2 9.8 9.5 9.5M3.3 3.7C2.2 4.6 1.4 5.7 1 6.5C1 6.5 3 11.5 8 11.5C9.1 11.5 10.1 11.2 11 10.7M12.7 9.3C13.5 8.4 14.2 7.3 15 6.5C15 6.5 13 1.5 8 1.5C7.2 1.5 6.4 1.7 5.7 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M1 8C1 8 3.5 3 8 3C12.5 3 15 8 15 8C15 8 12.5 13 8 13C3.5 13 1 8 1 8Z" stroke="currentColor" strokeWidth="1.2" />
            <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        )}
      </button>
    </div>
  )
}
