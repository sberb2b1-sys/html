import { Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkBreaks from 'remark-breaks'
import logoUrl from '../assets/logo.svg'
import privacyText from '../../PRIVACY.md?raw'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0F172A] text-white font-inter">
      <header className="border-b border-white/10 bg-[#0F172A]/90 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img src={logoUrl} alt="IT Team" className="w-8 h-8" />
            <span className="text-base font-inter-bold">IT Team</span>
          </Link>
          <Link to="/register" className="text-sm text-accent-violet hover:underline">
            Регистрация
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 md:py-14">
        <article className="agent-message-markdown prose-invert text-slate-300 text-sm leading-relaxed">
          <ReactMarkdown remarkPlugins={[remarkBreaks]}>{privacyText}</ReactMarkdown>
        </article>
      </main>
    </div>
  )
}
