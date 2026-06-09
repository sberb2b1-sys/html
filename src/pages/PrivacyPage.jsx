import { Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkBreaks from 'remark-breaks'
import logoUrl from '../assets/logo.svg'
import privacyText from '../assets/PRIVACY.md?raw'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0F172A] text-white font-inter">
      <header className="border-b border-white/10 bg-[#0F172A]/90 backdrop-blur-md sticky top-0 z-10">
        <div className="w-full max-w-[800px] mx-auto px-6 sm:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img src={logoUrl} alt="IT Team" className="w-8 h-8" />
            <span className="text-base font-inter-bold">IT Team</span>
          </Link>
          <Link to="/register" className="text-sm text-accent-violet hover:underline">
            Регистрация
          </Link>
        </div>
      </header>

      <main className="w-full max-w-[800px] mx-auto px-6 sm:px-8 py-12 md:py-16">
        <article className="privacy-markdown text-slate-300 text-[15px] leading-7">
          <ReactMarkdown remarkPlugins={[remarkBreaks]}>{privacyText}</ReactMarkdown>
        </article>
      </main>
    </div>
  )
}
