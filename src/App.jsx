import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import ProtectedRoute from './components/ProtectedRoute'
import ProjectLayout from './layouts/ProjectLayout'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import HoldingsPage from './pages/HoldingsPage'
import ProjectDashboard from './pages/ProjectDashboard'
import TeamPage from './pages/TeamPage'
import ChatsPage from './pages/ChatsPage'
import BacklogPage from './pages/BacklogPage'
import SprintsPage from './pages/SprintsPage'
import SprintPage from './pages/SprintPage'
import ApprovalsPage from './pages/ApprovalsPage'
import ArtifactsReviewPage from './pages/ArtifactsReviewPage'
import AgentSettingsPage from './pages/AgentSettingsPage'
import DemoPage from './pages/DemoPage'
import PrivacyPage from './pages/PrivacyPage'
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
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/holdings" element={<HoldingsPage />} />
            <Route path="/demo" element={<DemoPage />} />

            <Route path="/projects/:projectId" element={<ProjectLayout />}>
              <Route index element={<ProjectDashboard />} />
              <Route path="team" element={<TeamPage />} />
              <Route path="chats" element={<ChatsPage />} />
              <Route path="backlog" element={<BacklogPage />} />
              <Route path="sprints" element={<SprintsPage />} />
              <Route path="sprints/:sprintId" element={<SprintPage />} />
              <Route path="approvals" element={<ApprovalsPage />} />
              <Route path="artifacts" element={<ArtifactsReviewPage />} />
              <Route path="agents" element={<AgentSettingsPage />} />
            </Route>

            <Route path="/dashboard" element={<Navigate to="/holdings" replace />} />
            <Route path="/projects" element={<Navigate to="/holdings" replace />} />
            <Route path="/team" element={<Navigate to="/holdings" replace />} />
            <Route path="/chats" element={<Navigate to="/holdings" replace />} />
            <Route path="/backlog" element={<Navigate to="/holdings" replace />} />
            <Route path="/general-chat" element={<Navigate to="/holdings" replace />} />
            <Route path="/stats" element={<Navigate to="/holdings" replace />} />
            <Route path="/admin/agents" element={<Navigate to="/holdings" replace />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthBootstrap>
    </BrowserRouter>
  )
}
