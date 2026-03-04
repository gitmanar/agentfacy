export function useClaudeDir() {
  const claudeDir = useState<string | null>('claudeDir', () => null)
  const loading = useState('claudeDirLoading', () => false)

  async function load() {
    loading.value = true
    try {
      const data = await $fetch<{ claudeDir: string }>('/api/config')
      claudeDir.value = data.claudeDir || null
    } finally {
      loading.value = false
    }
  }

  async function set(dir: string) {
    await $fetch('/api/config', { method: 'POST', body: { claudeDir: dir } })
    claudeDir.value = dir
  }

  return { claudeDir, loading, load, set }
}
