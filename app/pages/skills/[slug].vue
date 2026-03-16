<script setup lang="ts">
import type { Skill, SkillFrontmatter } from '~/types'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const { fetchOne, update, remove } = useSkills()
const { agents } = useAgents()

const slug = route.params.slug as string
const skill = ref<Skill | null>(null)
const saving = ref(false)

const frontmatter = ref<SkillFrontmatter>({ name: '', description: '' })
const body = ref('')

onMounted(async () => {
  try {
    skill.value = await fetchOne(slug)
    frontmatter.value = { ...skill.value.frontmatter }
    body.value = skill.value.body
  } catch {
    toast.add({ title: 'Skill not found', color: 'error' })
    router.push('/skills')
  }
})

async function save() {
  if (!frontmatter.value.name.trim()) {
    toast.add({ title: 'Name is required', color: 'error' })
    return
  }

  saving.value = true
  try {
    // Clean empty optional fields
    const fm: SkillFrontmatter = {
      name: frontmatter.value.name.trim(),
      description: frontmatter.value.description.trim(),
    }
    if (frontmatter.value.context?.trim()) fm.context = frontmatter.value.context.trim()
    if (frontmatter.value.agent?.trim()) fm.agent = frontmatter.value.agent.trim()

    const updated = await update(slug, { frontmatter: fm, body: body.value })
    skill.value = updated
    toast.add({ title: 'Saved', color: 'success' })
    if (updated.slug !== slug) router.replace(`/skills/${updated.slug}`)
  } catch (e: any) {
    toast.add({ title: 'Failed to save', description: e.data?.message || e.message, color: 'error' })
  } finally {
    saving.value = false
  }
}

const showDeleteConfirm = ref(false)

