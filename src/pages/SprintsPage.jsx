import { useOutletContext } from 'react-router-dom'
import SprintsManager from '../components/SprintsManager'
import { useStore } from '../store/useStore'

export default function SprintsPage() {
  const { projectId } = useOutletContext()
  const sprints = useStore((s) => s.sprints)
  const tasks = useStore((s) => s.tasks)
  const createSprint = useStore((s) => s.createSprint)
  const assignTaskSprint = useStore((s) => s.assignTaskSprint)

  const projectSprints = sprints.filter((s) => s.projectId === projectId)
  const projectTasks = tasks.filter((t) => t.projectId === projectId)

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="px-8 py-5 border-b border-dark-border">
        <h1 className="text-xl font-inter-bold text-white">Спринты</h1>
      </div>
      <div className="flex-1 overflow-y-auto p-8">
        <SprintsManager
          projectId={projectId}
          sprints={projectSprints}
          tasks={projectTasks}
          onCreateSprint={createSprint}
          onAssignTaskSprint={assignTaskSprint}
        />
      </div>
    </div>
  )
}
