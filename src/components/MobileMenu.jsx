import { useEffect } from 'react'
import SidebarPanel from './SidebarPanel'

export default function MobileMenu({ open, onOpen, onClose }) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={onOpen}
          aria-label="Открыть меню"
          className="md:hidden fixed top-4 left-4 z-40 w-10 h-10 rounded-xl border border-dark-border bg-dark-card flex items-center justify-center text-gray-300 hover:text-white transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M3 5H17M3 10H17M3 15H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      )}

      {open && (
        <button
          type="button"
          aria-label="Закрыть меню"
          className="md:hidden fixed inset-0 z-40 bg-black/60"
          onClick={onClose}
        />
      )}

      <aside
        className={`md:hidden fixed top-0 left-0 z-50 h-full w-[280px] max-w-[85vw] bg-dark-sidebar border-r border-dark-border transform transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : '-translate-x-full pointer-events-none'
        }`}
      >
        <div className="flex items-center justify-end px-4 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-dark-hover"
            aria-label="Закрыть"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M4 4L14 14M14 4L4 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <SidebarPanel onNavigate={onClose} />
      </aside>
    </>
  )
}
