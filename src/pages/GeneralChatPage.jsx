import { useEffect, useState } from 'react'
import GeneralChat from '../components/GeneralChat'
import { useStore } from '../store/useStore'

export default function GeneralChatPage() {
  const projects = useStore((s) => s.projects)
  const generalChatMessages = useStore((s) => s.generalChatMessages)
  const loadProjects = useStore((s) => s.loadProjects)
  const loadGeneralChat = useStore((s) => s.loadGeneralChat)
  const sendGeneralChatMessage = useStore((s) => s.sendGeneralChatMessage)

  const [projectId, setProjectId] = useState(null)

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  useEffect(() => {
    if (projects.length > 0 && !projectId) {
      setProjectId(projects[0].id)
    }
  }, [projects, projectId])

  useEffect(() => {
    if (projectId) {
      loadGeneralChat(projectId)
    }
  }, [projectId, loadGeneralChat])

  const project = projects.find((p) => p.id === projectId)

  const handleSend = (message) => {
    if (projectId) {
      sendGeneralChatMessage(message, projectId)
    }
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {projects.length > 1 && (
        <div className="px-8 pt-4">
          <select
            value={projectId || ''}
            onChange={(e) => setProjectId(Number(e.target.value))}
            className="px-3 py-2 rounded-lg border border-dark-border bg-dark-card text-sm text-gray-300"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      )}
      <GeneralChat
        messages={generalChatMessages}
        projectName={project?.name}
        onSend={handleSend}
      />
    </div>
  )
}
