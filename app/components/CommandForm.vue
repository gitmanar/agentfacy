<script setup lang="ts">
import type { Command, CommandFrontmatter } from '~/types'

const emit = defineEmits<{
  saved: [command: Command]
  cancel: []
}>()

const { create, commands } = useCommands()
const toast = useToast()
const saving = ref(false)

const frontmatter = ref<CommandFrontmatter>({
  name: '',
  description: '',
})
const body = ref('')
const directory = ref('')
const allowedToolsStr = ref('')

const existingDirs = computed(() => {
  const dirs = new Set<string>()
  for (const cmd of commands.value) {
    if (cmd.directory) dirs.add(cmd.directory)
  }
  return Array.from(dirs).sort()
})

async function save() {
  if (!frontmatter.value.name) {
    toast.add({ title: 'Name is required', color: 'error' })
    return
  }

  saving.value = true
  try {
    const tools = allowedToolsStr.value
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
    const command = await create({
      frontmatter: {
        ...frontmatter.value,
        'allowed-tools': tools.length > 0 ? tools : undefined,
      },
      body: body.value,
      directory: directory.value || undefined,
    })
    toast.add({ title: 'Command created', color: 'success' })
    emit('saved', command)
  } catch (e: any) {
    toast.add({ title: 'Failed to create', description: e.data?.message || e.message, color: 'error' })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="p-6 space-y-4" style="background: var(--surface-overlay);">
    <h3 class="text-page-title">New Command</h3>

    <div class="grid grid-cols-2 gap-4">
      <UFormField label="Name" required>
        <UInput v-model="frontmatter.name" size="sm" placeholder="my-command" />
        <template #hint>
          <span class="text-[10px]" style="color: var(--text-disabled);">e.g. gsd:my-command</span>
        </template>
      </UFormField>

      <UFormField label="Directory">
        <UInput v-model="directory" size="sm" placeholder="gsd" :list="existingDirs.length > 0 ? 'dirs-list' : undefined" />
        <datalist v-if="existingDirs.length > 0" id="dirs-list">
          <option v-for="d in existingDirs" :key="d" :value="d" />
        </datalist>
        <template #hint>
          <span class="text-[10px]" style="color: var(--text-disabled);">Subdirectory inside commands/</span>
        </template>
      </UFormField>
    </div>

    <UFormField label="Description" required>
      <UTextarea v-model="frontmatter.description" :rows="2" size="sm" placeholder="What this command does..." />
    </UFormField>

    <UFormField label="Allowed Tools">
      <UInput v-model="allowedToolsStr" size="sm" placeholder="Read, Write, Bash, Glob, Grep" />
      <template #hint>
        <span class="text-[10px]" style="color: var(--text-disabled);">Comma-separated list</span>
      </template>
    </UFormField>

    <UFormField label="Command Body">
      <textarea
        v-model="body"
        class="w-full resize-none font-mono text-[13px] leading-relaxed p-3 rounded-lg focus:outline-none"
        style="background: var(--surface-base); color: var(--text-primary); border: 1px solid var(--border-default); min-height: 200px;"
        spellcheck="false"
        placeholder="<objective>..."
      />
    </UFormField>

    <div class="flex justify-end gap-2 pt-2">
      <UButton label="Cancel" variant="ghost" color="neutral" size="sm" @click="emit('cancel')" />
      <UButton label="Create" size="sm" :loading="saving" @click="save" />
    </div>
  </div>
</template>
