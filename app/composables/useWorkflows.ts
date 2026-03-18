import type { Workflow, WorkflowPayload } from '~/types'

export function useWorkflows() {
  const workflows = useState<Workflow[]>('workflows', () => [])
  const loading = useState('workflowsLoading', () => false)
  const error = useState<string | null>('workflowsError', () => null)

  async function fetchAll() {
    loading.value = true
    error.value = null
    try {
      workflows.value = await $fetch<Workflow[]>('/api/workflows')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load workflows'
      error.value = msg
    } finally {
      loading.value = false
    }
  }

  async function fetchOne(slug: string) {
    return await $fetch<Workflow>(`/api/workflows/${slug}`)
  }

  async function create(payload: WorkflowPayload) {
    const workflow = await $fetch<Workflow>('/api/workflows', { method: 'POST', body: payload })
    workflows.value.push(workflow)
    return workflow
  }

  async function update(slug: string, payload: Partial<WorkflowPayload & { lastRunAt?: string }>) {
    const workflow = await $fetch<Workflow>(`/api/workflows/${slug}`, { method: 'PUT', body: payload })
    const idx = workflows.value.findIndex(w => w.slug === slug)
    if (idx >= 0) workflows.value[idx] = workflow
    else workflows.value.push(workflow)
    return workflow
  }

  async function remove(slug: string) {
    await $fetch(`/api/workflows/${slug}`, { method: 'DELETE' })
    workflows.value = workflows.value.filter(w => w.slug !== slug)
  }

  return { workflows, loading, error, fetchAll, fetchOne, create, update, remove }
}
