import { useEffect, useState } from 'react'
import { Link, Outlet, useParams } from 'react-router-dom'
import ProjectSidebar from '../components/ProjectSidebar'
import { useStore } from '../store/useStore'

export default function ProjectLayout() {
  const { projectId } = useParams()
  const id = Number(projectId)

  const projects = useStore((s) => s.projects)
  const loadProjects = useStore((s) => s.loadProjects)
  const loadProjectAgents = useStore((s) => s.loadProjectAgents)
  const loadSprints = useStore((s) => s.loadSprints)
  const loadTasks = useStore((s) => s.loadTasks)

  const [projectsReady, setProjectsReady] = useState(false)

  const project = projects.find((p) => p.id === id)

  useEffect(() => {
    loadProjects().finally(() => setProjectsReady(true))
  }, [loadProjects])

  useEffect(() => {
    if (!Number.isNaN(id) && id > 0) {
      loadProjectAgents(id)
      loadSprints(id)
      loadTasks(id)
    }
  }, [id, loadProjectAgents, loadSprints, loadTasks])

  if (Number.isNaN(id) || id <= 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-dark text-gray-400">
        <p>Некорректный адрес проекта</p>
        <Link to="/holdings" className="text-accent-violet text-sm hover:underline">
          ← К холдингу
        </Link>
      </div>
    )
  }

  if (!projectsReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark text-gray-400 text-sm">
        Загрузка проекта...
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-dark text-gray-400">
        <p>Проект не найден</p>
        <Link to="/holdings" className="text-accent-violet text-sm hover:underline">
          ← К холдингу
        </Link>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-dark overflow-hidden">
      <ProjectSidebar project={project} />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Outlet context={{ projectId: id, project }} />
      </main>
    </div>
  )
}
