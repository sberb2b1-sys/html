import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import shieldIcon from '../assets/shieldcheck.png'
import PasswordField from '../components/PasswordField'
import { isValidEmail, isValidPassword } from '../utils/auth'
import { useStore } from '../store/useStore'

export default function RegisterPage() {
  const navigate = useNavigate()
  const register = useStore((s) => s.register)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleRegister = async () => {
    setError('')

    if (!name.trim() || !email.trim() || !password) {
      setError('Заполните все поля')
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
      await register(name.trim(), email.trim(), password)
      navigate('/dashboard')
    } catch (error) {
      setError(error.message || 'Не удалось зарегистрироваться')
    }
  }

  return (
    <div className="min-h-screen flex bg-dark">
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              'radial-gradient(ellipse at 30% 50%, rgba(124,58,237,0.4) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(59,130,246,0.3) 0%, transparent 50%)',
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
            Присоединяйтесь к команде
          </h1>
          <p className="text-base text-gray-400 leading-relaxed">
            Создайте аккаунт и начните управлять мультиагентной IT-командой уже сегодня
          </p>
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
            handleRegister()
          }}
        >
          <div>
            <h2 className="text-2xl font-inter-bold text-white mb-2">Регистрация</h2>
            <p className="text-sm text-gray-500">Создайте аккаунт, чтобы продолжить</p>
          </div>

          {error && (
            <div className="px-4 py-3 rounded-xl border border-red-500/30 bg-red-500/10 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label htmlFor="name" className="text-sm text-gray-400">Имя</label>
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-dark-border bg-dark-card">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="5" r="3" stroke="#6B7280" strokeWidth="1.2" />
                <path d="M2 14C2 11.24 4.69 9 8 9C11.31 9 14 11.24 14 14" stroke="#6B7280" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ваше имя"
                className="flex-1 bg-transparent text-sm text-white placeholder:text-gray-500 outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-sm text-gray-400">Email</label>
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
            <label htmlFor="password" className="text-sm text-gray-400">Пароль</label>
            <PasswordField
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Минимум 3 символа"
            />
          </div>

          <button
            type="submit"
            className="w-full btn-primary justify-center py-3.5 rounded-xl text-base"
          >
            Создать аккаунт
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M3 9H15M15 9L10 4M15 9L10 14" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <div className="flex items-center justify-center gap-1.5">
            <span className="text-sm text-gray-500">Уже есть аккаунт?</span>
            <Link to="/login" className="text-sm text-accent-violet font-inter-semibold hover:underline">
              Войти
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
