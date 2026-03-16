<script setup lang="ts">
import { agentTemplates } from '~/utils/templates'
import { commandTemplates } from '~/utils/commandTemplates'
import { getAgentColor, modelColors } from '~/utils/colors'

const { create: createAgent } = useAgents()
const { create: createCommand } = useCommands()
const router = useRouter()
const toast = useToast()

const creating = ref<string | null>(null)
const searchQuery = ref('')
const activeTab = ref<'agents' | 'commands'>('agents')

const agentCategories: Record<string, string[]> = {
  Development: ['code-reviewer', 'debug-helper', 'documentation-writer'],
  Writing: ['writing-assistant', 'email-drafter', 'social-media-writer'],
  Productivity: ['project-planner', 'meeting-summarizer', 'research-assistant'],
}

function agentCategoryFor(id: string): string {
  for (const [cat, ids] of Object.entries(agentCategories)) {
    if (ids.includes(id)) return cat
  }
  return 'Other'
}

const filteredAgentTemplates = computed(() => {
  if (!searchQuery.value) return agentTemplates
  const q = searchQuery.value.toLowerCase()
  return agentTemplates.filter(t =>
    t.frontmatter.name.toLowerCase().includes(q) ||
    t.frontmatter.description.toLowerCase().includes(q)
  )
})

const groupedAgentTemplates = computed(() => {
  const groups: Record<string, typeof agentTemplates> = {}
  for (const t of filteredAgentTemplates.value) {
    const cat = agentCategoryFor(t.id)
    if (!groups[cat]) groups[cat] = []
    groups[cat].push(t)
  }
  return groups
})

const filteredCommandTemplates = computed(() => {
  if (!searchQuery.value) return commandTemplates
  const q = searchQuery.value.toLowerCase()
  return commandTemplates.filter(t =>
    t.frontmatter.name.toLowerCase().includes(q) ||
    t.frontmatter.description.toLowerCase().includes(q)
  )
})

async function useAgentTemplate(templateId: string) {
  const template = agentTemplates.find(t => t.id === templateId)
  if (!template) return
  creating.value = templateId
  try {
    const agent = await createAgent({ frontmatter: { ...template.frontmatter }, body: template.body })
    toast.add({ title: `${template.frontmatter.name} created`, color: 'success' })
    router.push(`/agents/${agent.slug}`)
  } catch (e: any) {
    toast.add({ title: 'Failed to create', description: e.data?.message || e.message, color: 'error' })
  } finally {
    creating.value = null
  }
}

async function useCommandTemplate(templateId: string) {
  const template = commandTemplates.find(t => t.id === templateId)
  if (!template) return
  creating.value = templateId
  try {
    const command = await createCommand({
      frontmatter: { ...template.frontmatter },
      body: template.body,
      directory: template.directory,
    })
    toast.add({ title: `/${template.frontmatter.name} created`, color: 'success' })
    router.push(`/commands/${command.slug}`)
  } catch (e: any) {
    toast.add({ title: 'Failed to create', description: e.data?.message || e.message, color: 'error' })
  } finally {
    creating.value = null
  }
}

const previewId = ref<string | null>(null)
</script>

