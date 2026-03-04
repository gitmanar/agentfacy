<script setup lang="ts">
const { commands, loading, groupedByDirectory, remove } = useCommands()
const router = useRouter()
const toast = useToast()

const showCreateModal = ref(false)
const searchQuery = ref('')
const expandedGroups = ref<Record<string, boolean>>({})

function toggleGroup(dir: string) {
  expandedGroups.value[dir] = !expandedGroups.value[dir]
}

function isExpanded(dir: string) {
  return expandedGroups.value[dir] !== false // default expanded
}

const filteredGrouped = computed(() => {
  if (!searchQuery.value) return groupedByDirectory.value
  const q = searchQuery.value.toLowerCase()
  const result: Record<string, typeof commands.value> = {}
  for (const [dir, cmds] of Object.entries(groupedByDirectory.value)) {
    const filtered = cmds.filter(c =>
      c.frontmatter.name.toLowerCase().includes(q) ||
      c.frontmatter.description?.toLowerCase().includes(q)
    )
    if (filtered.length) result[dir] = filtered
  }
  return result
})

const filteredCount = computed(() =>
  Object.values(filteredGrouped.value).reduce((sum, cmds) => sum + cmds.length, 0)
)
</script>

<template>
  <div>
    <PageHeader title="Commands">
      <template #trailing>
        <span class="font-mono text-[12px]" style="color: var(--text-disabled);">{{ commands.length }}</span>
      </template>
      <template #right>
        <UButton label="New Command" icon="i-lucide-plus" size="sm" @click="showCreateModal = true" />
      </template>
    </PageHeader>

    <div class="px-6 py-4">
      <!-- Search -->
      <div class="mb-4">
        <UInput
          v-model="searchQuery"
          placeholder="Search commands..."
          icon="i-lucide-search"
          size="sm"
          class="max-w-xs"
        />
      </div>

      <div v-if="loading" class="flex justify-center py-12">
        <UIcon name="i-lucide-loader-2" class="size-6 animate-spin" style="color: var(--text-disabled);" />
      </div>

      <div v-else-if="Object.keys(filteredGrouped).length" class="space-y-2">
        <div v-for="(cmds, dir) in filteredGrouped" :key="dir">
          <!-- Group header -->
          <button
            class="flex items-center gap-2 w-full text-left py-2 px-2 -mx-2 rounded-md transition-colors focus-ring"
            style="color: var(--text-secondary);"
            @mouseenter="($event.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'"
            @mouseleave="($event.currentTarget as HTMLElement).style.background = 'transparent'"
            @click="toggleGroup(dir)"
          >
            <UIcon
              :name="isExpanded(dir) ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'"
              class="size-3.5"
              style="color: var(--text-disabled);"
            />
            <UIcon name="i-lucide-folder" class="size-3.5" style="color: var(--text-disabled);" />
            <span class="font-mono text-[13px] font-medium">{{ dir }}</span>
            <span class="font-mono text-[11px]" style="color: var(--text-disabled);">{{ cmds.length }}</span>
          </button>

          <!-- Commands in group -->
          <div v-if="isExpanded(dir)" class="ml-5 border-l space-y-px pl-3" style="border-color: var(--border-subtle);">
            <NuxtLink
              v-for="cmd in cmds"
              :key="cmd.slug"
              :to="`/commands/${cmd.slug}`"
              class="flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-150 group focus-ring"
              style="border: 1px solid transparent;"
              @mouseenter="($event.currentTarget as HTMLElement).style.borderColor = 'var(--border-default)'; ($event.currentTarget as HTMLElement).style.background = 'var(--surface-raised)'"
              @mouseleave="($event.currentTarget as HTMLElement).style.borderColor = 'transparent'; ($event.currentTarget as HTMLElement).style.background = 'transparent'"
            >
              <!-- Terminal icon -->
              <span class="font-mono text-[10px] font-medium shrink-0" style="color: var(--text-disabled);">&gt;_</span>

              <!-- Name -->
              <span class="font-mono text-[13px] font-medium w-44 shrink-0 truncate" style="color: var(--text-primary);">
                /{{ cmd.frontmatter.name }}
              </span>

              <!-- Argument hint badge -->
              <span
                v-if="cmd.frontmatter['argument-hint']"
                class="text-[10px] font-mono px-1.5 py-px rounded-full shrink-0"
                style="background: rgba(255,255,255,0.06); color: var(--text-disabled);"
              >
                {{ cmd.frontmatter['argument-hint'] }}
              </span>

              <!-- Description -->
              <span class="flex-1 text-[12px] truncate" style="color: var(--text-tertiary);">
                {{ cmd.frontmatter.description }}
              </span>

              <!-- Metadata -->
              <div class="flex items-center gap-3 shrink-0">
                <span class="font-mono text-[10px]" style="color: var(--text-disabled);">
                  {{ Math.round(cmd.body.length / 100) / 10 }}k chars
                </span>
                <UIcon
                  name="i-lucide-chevron-right"
                  class="size-3.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  style="color: var(--text-disabled);"
                />
              </div>
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else class="flex flex-col items-center justify-center py-16 space-y-3">
        <UIcon name="i-lucide-terminal" class="size-10" style="color: var(--text-disabled);" />
        <p class="text-[13px]" style="color: var(--text-tertiary);">
          {{ searchQuery ? 'No commands match your search.' : 'No commands found.' }}
        </p>
        <UButton v-if="!searchQuery" label="Create your first command" size="sm" @click="showCreateModal = true" />
      </div>
    </div>

    <UModal v-model:open="showCreateModal">
      <template #content>
        <CommandForm
          @saved="(c) => { showCreateModal = false; router.push(`/commands/${c.slug}`) }"
          @cancel="showCreateModal = false"
        />
      </template>
    </UModal>
  </div>
</template>
