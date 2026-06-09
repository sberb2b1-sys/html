import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import logoUrl from '../assets/logo.svg'

function Reveal({ children, className = '', delay = 0 }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return undefined

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

const FEATURES = [
  {
    icon: '🧠',
    title: 'Умные агенты',
    text: '8 агентов с разными ролями — от бизнес-аналитика до скрам-маастера.',
  },
  {
    icon: '💬',
    title: 'Единый чат',
    text: 'Общайтесь с командой в одном окне — личные и общие диалоги.',
  },
  {
    icon: '📋',
    title: 'Бэклог и спринты',
    text: 'Управляйте задачами, планируйте спринты и назначайте агентов.',
  },
  {
    icon: '📊',
    title: 'Статистика',
    text: 'Прозрачная отчётность по проектам, задачам и активности команды.',
  },
]

const STEPS = [
  {
    num: '01',
    title: 'Опишите идею',
    text: 'Напишите в чат, что нужно сделать — агенты поймут контекст.',
  },
  {
    num: '02',
    title: 'Агенты анализируют',
    text: 'Бизнес-аналитик уточняет требования, архитектор проектирует решение.',
  },
  {
    num: '03',
    title: 'Задачи в бэклоге',
    text: 'Разработчики берут задачи и реализуют — вы контролируете процесс.',
  },
]

const BENEFITS = [
  { title: 'Скорость', text: 'От идеи до задачи за 5 минут', accent: '#7C3AED' },
  { title: 'Экономия', text: 'Сокращение рутины на 40%', accent: '#10B981' },
  { title: 'Прозрачность', text: 'Полная история решений в чатах', accent: '#3B82F6' },
  { title: 'Безопасность', text: 'Данные в РФ, под вашим контролем', accent: '#8B5CF6' },
]

const TECH_STACK = [
  { name: 'FastAPI', label: 'Python' },
  { name: 'React', label: 'Frontend' },
  { name: 'PostgreSQL', label: 'БД' },
  { name: 'DeepSeek', label: 'ИИ' },
]

export default function LandingPage() {
  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-[#0F172A] text-white font-inter overflow-x-hidden">
      <div
        className="fixed inset-0 pointer-events-none"
        aria-hidden
        style={{
          backgroundImage: `
            radial-gradient(ellipse 80% 50% at 50% -20%, rgba(124,58,237,0.18), transparent),
            linear-gradient(rgba(148,163,184,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(148,163,184,0.04) 1px, transparent 1px)
          `,
          backgroundSize: '100% 100%, 48px 48px, 48px 48px',
        }}
      />

      <header className="relative z-10 border-b border-white/5 bg-[#0F172A]/80 backdrop-blur-md sticky top-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img src={logoUrl} alt="IT Team" className="w-8 h-8" />
            <span className="text-base font-inter-bold text-white">IT Team</span>
          </Link>
          <nav className="flex items-center gap-2 sm:gap-4">
            <Link
              to="/login"
              className="text-sm text-slate-300 hover:text-white transition-colors px-3 py-2"
            >
              Войти
            </Link>
            <Link
              to="/register"
              className="text-sm font-inter-semibold px-4 py-2 rounded-lg text-white transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #3B82F6 100%)' }}
            >
              Регистрация
            </Link>
          </nav>
        </div>
      </header>

      <main className="relative z-10">
        {/* Hero */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-24 md:pt-24 md:pb-32">
          <Reveal>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#7C3AED]/30 bg-[#7C3AED]/10 text-xs text-violet-300 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
              Мультиагентная платформа для IT-команд
            </div>
          </Reveal>

          <Reveal delay={80}>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-inter-bold leading-tight max-w-4xl">
              IT Team —{' '}
              <span className="bg-gradient-to-r from-[#7C3AED] to-[#10B981] bg-clip-text text-transparent">
                мультиагентная IT-команда
              </span>
            </h1>
          </Reveal>

          <Reveal delay={160}>
            <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed">
              Автоматизируйте управление проектами с помощью ИИ-агентов. Аналитики,
              архитекторы, разработчики и тестировщики — всё в одном чате.
            </p>
          </Reveal>

          <Reveal delay={240}>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link
                to="/register"
                className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl text-sm font-inter-semibold text-white transition-transform hover:scale-[1.02]"
                style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #3B82F6 100%)' }}
              >
                Начать бесплатно
              </Link>
              <button
                type="button"
                onClick={scrollToFeatures}
                className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl text-sm font-inter-semibold text-white border border-white/15 bg-white/5 hover:bg-white/10 transition-colors"
              >
                Узнать больше
              </button>
            </div>
          </Reveal>

          <Reveal delay={320}>
            <div className="mt-16 md:mt-20 rounded-2xl border border-white/10 bg-[#1E293B]/50 p-6 md:p-8 backdrop-blur-sm">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
                {[
                  { value: '8', label: 'ИИ-агентов' },
                  { value: '1', label: 'единый чат' },
                  { value: '∞', label: 'задач в бэклоге' },
                  { value: '24/7', label: 'доступность' },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <p className="text-2xl md:text-3xl font-inter-bold text-[#10B981]">{stat.value}</p>
                    <p className="text-xs md:text-sm text-slate-500 mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </section>

        {/* Features */}
        <section id="features" className="max-w-6xl mx-auto px-4 sm:px-6 py-20 md:py-28">
          <Reveal>
            <h2 className="text-2xl md:text-3xl font-inter-bold text-center">Возможности</h2>
            <p className="text-slate-400 text-center mt-3 max-w-xl mx-auto text-sm md:text-base">
              Всё необходимое для управления IT-проектом в одной платформе
            </p>
          </Reveal>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((item, i) => (
              <Reveal key={item.title} delay={i * 80}>
                <div className="h-full p-6 rounded-2xl border border-white/10 bg-[#1E293B]/40 hover:border-[#7C3AED]/40 hover:bg-[#1E293B]/60 transition-colors">
                  <span className="text-3xl" role="img" aria-hidden>{item.icon}</span>
                  <h3 className="mt-4 text-base font-inter-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm text-slate-400 leading-relaxed">{item.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20 md:py-28 border-t border-white/5">
          <Reveal>
            <h2 className="text-2xl md:text-3xl font-inter-bold text-center">Как это работает</h2>
          </Reveal>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((step, i) => (
              <Reveal key={step.num} delay={i * 100}>
                <div className="relative flex flex-col gap-4">
                  <span className="text-4xl font-inter-bold text-[#7C3AED]/30">{step.num}</span>
                  <h3 className="text-lg font-inter-semibold">{step.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{step.text}</p>
                  {i < STEPS.length - 1 && (
                    <div className="hidden md:block absolute top-8 -right-4 w-8 h-px bg-gradient-to-r from-[#7C3AED]/50 to-transparent" />
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Benefits */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20 md:py-28 border-t border-white/5">
          <Reveal>
            <h2 className="text-2xl md:text-3xl font-inter-bold text-center">Преимущества</h2>
          </Reveal>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-5">
            {BENEFITS.map((item, i) => (
              <Reveal key={item.title} delay={i * 80}>
                <div className="p-6 md:p-8 rounded-2xl border border-white/10 bg-[#1E293B]/40 flex gap-4">
                  <div
                    className="w-1 rounded-full shrink-0"
                    style={{ backgroundColor: item.accent }}
                  />
                  <div>
                    <h3 className="text-lg font-inter-semibold">{item.title}</h3>
                    <p className="mt-2 text-sm text-slate-400">{item.text}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Tech */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20 md:py-28 border-t border-white/5">
          <Reveal>
            <h2 className="text-2xl md:text-3xl font-inter-bold text-center">
              Технологии и безопасность
            </h2>
            <p className="text-slate-400 text-center mt-3 text-sm md:text-base">
              Работает в РФ, данные под контролем
            </p>
          </Reveal>

          <Reveal delay={100}>
            <div className="mt-12 flex flex-wrap justify-center gap-4 md:gap-6">
              {TECH_STACK.map((tech) => (
                <div
                  key={tech.name}
                  className="px-6 py-4 rounded-xl border border-white/10 bg-[#1E293B]/50 text-center min-w-[120px]"
                >
                  <p className="text-sm font-inter-semibold">{tech.name}</p>
                  <p className="text-xs text-slate-500 mt-1">{tech.label}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </section>

        {/* CTA */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20 md:py-28">
          <Reveal>
            <div
              className="rounded-3xl p-8 md:p-14 text-center border border-[#7C3AED]/30"
              style={{
                background: 'linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(16,185,129,0.08) 100%)',
              }}
            >
              <h2 className="text-2xl md:text-4xl font-inter-bold">
                Готовы ускорить разработку?
              </h2>
              <p className="mt-4 text-slate-400 text-sm md:text-base">
                Попробуйте IT Team бесплатно
              </p>
              <Link
                to="/register"
                className="inline-flex mt-8 px-8 py-3.5 rounded-xl text-sm font-inter-semibold text-white transition-transform hover:scale-[1.02]"
                style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #10B981 100%)' }}
              >
                Зарегистрироваться
              </Link>
            </div>
          </Reveal>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 bg-[#0B1220]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 md:py-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <Link to="/" className="flex items-center gap-2.5">
              <img src={logoUrl} alt="IT Team" className="w-7 h-7" />
              <span className="text-sm font-inter-bold">IT Team</span>
            </Link>
            <nav className="flex flex-wrap gap-4 md:gap-6 text-sm text-slate-400">
              <a href="#features" className="hover:text-white transition-colors">О проекте</a>
              <span className="text-slate-600 cursor-default">Блог</span>
              <a href="mailto:hello@itteam.tech" className="hover:text-white transition-colors">
                Контакты
              </a>
            </nav>
          </div>
          <p className="mt-8 text-xs text-slate-600">© 2026 IT Team</p>
        </div>
      </footer>
    </div>
  )
}
