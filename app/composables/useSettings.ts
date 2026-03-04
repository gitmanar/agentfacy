import type { Settings } from '~/types'

export function useSettings() {
  const settings = useState<Settings | null>('settings', () => null)
  const loading = useState('settingsLoading', () => false)

  async function load() {
    loading.value = true
    try {
      settings.value = await $fetch<Settings>('/api/settings')
    } finally {
      loading.value = false
    }
  }

  async function save(data: Settings) {
    settings.value = await $fetch<Settings>('/api/settings', { method: 'PUT', body: data })
  }

  return { settings, loading, load, save }
}
