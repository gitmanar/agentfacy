<script setup lang="ts">
const { settings, loading, load, save } = useSettings()
const toast = useToast()

const rawJson = ref('')
const saving = ref(false)
const viewMode = ref<'structured' | 'raw'>('structured')

onMounted(async () => {
  await load()
  if (settings.value) {
    rawJson.value = JSON.stringify(settings.value, null, 2)
  }
})

watch(settings, (val) => {
  if (val) rawJson.value = JSON.stringify(val, null, 2)
})

async function saveRaw() {
  saving.value = true
  try {
    const parsed = JSON.parse(rawJson.value)
    await save(parsed)
    toast.add({ title: 'Settings saved', color: 'success' })
  } catch (e: any) {
    toast.add({ title: 'Invalid JSON', description: e.message, color: 'error' })
  } finally {
    saving.value = false
  }
}

// Cmd+S to save in raw mode
if (import.meta.client) {
  const onKeydown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 's' && viewMode.value === 'raw') {
      e.preventDefault()
      saveRaw()
    }
  }
  onMounted(() => document.addEventListener('keydown', onKeydown))
  onUnmounted(() => document.removeEventListener('keydown', onKeydown))
}

const plugins = computed(() => {
  if (!settings.value?.enabledPlugins) return []
  return Object.entries(settings.value.enabledPlugins).map(([name, enabled]) => ({
    name,
    enabled: Boolean(enabled),
  }))
})

async function togglePlugin(name: string, enabled: boolean) {
  if (!settings.value) return
  const updated = {
    ...settings.value,
    enabledPlugins: {
      ...settings.value.enabledPlugins,
      [name]: enabled,
    },
  }
  try {
    await save(updated)
    toast.add({ title: `Plugin ${enabled ? 'enabled' : 'disabled'}`, color: 'success' })
  } catch {
    toast.add({ title: 'Failed to update', color: 'error' })
  }
}

const charCount = computed(() => rawJson.value.length)
const lineCount = computed(() => rawJson.value.split('\n').length)
</script>

<template>
  <div>
    <PageHeader title="Settings">
      <template #right>
        <button
          class="text-[12px] font-mono px-2 py-1 rounded focus-ring"
          style="color: var(--text-tertiary); background: var(--surface-raised); border: 1px solid var(--border-default);"
          @click="viewMode = viewMode === 'structured' ? 'raw' : 'structured'"
        >
          {{ viewMode === 'structured' ? 'Raw JSON' : 'Structured' }}
        </button>
        <UButton v-if="viewMode === 'raw'" label="Save" icon="i-lucide-save" size="sm" :loading="saving" @click="saveRaw" />
      </template>
    </PageHeader>

    <div v-if="loading" class="flex justify-center py-16">
      <UIcon name="i-lucide-loader-2" class="size-6 animate-spin" style="color: var(--text-disabled);" />
    </div>

    <div v-else-if="viewMode === 'structured'" class="px-6 py-4 space-y-6">
      <!-- Plugins -->
      <div
        class="rounded-xl p-5 space-y-4"
        style="background: var(--surface-raised); border: 1px solid var(--border-subtle);"
      >
        <h3 class="text-section-label">Enabled Plugins</h3>
        <div v-if="plugins.length === 0" class="text-[13px]" style="color: var(--text-tertiary);">
          No plugins configured.
        </div>
        <div v-else class="space-y-2">
          <div
            v-for="plugin in plugins"
            :key="plugin.name"
            class="flex items-center justify-between py-1.5 px-3 rounded-lg"
            style="background: rgba(255,255,255,0.02);"
          >
            <span class="font-mono text-[12px]" style="color: var(--text-secondary);">{{ plugin.name }}</span>
            <USwitch
              :model-value="plugin.enabled"
              size="sm"
              @update:model-value="(val: boolean) => togglePlugin(plugin.name, val)"
            />
          </div>
        </div>
      </div>

      <!-- General -->
      <div
        class="rounded-xl p-5 space-y-4"
        style="background: var(--surface-raised); border: 1px solid var(--border-subtle);"
      >
        <h3 class="text-section-label">General</h3>
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-[12px]" style="color: var(--text-tertiary);">Always Thinking</span>
            <span
              class="font-mono text-[11px] px-1.5 py-px rounded-full"
              :style="{
                background: settings?.alwaysThinkingEnabled ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.06)',
                color: settings?.alwaysThinkingEnabled ? 'var(--success)' : 'var(--text-disabled)',
              }"
            >
              {{ settings?.alwaysThinkingEnabled ? 'Enabled' : 'Disabled' }}
            </span>
          </div>
          <div v-if="settings?.statusLine" class="flex items-center justify-between">
            <span class="text-[12px]" style="color: var(--text-tertiary);">Status Line</span>
            <span class="font-mono text-[11px] truncate max-w-[200px]" style="color: var(--text-disabled);">
              {{ settings.statusLine.type }}
            </span>
          </div>
        </div>
      </div>

      <!-- Hooks -->
      <div
        v-if="settings?.hooks"
        class="rounded-xl p-5 space-y-4"
        style="background: var(--surface-raised); border: 1px solid var(--border-subtle);"
      >
        <h3 class="text-section-label">Hooks</h3>
        <div class="space-y-2">
          <div
            v-for="(hookList, event) in (settings.hooks as Record<string, unknown[]>)"
            :key="event"
            class="flex items-center justify-between py-1.5 px-3 rounded-lg"
            style="background: rgba(255,255,255,0.02);"
          >
            <span class="font-mono text-[12px]" style="color: var(--text-secondary);">{{ event }}</span>
            <span class="font-mono text-[10px]" style="color: var(--text-disabled);">
              {{ Array.isArray(hookList) ? hookList.length : 0 }} hook(s)
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Raw JSON editor -->
    <div v-else class="px-6 py-4">
      <div
        class="rounded-xl overflow-hidden"
        style="border: 1px solid var(--border-subtle);"
      >
        <div class="flex items-center justify-between px-4 py-2.5" style="background: var(--surface-raised); border-bottom: 1px solid var(--border-subtle);">
          <h3 class="text-section-label">settings.json</h3>
          <div class="flex items-center gap-3">
            <span class="font-mono text-[10px]" style="color: var(--text-disabled);">
              {{ lineCount }} lines
            </span>
            <span class="font-mono text-[10px]" style="color: var(--text-disabled);">
              {{ charCount.toLocaleString() }} chars
            </span>
          </div>
        </div>
        <textarea
          v-model="rawJson"
          class="w-full resize-none font-mono text-[13px] leading-relaxed p-4 focus:outline-none"
          style="background: var(--surface-base); color: var(--text-primary); min-height: 600px;"
          spellcheck="false"
        />
      </div>
    </div>
  </div>
</template>
