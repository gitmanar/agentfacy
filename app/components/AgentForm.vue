<script setup lang="ts">
import type { Agent, AgentFrontmatter } from '~/types'

const props = defineProps<{
  mode: 'create' | 'edit'
  initial?: Agent
}>()

const emit = defineEmits<{
  saved: [agent: Agent]
  cancel: []
}>()

const { create } = useAgents()
const toast = useToast()
const saving = ref(false)

const frontmatter = ref<AgentFrontmatter>({
  name: props.initial?.frontmatter.name || '',
  description: props.initial?.frontmatter.description || '',
  model: props.initial?.frontmatter.model,
  color: props.initial?.frontmatter.color,
  memory: props.initial?.frontmatter.memory,
})

const body = ref(props.initial?.body || '')

async function save() {
  if (!frontmatter.value.name) {
    toast.add({ title: 'Name is required', color: 'error' })
    return
  }

  saving.value = true
  try {
    const agent = await create({ frontmatter: frontmatter.value, body: body.value })
    toast.add({ title: 'Agent created', color: 'success' })
    emit('saved', agent)
  } catch (e: any) {
    toast.add({ title: 'Failed to create agent', description: e.data?.message || e.message, color: 'error' })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="p-6 space-y-4" style="background: var(--surface-overlay);">
    <h3 class="text-page-title">New Agent</h3>

    <div class="grid grid-cols-2 gap-4">
      <UFormField label="Name" required>
        <UInput v-model="frontmatter.name" size="sm" placeholder="my-agent" />
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
    </div>

    <UFormField label="Description" required>
      <UTextarea v-model="frontmatter.description" :rows="2" size="sm" placeholder="When to use this agent..." />
    </UFormField>

    <UFormField label="System Prompt">
      <textarea
        v-model="body"
        class="w-full resize-none font-mono text-[13px] leading-relaxed p-3 rounded-lg focus:outline-none"
        style="background: var(--surface-base); color: var(--text-primary); border: 1px solid var(--border-default); min-height: 200px;"
        spellcheck="false"
        placeholder="Agent instructions..."
      />
    </UFormField>

    <div class="flex justify-end gap-2 pt-2">
      <UButton label="Cancel" variant="ghost" color="neutral" size="sm" @click="emit('cancel')" />
      <UButton label="Create" size="sm" :loading="saving" @click="save" />
    </div>
  </div>
</template>
