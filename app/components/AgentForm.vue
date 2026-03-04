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

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div class="field-group">
        <label class="field-label" data-required>Name</label>
        <input v-model="frontmatter.name" class="field-input" placeholder="my-agent" />
      </div>

      <div class="field-group">
        <label class="field-label">Model</label>
        <div class="pill-picker">
          <button
            type="button"
            class="pill-picker__option"
            :class="{ 'pill-picker__option--active': !frontmatter.model }"
            @click="frontmatter.model = undefined"
          >none</button>
          <button
            type="button"
            class="pill-picker__option pill-picker__option--opus"
            :class="{ 'pill-picker__option--active': frontmatter.model === 'opus' }"
            @click="frontmatter.model = 'opus'"
          >opus</button>
          <button
            type="button"
            class="pill-picker__option pill-picker__option--sonnet"
            :class="{ 'pill-picker__option--active': frontmatter.model === 'sonnet' }"
            @click="frontmatter.model = 'sonnet'"
          >sonnet</button>
          <button
            type="button"
            class="pill-picker__option pill-picker__option--haiku"
            :class="{ 'pill-picker__option--active': frontmatter.model === 'haiku' }"
            @click="frontmatter.model = 'haiku'"
          >haiku</button>
        </div>
      </div>
    </div>

    <div class="field-group">
      <label class="field-label" data-required>Description</label>
      <textarea v-model="frontmatter.description" rows="2" class="field-textarea" placeholder="When to use this agent..." />
    </div>

    <div class="field-group">
      <label class="field-label">System Prompt</label>
      <textarea
        v-model="body"
        class="editor-textarea editor-textarea--standalone"
        spellcheck="false"
        placeholder="Agent instructions..."
      />
    </div>

    <div class="flex justify-end gap-2 pt-2">
      <UButton label="Cancel" variant="ghost" color="neutral" size="sm" @click="emit('cancel')" />
      <UButton label="Create" size="sm" :loading="saving" @click="save" />
    </div>
  </div>
</template>