async function deleteSkill() {
  try {
    await remove(slug)
    toast.add({ title: 'Deleted', color: 'success' })
    router.push('/skills')
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

const isDirty = computed(() => {
  if (!skill.value) return false
  return JSON.stringify(frontmatter.value) !== JSON.stringify(skill.value.frontmatter)
    || body.value !== skill.value.body
})

useUnsavedChanges(isDirty)

const agentOptions = computed(() =>
  agents.value.map(a => a.frontmatter.name)
)
</script>

<template>
  <div>
    <PageHeader :title="skill?.frontmatter.name || slug">
      <template #leading>
        <NuxtLink to="/skills" class="focus-ring rounded p-1.5 -m-1.5" aria-label="Back to skills">
          <UIcon name="i-lucide-arrow-left" class="size-4 text-label" />
        </NuxtLink>
      </template>
      <template #trailing>
        <UIcon name="i-lucide-sparkles" class="size-4" style="color: var(--accent);" />
      </template>
      <template #right>
        <button
          class="text-[12px] px-2 py-1 rounded focus-ring text-label"
          @click="showDeleteConfirm = true"
        >
          Delete
        </button>
        <span v-if="isDirty" class="text-[10px] font-mono unsaved-pulse" style="color: var(--warning);">unsaved</span>
        <UButton label="Save" icon="i-lucide-save" size="sm" :loading="saving" @click="save" />
      </template>
    </PageHeader>

    <div v-if="skill" class="px-6 py-5 space-y-6">
      <!-- Configuration -->
      <div
        class="rounded-xl overflow-hidden"
        style="border: 1px solid var(--border-subtle);"
      >
        <!-- Skill identity banner -->
        <div class="relative px-5 pt-6 pb-5" style="background: var(--surface-raised);">
          <!-- Top accent bar -->
          <div
            class="absolute inset-x-0 top-0 h-[3px]"
            style="background: var(--accent);"
          />

          <!-- Identity row -->
          <div class="flex items-start gap-4">
            <div
              class="size-11 rounded-xl flex items-center justify-center shrink-0"
              style="background: var(--accent-muted); border: 1px solid rgba(45, 212, 191, 0.15);"
            >
              <UIcon name="i-lucide-sparkles" class="size-5" style="color: var(--accent);" />
            </div>

            <div class="flex-1 min-w-0 pt-0.5">
              <div class="flex items-center gap-2.5 flex-wrap">
                <span class="text-[15px] font-semibold tracking-tight truncate">
                  {{ frontmatter.name || 'Unnamed Skill' }}
                </span>
                <span
                  v-if="frontmatter.context"
                  class="text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 badge badge-subtle"
                >
                  {{ frontmatter.context }}
                </span>
              </div>
              <p v-if="frontmatter.description" class="text-[12px] mt-1 leading-relaxed text-label">
                {{ frontmatter.description }}
              </p>
            </div>
          </div>
        </div>

        <!-- Form fields -->
        <div class="px-5 py-4 space-y-4" style="background: var(--surface-base); border-top: 1px solid var(--border-subtle);">
          <h3 class="text-section-label">Configuration</h3>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="field-group">
              <label class="field-label">Name</label>
              <input v-model="frontmatter.name" class="field-input" />
            </div>
            <div class="field-group">
              <label class="field-label">Availability</label>
              <input v-model="frontmatter.context" class="field-input" placeholder="Leave blank for always available" />
              <span class="field-hint">Optionally restrict when this skill appears</span>
            </div>
            <div class="field-group">
              <label class="field-label">Agent</label>
              <input
                v-model="frontmatter.agent"
                class="field-input"
                placeholder="Optional — link to an agent"
                :list="agentOptions.length > 0 ? 'agent-opts-detail' : undefined"
              />
              <datalist v-if="agentOptions.length > 0" id="agent-opts-detail">
                <option v-for="a in agentOptions" :key="a" :value="a" />
              </datalist>
            </div>
          </div>

          <div class="field-group">
            <label class="field-label">Description</label>
            <textarea v-model="frontmatter.description" rows="2" class="field-textarea" />
          </div>
        </div>
      </div>

      <!-- Skill Prompt Editor -->
      <div
        class="rounded-xl overflow-hidden"
        style="border: 1px solid var(--border-subtle);"
      >
        <div class="flex items-center justify-between px-4 py-2.5" style="background: var(--surface-raised); border-bottom: 1px solid var(--border-subtle);">
          <h3 class="text-section-label">Instructions</h3>
          <div class="flex items-center gap-3">
            <span class="font-mono text-[10px] text-meta">
              {{ lineCount }} lines
            </span>
            <span class="font-mono text-[10px] text-meta">
              {{ charCount.toLocaleString() }} chars
            </span>
          </div>
        </div>
        <textarea
          v-model="body"
          class="editor-textarea"
          style="min-height: 500px;"
          spellcheck="false"
          placeholder="Skill instructions..."
        />
      </div>

      <!-- File location (collapsed) -->
      <details class="group">
        <summary class="text-[10px] cursor-pointer list-none flex items-center gap-1.5 text-meta">
          <UIcon name="i-lucide-file" class="size-3" />
          Show file location
        </summary>
        <div class="mt-1 font-mono text-[10px] pl-4.5 text-meta">
          {{ skill.filePath }}
        </div>
      </details>
    </div>

    <div v-else class="flex justify-center py-16">
      <UIcon name="i-lucide-loader-2" class="size-6 animate-spin text-meta" />
    </div>

    <!-- Delete confirmation -->
    <UModal v-model:open="showDeleteConfirm">
      <template #content>
        <div class="p-6 space-y-4 bg-overlay">
          <h3 class="text-page-title">Delete Skill</h3>
          <p class="text-[13px] text-label">
            Permanently delete <strong>{{ skill?.frontmatter.name }}</strong>? This action cannot be undone.
          </p>
          <div class="flex justify-end gap-2">
            <UButton label="Cancel" variant="ghost" color="neutral" size="sm" @click="showDeleteConfirm = false" />
            <UButton label="Delete" color="error" size="sm" @click="deleteSkill" />
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
