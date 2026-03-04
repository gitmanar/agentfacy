import type { Plugin, PluginDetail, SkillFrontmatter } from '~/types'

export function usePlugins() {
  const plugins = useState<Plugin[]>('plugins', () => [])
  const loading = useState('pluginsLoading', () => false)

  async function fetchAll() {
    loading.value = true
    try {
      plugins.value = await $fetch<Plugin[]>('/api/plugins')
    } finally {
      loading.value = false
    }
  }

  async function fetchOne(id: string) {
    return await $fetch<PluginDetail>(`/api/plugins/${encodeURIComponent(id)}`)
  }

  async function updateSkill(pluginId: string, skill: string, frontmatter: SkillFrontmatter, body: string) {
    return await $fetch('/api/plugins/skills/update', {
      method: 'PUT',
      body: { pluginId, skill, frontmatter, body },
    })
  }

  return { plugins, loading, fetchAll, fetchOne, updateSkill }
}
