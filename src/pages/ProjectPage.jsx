import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import AgentCard from '../components/AgentCard'
import ConfirmDialog from '../components/ConfirmDialog'
import SprintsManager from '../components/SprintsManager'
import { useStore } from '../store/useStore'

const TABS = [
  { id: 'tasks', label: 'Задачи' },
  { id: 'team', label: 'Команда' },
  { id: 'sprints', label: 'Спринты' },
]

function taskWord(count) {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) return 'задача'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'задачи'
  return 'задач'
}

export default function ProjectPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const id = Number(projectId)

  const projects = useStore((s) => s.projects)
  const tasks = useStore((s) => s.tasks)
  const agents = useStore((s) => s.agents)
  const loadProjects = useStore((s) => s.loadProjects)
  const loadTasks = useStore((s) => s.loadTasks)
  const loadAgents = useStore((s) => s.loadAgents)
  const sprints = useStore((s) => s.sprints)
  const loadSprints = useStore((s) => s.loadSprints)
  const createSprint = useStore((s) => s.createSprint)
  const assignTaskSprint = useStore((s) => s.assignTaskSprint)
  const deleteProject = useStore((s) => s.deleteProject)

  const [activeTab, setActiveTab] = useState('tasks')
  const [deleteOpen, setDeleteOpen] = useState(false)

  useEffect(() => {
    loadProjects()
    loadTasks()
    loadAgents()
  }, [loadProjects, loadTasks, loadAgents])

  useEffect(() => {
    if (id) loadSprints(id)
  }, [id, loadSprints])

  const project = projects.find((p) => p.id === id)

  const projectTasks = useMemo(
    () => tasks.filter((t) => t.projectId === id),
    [tasks, id]
  )

  const projectAgents = useMemo(() => {
    const agentIds = new Set(
      projectTasks.map((t) => t.assigneeAgentId).filter(Boolean)
    )
    return agents
      .filter((a) => agentIds.has(a.id))
      .map((agent) => {
        const agentTasks = projectTasks.filter((t) => t.assigneeAgentId === agent.id)
        return {
          ...agent,
          tasksActive: agentTasks.length,
          activity: `${agentTasks.length} ${taskWord(agentTasks.length)} в проекте`,
        }
      })
  }, [agents, projectTasks])

  const handleDelete = async () => {
    await deleteProject(id)
    setDeleteOpen(false)
    navigate('/projects')
  }

  if (!project) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center gap-4 p-8">
        <p className="text-gray-400">Проект не найден</p>
        <Link to="/projects" className="text-accent-violet hover:underline text-sm">
          ← К списку проектов
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="px-8 py-5 border-b border-dark-border">
        <Link to="/projects" className="text-sm text-gray-500 hover:text-accent-violet mb-3 inline-block">
          ← Проекты
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-inter-bold text-white">{project.name}</h1>
            <p className="text-sm text-gray-500 mt-1">{project.description || 'Без описания'}</p>
            <p className="text-xs text-gray-600 mt-2">
              {projectTasks.length} {taskWord(projectTasks.length)} • {project.progress}% выполнено
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className="px-4 py-2 rounded-lg border border-red-500/40 text-sm text-red-400 hover:bg-red-500/10"
          >
            Удалить проект
          </button>
        </div>

        <div className="flex items-center gap-2 mt-6">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                activeTab === tab.id
                  ? 'bg-[rgba(124,58,237,0.15)] text-white font-inter-medium'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        {activeTab === 'tasks' && (
          <section>
            {projectTasks.length === 0 ? (
              <p className="text-sm text-gray-500">Задач в этом проекте пока нет</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {projectTasks.map((task) => {
                  const agent = agents.find((a) => a.id === task.assigneeAgentId)
                  return (
                    <div key={task.id} className="card-border p-4 flex flex-col gap-2">
                      <p className="text-sm font-inter-medium text-white">{task.title}</p>
                      {task.description && (
                        <p className="text-xs text-gray-500 line-clamp-2">{task.description}</p>
                      )}
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="status-badge">{task.status}</span>
                        <div className="flex items-center gap-1.5">
                          {agent ? (
                            <>
                              <div
                                className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-inter-semibold text-white"
                                style={{ backgroundColor: agent.avatarColor }}
                              >
                                {agent.name.charAt(0)}
                              </div>
                              <span>{agent.name.split(' ')[0]}</span>
                            </>
                          ) : (
                            <span className="text-gray-600">Не назначен</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        )}

        {activeTab === 'team' && (
          <section>
            {projectAgents.length === 0 ? (
              <p className="text-sm text-gray-500">Назначьте агентов на задачи проекта</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {projectAgents.map((agent) => (
                  <AgentCard key={agent.id} agent={agent} compact />
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === 'sprints' && (
          <SprintsManager
            projectId={id}
            sprints={sprints}
            tasks={tasks}
            onCreateSprint={createSprint}
            onAssignTaskSprint={assignTaskSprint}
          />
        )}
      </div>

      <ConfirmDialog
        open={deleteOpen}
        title="Удалить проект?"
        message={`Проект «${project.name}» и все связанные задачи будут удалены.`}
        confirmLabel="Удалить проект"
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  )
}
