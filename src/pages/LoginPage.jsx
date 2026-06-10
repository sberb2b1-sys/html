import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import shieldIcon from '../assets/shieldcheck.png'
import PasswordField from '../components/PasswordField'
import { isValidEmail, isValidPassword } from '../utils/auth'
import { useStore } from '../store/useStore'

export default function LoginPage() {
  const navigate = useNavigate()
  const login = useStore((s) => s.login)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const finishGoogleLogin = () => {
    toast.error('Вход через Google недоступен. Используйте email и пароль.')
  }

  const handleGoogleLogin = () => {
    finishGoogleLogin()
  }

  const handleLogin = async () => {
    setError('')

    if (!email || !password) {
      setError('Введите email и пароль')
      return
    }
    if (!isValidEmail(email)) {
      setError('Введите корректный email (должен содержать @ и .)')
      return
    }
    if (!isValidPassword(password)) {
      setError('Пароль должен содержать минимум 3 символа')
      return
    }

    try {
      await login(email, password)
      navigate('/holdings')
    } catch (err) {
      setError(err.message || 'Неверный email или пароль')
    }
  }

  return (
    <div className="min-h-screen flex bg-dark">
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-30"
          style={{
            background: 'radial-gradient(ellipse at 30% 50%, rgba(124,58,237,0.4) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(59,130,246,0.3) 0%, transparent 50%)',
          }}
        />
        <div className="relative flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-[10px] flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #3B82F6 100%)' }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 2L15 6V12L9 16L3 12V6L9 2Z" stroke="white" strokeWidth="1.5" />
            </svg>
          </div>
          <span className="text-base font-inter-bold text-white">IT Team</span>
        </div>

        <div className="relative max-w-lg">
          <h1 className="text-4xl font-inter-bold text-white leading-tight mb-4">
            Управляйте задачами эффективно
          </h1>
          <p className="text-base text-gray-400 leading-relaxed mb-10">
            Планируйте спринты, ведите беклог и отслеживайте прогресс команды в одном месте
          </p>

          <div className="flex flex-col gap-5">
            {[
              'Канбан-доска и спринты в реальном времени',
              'Командное взаимодействие и назначение задач',
              'Аналитика и отчёты по продуктивности',
            ].map((text) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[rgba(124,58,237,0.2)] flex items-center justify-center shrink-0">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8L6.5 11.5L13 5" stroke="#7C6FF7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <p className="text-sm text-gray-300">{text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex items-center gap-8">
          {[
            { value: '10 000+', label: 'Пользователей' },
            { value: '500+', label: 'Команд' },
            { value: '99.9%', label: 'Доступность' },
          ].map((stat, i) => (
            <div key={stat.label} className="flex items-center gap-8">
              {i > 0 && <div className="w-px h-8 bg-dark-border" />}
              <div>
                <p className="text-xl font-inter-bold text-white">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-dark-sidebar lg:max-w-[520px] lg:shrink-0">
        <form
          className="w-full max-w-[400px] flex flex-col gap-6"
          onSubmit={(e) => {
            e.preventDefault()
            handleLogin()
          }}
        >
          <div>
            <h2 className="text-2xl font-inter-bold text-white mb-2">Добро пожаловать</h2>
            <p className="text-sm text-gray-500">Войдите в свой аккаунт, чтобы продолжить</p>
          </div>

          <button
            type="button"
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-dark-border bg-dark-card text-sm text-white hover:bg-dark-hover transition-colors"
            onClick={handleGoogleLogin}
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c3.42-3.15 5.392-7.78 5.392-13.216z" fill="#4285F4" />
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853" />
              <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
            </svg>
            Войти через Google
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-dark-border" />
            <span className="text-sm text-gray-500">или</span>
            <div className="flex-1 h-px bg-dark-border" />
          </div>

          {error && (
            <div className="px-4 py-3 rounded-xl border border-red-500/30 bg-red-500/10 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-sm text-gray-400">Электронная почта</label>
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-dark-border bg-dark-card">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="1.5" y="3.5" width="13" height="9" rx="1.5" stroke="#6B7280" strokeWidth="1.2" />
                <path d="M1.5 5L8 9L14.5 5" stroke="#6B7280" strokeWidth="1.2" />
              </svg>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 bg-transparent text-sm text-white placeholder:text-gray-500 outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-sm text-gray-400">Пароль</label>
              <button type="button" className="text-sm text-accent-violet hover:underline">
                Забыли пароль?
              </button>
            </div>
            <PasswordField
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <div className="w-4 h-4 rounded border border-dark-border bg-dark-card flex items-center justify-center">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2 5L4 7L8 3" stroke="#7C6FF7" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <span className="text-sm text-gray-400">Запомнить меня</span>
          </label>

          <button
            type="submit"
            className="w-full btn-primary justify-center py-3.5 rounded-xl text-base"
          >
            Войти в аккаунт
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M3 9H15M15 9L10 4M15 9L10 14" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <div className="flex items-center justify-center gap-1.5">
            <span className="text-sm text-gray-500">Нет аккаунта?</span>
            <Link to="/register" className="text-sm text-accent-violet font-inter-semibold hover:underline">
              Зарегистрироваться
            </Link>
          </div>

          <div className="flex items-center justify-center gap-1.5 pt-2">
            <img src={shieldIcon} alt="" className="w-3.5 h-3.5" />
            <span className="text-xs text-gray-500 italic">Защищено шифрованием SSL</span>
          </div>
        </form>
      </div>
    </div>
  )
}
