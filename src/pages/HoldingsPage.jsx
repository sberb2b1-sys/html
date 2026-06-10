import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ProjectCard from '../components/ProjectCard'
import ProjectCreateModal from '../components/ProjectCreateModal'
import ProjectEditModal from '../components/ProjectEditModal'
import ConfirmDialog from '../components/ConfirmDialog'
import { useStore } from '../store/useStore'

const tabs = ['Все проекты', 'В работе', 'Завершённые']

export default function HoldingsPage() {
  const navigate = useNavigate()
  const projects = useStore((s) => s.projects)
  const currentUser = useStore((s) => s.currentUser)
  const logout = useStore((s) => s.logout)
  const loadProjects = useStore((s) => s.loadProjects)
  const createProject = useStore((s) => s.createProject)
  const updateProject = useStore((s) => s.updateProject)
  const deleteProject = useStore((s) => s.deleteProject)

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  const [activeTab, setActiveTab] = useState('Все проекты')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProject, setEditingProject] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const activeCount = projects.filter((p) => p.status === 'В работе').length

  const filtered = projects.filter((p) => {
    if (activeTab === 'В работе') return p.status === 'В работе'
    if (activeTab === 'Завершённые') return p.status === 'Завершён'
    return true
  })

  const handleProjectClick = (project) => {
    navigate(`/projects/${project.id}`)
  }

  const handleCreateProject = async (data) => {
    const ok = await createProject({ name: data.name, description: data.description })
    if (ok) {
      await loadProjects()
      setModalOpen(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark flex flex-col">
      <header className="px-8 py-4 border-b border-dark-border flex items-center justify-between">
        <div>
          <h1 className="text-lg font-inter-bold text-white">IT Team — Холдинг</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {currentUser?.name ? `Привет, ${currentUser.name}` : 'Ваши проекты'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/privacy" className="text-xs text-gray-500 hover:text-gray-300">
            Конфиденциальность
          </Link>
          <button type="button" onClick={logout} className="text-sm text-gray-500 hover:text-white">
            Выйти
          </button>
        </div>
      </header>

      <div className="px-8 py-5 border-b border-dark-border flex items-center justify-between">
        <div>
          <h2 className="text-xl font-inter-bold text-white">Проекты</h2>
          <p className="text-sm text-gray-500 mt-1">
            {activeCount} активных • всего {projects.length}
          </p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setModalOpen(true)}>
          Новый проект
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-6">
        <div className="flex items-center gap-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                activeTab === tab
                  ? 'bg-[rgba(124,58,237,0.15)] text-white font-inter-medium'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {filtered.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={handleProjectClick}
              onEdit={setEditingProject}
              onDelete={setDeleteTarget}
            />
          ))}
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="card-border p-5 flex flex-col items-center justify-center gap-3 border-dashed cursor-pointer hover:border-accent-purple/50 transition-colors min-h-[220px]"
          >
            <p className="text-sm font-inter-semibold text-white">Добавить проект</p>
          </button>
        </div>
      </div>

      <ProjectCreateModal open={modalOpen} onClose={() => setModalOpen(false)} onSave={handleCreateProject} />
      <ProjectEditModal
        open={Boolean(editingProject)}
        project={editingProject}
        onClose={() => setEditingProject(null)}
        onSave={async (data) => {
          if (!editingProject) return
          await updateProject(editingProject.id, data)
          setEditingProject(null)
        }}
      />
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Удалить проект?"
        message={`Проект «${deleteTarget?.name}» будет удалён.`}
        confirmLabel="Удалить"
        onConfirm={async () => {
          if (!deleteTarget) return
          await deleteProject(deleteTarget.id)
          setDeleteTarget(null)
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
