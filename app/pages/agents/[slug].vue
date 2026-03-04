<script setup lang="ts">
import type { Agent, AgentFrontmatter } from '~/types'
import { getAgentColor } from '~/utils/colors'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const { fetchOne, update, remove } = useAgents()

const slug = route.params.slug as string
const agent = ref<Agent | null>(null)
const saving = ref(false)

const frontmatter = ref<AgentFrontmatter>({ name: '', description: '' })
const body = ref('')

onMounted(async () => {
  try {
    agent.value = await fetchOne(slug)
    frontmatter.value = { ...agent.value.frontmatter }
    body.value = agent.value.body
  } catch {
    toast.add({ title: 'Agent not found', color: 'error' })
    router.push('/agents')
  }
})

async function save() {
  saving.value = true
  try {
    const updated = await update(slug, { frontmatter: frontmatter.value, body: body.value })
    agent.value = updated
    toast.add({ title: 'Saved', color: 'success' })
    if (updated.slug !== slug) router.replace(`/agents/${updated.slug}`)
  } catch (e: any) {
    toast.add({ title: 'Failed to save', description: e.message, color: 'error' })
  } finally {
    saving.value = false
  }
}

const showDeleteConfirm = ref(false)

async function deleteAgent() {
  try {
    await remove(slug)
    toast.add({ title: 'Deleted', color: 'success' })
    router.push('/agents')
  } catch {
    toast.add({ title: 'Failed to delete', color: 'error' })
  }
}

// Cmd+S to save
if (import.meta.client) {
  const onKeydown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault()
      save()
    }
  }
  onMounted(() => document.addEventListener('keydown', onKeydown))
  onUnmounted(() => document.removeEventListener('keydown', onKeydown))
}

const charCount = computed(() => body.value.length)
const lineCount = computed(() => body.value.split('\n').length)
</script>

<template>
  <div>
    <PageHeader :title="agent?.frontmatter.name || slug">
      <template #leading>
        <NuxtLink to="/agents" class="focus-ring rounded">
          <UIcon name="i-lucide-arrow-left" class="size-4" style="color: var(--text-tertiary);" />
        </NuxtLink>
      </template>
      <template #trailing>
        <div
          v-if="agent"
          class="size-2.5 rounded-full"
          :style="{ background: getAgentColor(agent.frontmatter.color) }"
        />
      </template>
      <template #right>
        <button
          class="text-[12px] px-2 py-1 rounded focus-ring"
          style="color: var(--text-tertiary);"
          @click="showDeleteConfirm = true"
        >
          Delete
        </button>
        <UButton label="Save" icon="i-lucide-save" size="sm" :loading="saving" @click="save" />
      </template>
    </PageHeader>

    <!-- Breadcrumb -->
    <div class="px-6 pt-3 pb-1">
      <span class="text-[11px]" style="color: var(--text-disabled);">
        Agents &rsaquo; {{ agent?.frontmatter.name || slug }}
      </span>
    </div>

    <div v-if="agent" class="px-6 py-4 space-y-6">
      <!-- Configuration -->
      <div
        class="rounded-xl p-5 space-y-4"
        style="background: var(--surface-raised); border: 1px solid var(--border-subtle);"
      >
        <h3 class="text-section-label">Configuration</h3>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <UFormField label="Name">
            <UInput v-model="frontmatter.name" size="sm" />
          </UFormField>
          <UFormField label="Model">
            <USelect
              v-model="frontmatter.model"
              size="sm"
              :items="[
                { label: 'None', value: undefined },
                { label: 'Opus', value: 'opus' },
                { label: 'Sonnet', value: 'sonnet' },
                { label: 'Haiku', value: 'haiku' },
              ]"
            />
          </UFormField>
          <UFormField label="Color">
            <USelect
              v-model="frontmatter.color"
              size="sm"
              :items="[
                { label: 'None', value: undefined },
                { label: 'Pink', value: 'pink' },
                { label: 'Orange', value: 'orange' },
                { label: 'Blue', value: 'blue' },
                { label: 'Cyan', value: 'cyan' },
                { label: 'Green', value: 'green' },
                { label: 'Purple', value: 'purple' },
                { label: 'Yellow', value: 'yellow' },
                { label: 'Red', value: 'red' },
              ]"
            />
          </UFormField>
          <UFormField label="Memory">
            <USelect
              v-model="frontmatter.memory"
              size="sm"
              :items="[
                { label: 'None', value: undefined },
                { label: 'User', value: 'user' },
                { label: 'Project', value: 'project' },
              ]"
            />
          </UFormField>
        </div>

        <UFormField label="Description">
          <UTextarea v-model="frontmatter.description" :rows="2" size="sm" />
        </UFormField>
      </div>

      <!-- System Prompt Editor -->
      <div
        class="rounded-xl overflow-hidden"
        style="border: 1px solid var(--border-subtle);"
      >
        <div class="flex items-center justify-between px-4 py-2.5" style="background: var(--surface-raised); border-bottom: 1px solid var(--border-subtle);">
          <h3 class="text-section-label">System Prompt</h3>
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
          v-model="body"
          class="w-full resize-none font-mono text-[13px] leading-relaxed p-4 focus:outline-none"
          style="background: var(--surface-base); color: var(--text-primary); min-height: 500px;"
          spellcheck="false"
          placeholder="Agent system prompt..."
        />
      </div>

      <!-- File info -->
      <div class="flex items-center gap-3 font-mono text-[10px]" style="color: var(--text-disabled);">
        <span>{{ agent.filePath }}</span>
        <span v-if="agent.hasMemory" class="flex items-center gap-1">
          <UIcon name="i-lucide-brain" class="size-3" />
          memory
        </span>
      </div>
    </div>

    <div v-else class="flex justify-center py-16">
      <UIcon name="i-lucide-loader-2" class="size-6 animate-spin" style="color: var(--text-disabled);" />
    </div>

    <!-- Delete confirmation -->
    <UModal v-model:open="showDeleteConfirm">
      <template #content>
        <div class="p-6 space-y-4" style="background: var(--surface-overlay);">
          <h3 class="text-page-title">Delete Agent</h3>
          <p class="text-[13px]" style="color: var(--text-secondary);">
            Delete <strong class="font-mono">{{ agent?.frontmatter.name }}</strong>? This removes the file from disk.
          </p>
          <div class="flex justify-end gap-2">
            <UButton label="Cancel" variant="ghost" color="neutral" size="sm" @click="showDeleteConfirm = false" />
            <UButton label="Delete" color="error" size="sm" @click="deleteAgent" />
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
