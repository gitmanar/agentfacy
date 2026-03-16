<script setup lang="ts">
import type { Agent } from '~/types'
import { agentTemplates } from '~/utils/templates'
import { getAgentColor, modelColors } from '~/utils/colors'

const { create } = useAgents()
const router = useRouter()
const toast = useToast()

const creating = ref<string | null>(null)
const searchQuery = ref('')

const categories: Record<string, string[]> = {
  Development: ['code-reviewer', 'debug-helper'],
  Writing: ['writing-assistant', 'documentation-writer'],
  Planning: ['project-planner'],
}

const filteredTemplates = computed(() => {
  if (!searchQuery.value) return agentTemplates
  const q = searchQuery.value.toLowerCase()
  return agentTemplates.filter(t =>
    t.frontmatter.name.toLowerCase().includes(q) ||
    t.frontmatter.description.toLowerCase().includes(q)
  )
})

function categoryFor(id: string): string {
  for (const [cat, ids] of Object.entries(categories)) {
    if (ids.includes(id)) return cat
  }
  return 'Other'
}

const groupedTemplates = computed(() => {
  const groups: Record<string, typeof agentTemplates> = {}
  for (const t of filteredTemplates.value) {
    const cat = categoryFor(t.id)
    if (!groups[cat]) groups[cat] = []
    groups[cat].push(t)
  }
  return groups
})

async function useTemplate(templateId: string) {
  const template = agentTemplates.find(t => t.id === templateId)
  if (!template) return
  creating.value = templateId
  try {
    const agent = await create({ frontmatter: { ...template.frontmatter }, body: template.body })
    toast.add({ title: `${template.frontmatter.name} created`, color: 'success' })
    router.push(`/agents/${agent.slug}`)
  } catch (e: any) {
    toast.add({ title: 'Failed to create', description: e.data?.message || e.message, color: 'error' })
  } finally {
    creating.value = null
  }
}

const previewTemplate = ref<typeof agentTemplates[0] | null>(null)
</script>

<template>
  <div>
    <PageHeader title="Templates">
      <template #trailing>
        <span class="text-[12px] text-meta">{{ agentTemplates.length }}</span>
      </template>
    </PageHeader>

    <div class="px-6 py-4 space-y-6">
      <p class="text-[12px] leading-relaxed text-label">
        Pre-built agent configurations you can create with one click. Customize them after creation.
      </p>

      <div class="mb-4">
        <input
          v-model="searchQuery"
          placeholder="Search templates..."
          class="field-search max-w-xs"
        />
      </div>

      <div v-for="(templates, category) in groupedTemplates" :key="category" class="space-y-3">
        <h3 class="text-section-label">{{ category }}</h3>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div
            v-for="template in templates"
            :key="template.id"
            class="rounded-xl overflow-hidden bg-card group"
          >
            <!-- Card content -->
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

              <!-- Preview toggle -->
              <button
                class="text-[12px] text-meta hover:text-label transition-colors"
                @click="previewTemplate = previewTemplate?.id === template.id ? null : template"
              >
                {{ previewTemplate?.id === template.id ? 'Hide instructions' : 'Preview instructions' }}
              </button>

              <!-- Instructions preview -->
              <div
                v-if="previewTemplate?.id === template.id"
                class="rounded-lg p-3 text-[12px] font-mono leading-relaxed text-label max-h-48 overflow-y-auto"
                style="background: var(--surface-base); border: 1px solid var(--border-subtle);"
              >
                <pre class="whitespace-pre-wrap">{{ template.body }}</pre>
              </div>
            </div>

            <!-- Action bar -->
            <div class="px-4 py-3 flex items-center justify-end" style="border-top: 1px solid var(--border-subtle);">
              <UButton
                label="Use template"
                size="sm"
                :loading="creating === template.id"
                :disabled="creating !== null && creating !== template.id"
                @click="useTemplate(template.id)"
              />
            </div>
          </div>
        </div>
      </div>

      <div v-if="!filteredTemplates.length" class="flex flex-col items-center justify-center py-12">
        <p class="text-[13px] text-label">No templates match your search.</p>
      </div>
    </div>
  </div>
</template>
