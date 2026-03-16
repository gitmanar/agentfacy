<script setup lang="ts">
const { skills, loading } = useSkills()
const router = useRouter()

const showCreateModal = ref(false)
const searchQuery = ref('')

const filteredSkills = computed(() => {
  if (!searchQuery.value) return skills.value
  const q = searchQuery.value.toLowerCase()
  return skills.value.filter(s =>
    s.frontmatter.name.toLowerCase().includes(q) ||
    s.frontmatter.description?.toLowerCase().includes(q) ||
    s.frontmatter.agent?.toLowerCase().includes(q)
  )
})
</script>

<template>
  <div>
    <PageHeader title="Skills">
      <template #trailing>
        <span class="font-mono text-[12px] text-meta">{{ skills.length }}</span>
      </template>
      <template #right>
        <UButton label="New Skill" icon="i-lucide-plus" size="sm" @click="showCreateModal = true" />
      </template>
    </PageHeader>

    <div class="px-6 py-4">
      <p class="text-[12px] mb-4 leading-relaxed text-label">
        Specific capabilities that can be added to agents and invoked as slash commands.
      </p>

      <!-- Search -->
      <div class="mb-4">
        <input
          v-model="searchQuery"
          placeholder="Search skills..."
          class="field-search max-w-xs"
        />
      </div>

      <div v-if="loading" class="space-y-1">
        <SkeletonRow v-for="i in 5" :key="i" />
      </div>

      <!-- Skill list -->
      <div v-else-if="filteredSkills.length" class="space-y-1">
        <NuxtLink
          v-for="skill in filteredSkills"
          :key="skill.slug"
          :to="`/skills/${skill.slug}`"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg group focus-ring hover-row"
        >
          <!-- Icon -->
          <UIcon name="i-lucide-sparkles" class="size-3.5 shrink-0" style="color: var(--accent);" />

          <!-- Name -->
          <span class="text-[13px] font-medium w-44 shrink-0 truncate">
            {{ skill.frontmatter.name }}
          </span>

          <!-- Context badge -->
          <span
            v-if="skill.frontmatter.context"
            class="text-[10px] font-mono px-1.5 py-px rounded-full shrink-0 badge badge-subtle"
          >
            {{ skill.frontmatter.context }}
          </span>

          <!-- Agent badge -->
          <span
            v-if="skill.frontmatter.agent"
            class="text-[10px] font-mono px-1.5 py-px rounded-full shrink-0 badge badge-agent"
          >
            agent: {{ skill.frontmatter.agent }}
          </span>

          <!-- Description -->
          <span class="flex-1 text-[12px] truncate text-label">
            {{ skill.frontmatter.description }}
          </span>

          <!-- Metadata -->
          <div class="flex items-center gap-3 shrink-0">
            <UIcon
              name="i-lucide-chevron-right"
              class="size-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-meta"
            />
          </div>
        </NuxtLink>
      </div>

      <!-- Empty state: search miss -->
      <div v-else-if="searchQuery" class="flex flex-col items-center justify-center py-16">
        <p class="text-[13px] text-label">No skills match your search.</p>
      </div>

      <!-- Empty state: no skills -->
      <div v-else class="flex flex-col items-center justify-center py-12 space-y-5">
        <div class="rounded-lg p-4 bg-card max-w-sm w-full text-[12px] text-label leading-relaxed space-y-1">
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-cpu" class="size-3.5" style="color: var(--accent);" />
            <span>code-reviewer</span>
            <span class="text-meta">agent</span>
          </div>
          <div class="flex items-center gap-2 ml-5">
            <UIcon name="i-lucide-sparkles" class="size-3" style="color: var(--accent);" />
            <span>security-audit</span>
            <span class="text-meta">skill</span>
          </div>
          <div class="flex items-center gap-2 ml-5">
            <UIcon name="i-lucide-sparkles" class="size-3" style="color: var(--accent);" />
            <span>performance-check</span>
            <span class="text-meta">skill</span>
          </div>
        </div>
        <p class="text-[13px] text-label">Skills teach agents specific capabilities. Link a skill to an agent to extend what it can do.</p>
        <UButton label="Create a skill" size="sm" @click="showCreateModal = true" />
      </div>
    </div>

    <UModal v-model:open="showCreateModal">
      <template #content>
        <SkillForm
          mode="create"
          @saved="(s) => { showCreateModal = false; router.push(`/skills/${s.slug}`) }"
          @cancel="showCreateModal = false"
        />
      </template>
    </UModal>
  </div>
</template>
