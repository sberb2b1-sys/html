import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import AppLayout from './layouts/AppLayout'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import ProjectsPage from './pages/ProjectsPage'
import ProjectPage from './pages/ProjectPage'
import TeamPage from './pages/TeamPage'
import ChatsPage from './pages/ChatsPage'
import GeneralChatPage from './pages/GeneralChatPage'
import StatsPage from './pages/StatsPage'
import BacklogPage from './pages/BacklogPage'
import AdminAgentsPage from './pages/AdminAgentsPage'
import { useStore } from './store/useStore'

function AuthBootstrap({ children }) {
  const initSession = useStore((s) => s.initSession)
  const isAuthReady = useStore((s) => s.isAuthReady)

  useEffect(() => {
    initSession()
  }, [initSession])

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark text-gray-400 text-sm">
        Загрузка...
      </div>
    )
  }

  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthBootstrap>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1C1C24',
              color: '#fff',
              border: '1px solid #2A2A35',
              fontSize: '14px',
            },
            success: {
              iconTheme: { primary: '#22C55E', secondary: '#fff' },
            },
            error: {
              iconTheme: { primary: '#EF4444', secondary: '#fff' },
            },
          }}
        />
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/projects/:projectId" element={<ProjectPage />} />
              <Route path="/team" element={<TeamPage />} />
              <Route path="/chats" element={<ChatsPage />} />
              <Route path="/general-chat" element={<GeneralChatPage />} />
              <Route path="/stats" element={<StatsPage />} />
              <Route path="/backlog" element={<BacklogPage />} />
              <Route path="/admin/agents" element={<AdminAgentsPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthBootstrap>
    </BrowserRouter>
  )
}
