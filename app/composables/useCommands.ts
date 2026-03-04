import type { Command, CommandPayload } from '~/types'

export function useCommands() {
  const commands = useState<Command[]>('commands', () => [])
  const loading = useState('commandsLoading', () => false)

  async function fetchAll() {
    loading.value = true
    try {
      commands.value = await $fetch<Command[]>('/api/commands')
    } finally {
      loading.value = false
    }
  }

  async function fetchOne(slug: string) {
    return await $fetch<Command>(`/api/commands/${slug}`)
  }

  async function create(payload: CommandPayload) {
    const command = await $fetch<Command>('/api/commands', { method: 'POST', body: payload })
    commands.value.push(command)
    return command
  }

  async function update(slug: string, payload: CommandPayload) {
    const command = await $fetch<Command>(`/api/commands/${slug}`, { method: 'PUT', body: payload })
    const idx = commands.value.findIndex(c => c.slug === slug)
    if (idx >= 0) commands.value[idx] = command
    else commands.value.push(command)
    return command
  }

  async function remove(slug: string) {
    await $fetch(`/api/commands/${slug}`, { method: 'DELETE' })
    commands.value = commands.value.filter(c => c.slug !== slug)
  }

  const groupedByDirectory = computed(() => {
    const groups: Record<string, Command[]> = {}
    for (const cmd of commands.value) {
      const dir = cmd.directory || 'root'
      if (!groups[dir]) groups[dir] = []
      groups[dir].push(cmd)
    }
    return groups
  })

  return { commands, loading, fetchAll, fetchOne, create, update, remove, groupedByDirectory }
}
