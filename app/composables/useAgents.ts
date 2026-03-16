import type { Agent, AgentPayload } from '~/types'

export function useAgents() {
  const agents = useState<Agent[]>('agents', () => [])
  const loading = useState('agentsLoading', () => false)
  const error = useState<string | null>('agentsError', () => null)

  async function fetchAll() {
    loading.value = true
    error.value = null
    try {
      agents.value = await $fetch<Agent[]>('/api/agents')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load agents'
      error.value = msg
      console.error('[useAgents] fetchAll:', msg)
    } finally {
      loading.value = false
    }
  }

  async function fetchOne(slug: string) {
    return await $fetch<Agent>(`/api/agents/${slug}`)
  }

  async function create(payload: AgentPayload) {
    const agent = await $fetch<Agent>('/api/agents', { method: 'POST', body: payload })
    agents.value.push(agent)
    return agent
  }

  async function update(slug: string, payload: AgentPayload) {
    const agent = await $fetch<Agent>(`/api/agents/${slug}`, { method: 'PUT', body: payload })
    const idx = agents.value.findIndex(a => a.slug === slug)
    if (idx >= 0) agents.value[idx] = agent
    else agents.value.push(agent)
    return agent
  }

  async function remove(slug: string) {
    await $fetch(`/api/agents/${slug}`, { method: 'DELETE' as const })
    agents.value = agents.value.filter(a => a.slug !== slug)
  }

  return { agents, loading, error, fetchAll, fetchOne, create, update, remove }
}
