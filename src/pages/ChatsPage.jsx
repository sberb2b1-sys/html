import { useCallback, useEffect, useState } from 'react'
import { useOutletContext, useSearchParams } from 'react-router-dom'
import ChatList from '../components/ChatList'
import ChatWindow from '../components/ChatWindow'
import { useStore } from '../store/useStore'

export default function ChatsPage() {
  const { projectId } = useOutletContext()
  const [searchParams] = useSearchParams()
  const [selectedAgentId, setSelectedAgentId] = useState(null)

  const getProjectAgents = useStore((s) => s.getProjectAgents)
  const loadProjectAgents = useStore((s) => s.loadProjectAgents)
  const loadChatMessages = useStore((s) => s.loadChatMessages)
  const sendMessageToAgent = useStore((s) => s.sendMessageToAgent)

  const agents = getProjectAgents(projectId)

  useEffect(() => {
    loadProjectAgents(projectId)
  }, [projectId, loadProjectAgents])

  useEffect(() => {
    if (selectedAgentId) {
      loadChatMessages(projectId, selectedAgentId)
    }
  }, [selectedAgentId, projectId, loadChatMessages])

  const handleSelectAgent = useCallback((agentId) => {
    setSelectedAgentId(agentId)
  }, [])

  useEffect(() => {
    const agentId = searchParams.get('agent')
    if (agentId) handleSelectAgent(agentId)
  }, [searchParams, handleSelectAgent])

  const handleSend = (message) => {
    if (selectedAgentId) {
      sendMessageToAgent(message, selectedAgentId, projectId)
    }
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      <ChatList
        agents={agents}
        selectedAgentId={selectedAgentId}
        onSelectAgent={handleSelectAgent}
      />
      <ChatWindow
        selectedAgentId={selectedAgentId}
        projectId={projectId}
        agents={agents}
        onSend={handleSend}
      />
    </div>
  )
}
