import AgentCard from './AgentCard'
import { useAppStore } from '../store/useAppStore'

export default function ChatList({ selectedAgentId: selectedAgentIdProp, onSelectAgent }) {
  const agents = useAppStore((s) => s.agents)
  const storeSelectedAgentId = useAppStore((s) => s.selectedAgentId)
  const storeSelectAgent = useAppStore((s) => s.selectAgent)

  const selectedAgentId = selectedAgentIdProp !== undefined ? selectedAgentIdProp : storeSelectedAgentId
  const selectAgent = onSelectAgent ?? storeSelectAgent

  return (
    <div className="w-[320px] border-r border-dark-border flex flex-col shrink-0 bg-dark-sidebar">
      <div className="p-4 border-b border-dark-border">
        <h2 className="text-base font-inter-semibold text-white mb-3">Чаты агентов</h2>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dark-border bg-dark-card">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="7" cy="7" r="5" stroke="#6B7280" strokeWidth="1.5" />
            <path d="M11 11L14 14" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span className="text-sm text-gray-500">Найти агента...</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-0.5">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className={`rounded-lg ${selectedAgentId === agent.id ? 'bg-[rgba(124,58,237,0.15)]' : ''}`}
          >
            <AgentCard agent={agent} compact onClick={() => selectAgent(agent.id)} />
          </div>
        ))}
      </div>
    </div>
  )
}
