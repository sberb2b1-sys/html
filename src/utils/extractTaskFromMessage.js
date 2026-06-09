const INTENT_PHRASES = ['создай задачу', 'нужно сделать', 'поставь задачу', 'создаю задачу']

const TITLE_PATTERNS = [
  /создаю задачу для [^:]+:\s*[«"„]([^»""]+)[»""]/i,
  /созда(?:й|ть) задачу[:\s—-]+[«"„]?([^»""\n.]+)[»""]?/i,
  /поставь задачу[:\s—-]+[«"„]?([^»""\n.]+)[»""]?/i,
  /нужно сделать[:\s—-]+[«"„]?([^»""\n.]+)[»""]?/i,
]

export function hasTaskCreationIntent(text) {
  if (!text) return false
  const lower = text.toLowerCase()
  return INTENT_PHRASES.some((phrase) => lower.includes(phrase))
}

export function extractTaskFromMessage(text) {
  if (!hasTaskCreationIntent(text)) return null

  let title = null
  for (const pattern of TITLE_PATTERNS) {
    const match = text.match(pattern)
    if (match?.[1]?.trim()) {
      title = match[1].trim()
      break
    }
  }

  if (!title) {
    const firstLine = text.split('\n').find((line) => line.trim()) || text
    title = firstLine.replace(/^[^:]*:\s*/, '').slice(0, 120).trim()
    if (!title) title = 'Новая задача из чата'
  }

  const assigneeMatch = text.match(/создаю задачу для ([^:]+):/i)
  const assigneeHint = assigneeMatch?.[1]?.trim() || null

  return {
    title,
    description: text.trim(),
    assigneeHint,
  }
}

export function resolveAgentIdFromHint(hint, agents = []) {
  if (!hint || !agents.length) return null
  const lower = hint.toLowerCase()
  const found = agents.find(
    (agent) =>
      agent.name.toLowerCase().includes(lower) ||
      lower.includes(agent.name.toLowerCase()) ||
      (agent.role && agent.role.toLowerCase().includes(lower))
  )
  return found?.id ?? null
}
