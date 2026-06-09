import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ChatList from '../components/ChatList'
import ChatWindow from '../components/ChatWindow'
import { useStore } from '../store/useStore'

export default function ChatsPage() {
  const [searchParams] = useSearchParams()
  const [selectedAgentId, setSelectedAgentId] = useState(null)

  const loadAgents = useStore((s) => s.loadAgents)
  const loadChatMessages = useStore((s) => s.loadChatMessages)
  const sendMessageToAgent = useStore((s) => s.sendMessageToAgent)

  useEffect(() => {
    loadAgents()
  }, [loadAgents])

  useEffect(() => {
    if (selectedAgentId) {
      loadChatMessages(selectedAgentId)
    }
  }, [selectedAgentId, loadChatMessages])

  const handleSelectAgent = useCallback((agentId) => {
    setSelectedAgentId(agentId)
  }, [])

  useEffect(() => {
    const agentId = searchParams.get('agent')
    if (agentId) {
      handleSelectAgent(agentId)
    } else {
      setSelectedAgentId(null)
    }

    return () => setSelectedAgentId(null)
  }, [searchParams, handleSelectAgent])

  const handleSend = (message) => {
    if (selectedAgentId) {
      sendMessageToAgent(message, selectedAgentId)
    }
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      <ChatList
        selectedAgentId={selectedAgentId}
        onSelectAgent={handleSelectAgent}
      />
      <ChatWindow
        selectedAgentId={selectedAgentId}
        onSend={handleSend}
      />
    </div>
  )
}
