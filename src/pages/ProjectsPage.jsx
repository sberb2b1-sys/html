import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import ProjectCard from '../components/ProjectCard'
import ProjectCreateModal from '../components/ProjectCreateModal'
import ProjectEditModal from '../components/ProjectEditModal'
import ConfirmDialog from '../components/ConfirmDialog'
import { useStore } from '../store/useStore'

const tabs = ['Все проекты', 'В работе', 'Завершённые']

export default function ProjectsPage() {
  const navigate = useNavigate()
  const projects = useStore((s) => s.projects)
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

  const handleSaveEdit = async (data) => {
    if (!editingProject) return
    await updateProject(editingProject.id, {
      name: data.name,
      description: data.description,
    })
    setEditingProject(null)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    if (editingProject?.id === deleteTarget.id) setEditingProject(null)
    await deleteProject(deleteTarget.id)
    setDeleteTarget(null)
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="px-8 py-5 border-b border-dark-border flex items-center justify-between">
        <div>
          <h1 className="text-xl font-inter-bold text-white">Проекты</h1>
          <p className="text-sm text-gray-500 mt-1">
            Управление проектами команды • {activeCount} активных • всего {projects.length}
          </p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setModalOpen(true)}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 3V13M3 8H13" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
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

        {projects.length === 0 && (
          <div className="card-border p-8 text-center">
            <p className="text-sm text-gray-400">Проектов пока нет. Создайте первый проект.</p>
          </div>
        )}

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
            <div className="w-12 h-12 rounded-xl bg-[rgba(124,58,237,0.15)] flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 5V19M5 12H19" stroke="#7C6FF7" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-sm font-inter-semibold text-white">Добавить проект</p>
            <p className="text-xs text-gray-500">Нажмите, чтобы создать новый проект</p>
          </button>
        </div>
      </div>

      <ProjectCreateModal open={modalOpen} onClose={() => setModalOpen(false)} onSave={handleCreateProject} />
      <ProjectEditModal
        open={Boolean(editingProject)}
        project={editingProject}
        onClose={() => setEditingProject(null)}
        onSave={handleSaveEdit}
      />
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Удалить проект?"
        message={`Проект «${deleteTarget?.name}» и все связанные задачи будут удалены.`}
        confirmLabel="Удалить"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