<template>
  <div>
    <PageHeader title="Templates">
      <template #trailing>
        <span class="text-[12px] text-meta">{{ agentTemplates.length + commandTemplates.length }}</span>
      </template>
    </PageHeader>

    <div class="px-6 py-4 space-y-6">
      <p class="text-[12px] leading-relaxed text-label">
        Pre-built configurations you can create with one click. Customize them after creation.
      </p>

      <!-- Tab switcher -->
      <div class="flex items-center gap-1 p-0.5 rounded-lg w-fit" style="background: var(--badge-subtle-bg);">
        <button
          class="px-3 py-1.5 rounded-md text-[12px] font-medium transition-all"
          :style="{
            background: activeTab === 'agents' ? 'var(--surface-base)' : 'transparent',
            color: activeTab === 'agents' ? 'var(--text-primary)' : 'var(--text-tertiary)',
            boxShadow: activeTab === 'agents' ? '0 1px 3px var(--card-shadow)' : 'none',
          }"
          @click="activeTab = 'agents'"
        >
          Agents ({{ agentTemplates.length }})
        </button>
        <button
          class="px-3 py-1.5 rounded-md text-[12px] font-medium transition-all"
          :style="{
            background: activeTab === 'commands' ? 'var(--surface-base)' : 'transparent',
            color: activeTab === 'commands' ? 'var(--text-primary)' : 'var(--text-tertiary)',
            boxShadow: activeTab === 'commands' ? '0 1px 3px var(--card-shadow)' : 'none',
          }"
          @click="activeTab = 'commands'"
        >
          Commands ({{ commandTemplates.length }})
        </button>
      </div>

      <div class="mb-4">
        <input
          v-model="searchQuery"
          placeholder="Search templates..."
          class="field-search max-w-xs"
        />
      </div>

      <!-- Agent templates -->
      <template v-if="activeTab === 'agents'">
        <div v-for="(templates, category) in groupedAgentTemplates" :key="category" class="space-y-3">
          <h3 class="text-section-label">{{ category }}</h3>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div
              v-for="template in templates"
              :key="template.id"
              class="rounded-xl overflow-hidden bg-card group"
            >
              <div class="p-4 space-y-3">
                <div class="flex items-center gap-2.5">
                  <div
                    class="size-8 rounded-lg flex items-center justify-center shrink-0"
                    :style="{ background: getAgentColor(template.frontmatter.color) + '15', border: '1px solid ' + getAgentColor(template.frontmatter.color) + '25' }"
                  >
                    <UIcon :name="template.icon" class="size-4" :style="{ color: getAgentColor(template.frontmatter.color) }" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="text-[13px] font-medium truncate">{{ template.frontmatter.name }}</div>
                    <div class="flex items-center gap-1.5 mt-0.5">
                      <span
                        v-if="template.frontmatter.model && modelColors[template.frontmatter.model]"
                        class="text-[10px] font-mono font-medium px-1.5 py-px rounded-full"
                        :class="[modelColors[template.frontmatter.model].bg, modelColors[template.frontmatter.model].text]"
                      >
                        {{ template.frontmatter.model }}
                      </span>
                    </div>
                  </div>
                </div>

                <p class="text-[12px] text-label leading-relaxed">
                  {{ template.frontmatter.description }}
                </p>

                <button
                  class="text-[12px] text-meta hover:text-label transition-colors"
                  @click="previewId = previewId === template.id ? null : template.id"
                >
                  {{ previewId === template.id ? 'Hide instructions' : 'Preview instructions' }}
                </button>

                <div
                  v-if="previewId === template.id"
                  class="rounded-lg p-3 text-[12px] font-mono leading-relaxed text-label max-h-48 overflow-y-auto"
                  style="background: var(--surface-base); border: 1px solid var(--border-subtle);"
                >
                  <pre class="whitespace-pre-wrap">{{ template.body }}</pre>
                </div>
              </div>

              <div class="px-4 py-3 flex items-center justify-end" style="border-top: 1px solid var(--border-subtle);">
                <UButton
                  label="Use template"
                  size="sm"
                  :loading="creating === template.id"
                  :disabled="creating !== null && creating !== template.id"
                  @click="useAgentTemplate(template.id)"
                />
              </div>
            </div>
          </div>
        </div>

        <div v-if="!filteredAgentTemplates.length" class="flex flex-col items-center justify-center py-12">
          <p class="text-[13px] text-label">No agent templates match your search.</p>
        </div>
      </template>

      <!-- Command templates -->
      <template v-if="activeTab === 'commands'">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div
            v-for="template in filteredCommandTemplates"
            :key="template.id"
            class="rounded-xl overflow-hidden bg-card group"
          >
            <div class="p-4 space-y-3">
              <div class="flex items-center gap-2.5">
                <div
                  class="size-8 rounded-lg flex items-center justify-center shrink-0"
                  style="background: var(--badge-subtle-bg); border: 1px solid var(--border-subtle);"
                >
                  <UIcon :name="template.icon" class="size-4 text-label" />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-[13px] font-medium truncate">/{{ template.frontmatter.name }}</div>
                  <span
                    v-if="template.frontmatter['argument-hint']"
                    class="text-[10px] font-mono text-meta"
                  >
                    {{ template.frontmatter['argument-hint'] }}
                  </span>
                </div>
              </div>

              <p class="text-[12px] text-label leading-relaxed">
                {{ template.frontmatter.description }}
              </p>

              <button
                class="text-[12px] text-meta hover:text-label transition-colors"
                @click="previewId = previewId === template.id ? null : template.id"
              >
                {{ previewId === template.id ? 'Hide instructions' : 'Preview instructions' }}
              </button>

              <div
                v-if="previewId === template.id"
                class="rounded-lg p-3 text-[12px] font-mono leading-relaxed text-label max-h-48 overflow-y-auto"
                style="background: var(--surface-base); border: 1px solid var(--border-subtle);"
              >
                <pre class="whitespace-pre-wrap">{{ template.body }}</pre>
              </div>
            </div>

            <div class="px-4 py-3 flex items-center justify-end" style="border-top: 1px solid var(--border-subtle);">
              <UButton
                label="Use template"
                size="sm"
                :loading="creating === template.id"
                :disabled="creating !== null && creating !== template.id"
                @click="useCommandTemplate(template.id)"
              />
            </div>
          </div>
        </div>

        <div v-if="!filteredCommandTemplates.length" class="flex flex-col items-center justify-center py-12">
          <p class="text-[13px] text-label">No command templates match your search.</p>
        </div>
      </template>
    </div>
  </div>
</template>
