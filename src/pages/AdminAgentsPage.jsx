import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import AgentsManager from '../components/AgentsManager'
import { useStore } from '../store/useStore'

export default function AdminAgentsPage() {
  const userRole = useStore((s) => s.userRole)
  const agents = useStore((s) => s.agents)
  const loadAgents = useStore((s) => s.loadAgents)
  const createAgent = useStore((s) => s.createAgent)
  const updateAgent = useStore((s) => s.updateAgent)
  const deleteAgent = useStore((s) => s.deleteAgent)

  useEffect(() => {
    loadAgents()
  }, [loadAgents])

  if (userRole !== 'po') {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <AgentsManager
      agents={agents}
      onCreate={createAgent}
      onUpdate={updateAgent}
      onDelete={deleteAgent}
    />
  )
}
