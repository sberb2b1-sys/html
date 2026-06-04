export default function Header({ title, subtitle, actionLabel, onAction }) {
  return (
    <div className="flex items-center justify-between px-8 py-5 border-b border-dark-border bg-dark">
      <div>
        <h1 className="text-xl font-inter-bold text-white">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>
      {actionLabel && (
        <button type="button" className="btn-primary" onClick={onAction}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 3V13M3 8H13" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          {actionLabel}
        </button>
      )}
    </div>
  )
}
