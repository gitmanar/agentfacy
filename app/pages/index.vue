<script setup lang="ts">
import { getAgentColor, modelColors } from '~/utils/colors'

const { claudeDir, set: setDir } = useClaudeDir()
const { agents, fetchAll: fetchAgents } = useAgents()
const { commands, fetchAll: fetchCommands } = useCommands()
const { plugins, fetchAll: fetchPlugins } = usePlugins()
const { skills, fetchAll: fetchSkills } = useSkills()
const { settings, load: loadSettings } = useSettings()

const dirInput = ref('')
const settingDir = ref(false)

interface Suggestion {
  type: string
  severity: 'warning' | 'info'
  message: string
  target: { type: 'agent' | 'command' | 'skill'; slug: string }
}
const suggestions = ref<Suggestion[]>([])

onMounted(async () => {
  dirInput.value = claudeDir.value || ''
  await Promise.all([loadSettings(), fetchPlugins(), fetchSkills()])
  // Load suggestions after main data
  try {
    suggestions.value = await $fetch<Suggestion[]>('/api/suggestions')
  } catch {
    // Non-critical
  }
})

async function changeDir() {
  settingDir.value = true
  try {
    await setDir(dirInput.value)
    await Promise.all([fetchAgents(), fetchCommands(), fetchPlugins(), fetchSkills(), loadSettings()])
  } finally {
    settingDir.value = false
  }
}

const modelLabels: Record<string, string> = {
  opus: 'Claude Opus',
  sonnet: 'Claude Sonnet',
  haiku: 'Claude Haiku',
  unset: 'Default',
}

const modelBreakdown = computed(() => {
  const counts: Record<string, number> = { opus: 0, sonnet: 0, haiku: 0, unset: 0 }
  for (const a of agents.value) {
    const m = a.frontmatter.model
    if (m && counts[m] !== undefined) counts[m]++
    else counts.unset++
  }
  return counts
})

const hasContent = computed(() =>
  agents.value.length > 0 || commands.value.length > 0 || skills.value.length > 0 || plugins.value.length > 0
)
</script>

<template>
  <div>
    <PageHeader title="Dashboard" />

    <div class="px-6 py-4 space-y-6">

      <!-- System pulse bar -->
      <div
        class="rounded-xl flex items-stretch divide-x overflow-hidden bg-card"
        style="divide-color: var(--border-subtle);"
      >
        <NuxtLink
          v-for="item in [
            { to: '/agents', count: agents.length, label: 'Agents', icon: 'i-lucide-cpu' },
            { to: '/commands', count: commands.length, label: 'Commands', icon: 'i-lucide-terminal' },
            { to: '/skills', count: skills.length, label: 'Skills', icon: 'i-lucide-sparkles' },
            { to: '/plugins', count: plugins.length, label: 'Plugins', icon: 'i-lucide-puzzle' },
          ]"
          :key="item.to"
          :to="item.to"
          class="flex-1 flex items-center gap-3 px-5 py-4 hover-bg focus-ring"
        >
          <UIcon :name="item.icon" class="size-4 shrink-0 text-meta" />
          <span class="font-mono text-[20px] font-bold tabular-nums">{{ item.count }}</span>
          <span class="text-[12px] text-meta">{{ item.label }}</span>
        </NuxtLink>
      </div>

      <!-- Model breakdown (compact bar) -->
      <div
        v-if="agents.length > 0"
        class="rounded-xl px-5 py-3 flex items-center gap-5 bg-card"
      >
        <span class="text-section-label shrink-0">Models</span>
        <div class="flex items-center gap-4 flex-1">
          <div v-for="(count, model) in modelBreakdown" :key="model" class="flex items-center gap-1.5">
            <span
              v-if="model !== 'unset'"
              class="text-[10px] font-medium px-1.5 py-px rounded-full"
              :class="[modelColors[model]?.bg, modelColors[model]?.text]"
            >
              {{ modelLabels[model] }}
            </span>
            <span v-else class="text-[10px] text-meta">{{ modelLabels[model] }}</span>
            <span class="font-mono text-[12px] font-medium tabular-nums">{{ count }}</span>
          </div>
        </div>
        <span class="text-[10px] text-meta">Opus is the most capable, Haiku is the fastest</span>
      </div>

      <!-- Two-column: Agents + Commands -->
      <div v-if="hasContent" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Agents list -->
        <div
          class="rounded-xl overflow-hidden"
          style="border: 1px solid var(--border-subtle);"
        >
          <div class="flex items-center justify-between px-4 py-2.5" style="background: var(--surface-raised); border-bottom: 1px solid var(--border-subtle);">
            <h3 class="text-section-label">Agents</h3>
            <NuxtLink to="/agents" class="text-[12px] focus-ring rounded px-1" style="color: var(--accent);">View all</NuxtLink>
          </div>
          <div class="divide-y" style="divide-color: var(--border-subtle);">
            <NuxtLink
              v-for="agent in agents.slice(0, 6)"
              :key="agent.slug"
              :to="`/agents/${agent.slug}`"
              class="flex items-center gap-2.5 px-4 py-2.5 hover-bg"
            >
              <div
                class="size-2 rounded-full shrink-0"
                :style="{ background: getAgentColor(agent.frontmatter.color) }"
              />
              <span class="text-[12px] font-medium truncate">
                {{ agent.frontmatter.name }}
              </span>
              <span
                v-if="agent.frontmatter.model && modelColors[agent.frontmatter.model]"
                class="ml-auto text-[10px] font-mono font-medium px-1 py-px rounded-full shrink-0"
                :class="[modelColors[agent.frontmatter.model].bg, modelColors[agent.frontmatter.model].text]"
              >
                {{ agent.frontmatter.model }}
              </span>
            </NuxtLink>
          </div>
        </div>

        <!-- Commands list -->
        <div
          class="rounded-xl overflow-hidden"
          style="border: 1px solid var(--border-subtle);"
        >
          <div class="flex items-center justify-between px-4 py-2.5" style="background: var(--surface-raised); border-bottom: 1px solid var(--border-subtle);">
            <h3 class="text-section-label">Commands</h3>
            <NuxtLink to="/commands" class="text-[12px] focus-ring rounded px-1" style="color: var(--accent);">View all</NuxtLink>
          </div>
          <div class="divide-y" style="divide-color: var(--border-subtle);">
            <NuxtLink
              v-for="cmd in commands.slice(0, 6)"
              :key="cmd.slug"
              :to="`/commands/${cmd.slug}`"
              class="flex items-center gap-2.5 px-4 py-2.5 hover-bg"
            >
              <span class="font-mono text-[10px] shrink-0 text-meta">/</span>
              <span class="text-[12px] truncate text-body">
                {{ cmd.frontmatter.name }}
              </span>
              <span class="ml-auto text-[10px] shrink-0 text-meta">
                {{ cmd.directory }}
              </span>
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- Welcome onboarding (first-run) -->
      <WelcomeOnboarding
        v-if="!hasContent"
        @created="(agent) => navigateTo(`/agents/${agent.slug}`)"
      />

      <!-- Suggestions -->
      <div
        v-if="suggestions.length && hasContent"
        class="rounded-xl overflow-hidden"
        style="border: 1px solid var(--border-subtle);"
      >
        <div class="flex items-center justify-between px-4 py-2.5" style="background: var(--surface-raised); border-bottom: 1px solid var(--border-subtle);">
          <h3 class="text-section-label flex items-center gap-2">
            <UIcon name="i-lucide-lightbulb" class="size-3.5" style="color: var(--accent);" />
            Suggestions
          </h3>
          <span class="font-mono text-[10px] text-meta">{{ suggestions.length }}</span>
        </div>
        <div class="divide-y" style="divide-color: var(--border-subtle);">
          <NuxtLink
            v-for="(s, idx) in suggestions.slice(0, 5)"
            :key="idx"
            :to="`/${s.target.type}s/${s.target.slug}`"
            class="flex items-center gap-3 px-4 py-2.5 hover-bg"
          >
            <UIcon
              :name="s.severity === 'warning' ? 'i-lucide-alert-triangle' : 'i-lucide-info'"
              class="size-3.5 shrink-0"
              :style="{ color: s.severity === 'warning' ? 'var(--warning, #eab308)' : 'var(--text-disabled)' }"
            />
            <span class="text-[12px] text-label flex-1">{{ s.message }}</span>
            <UIcon name="i-lucide-chevron-right" class="size-3.5 text-meta" />
          </NuxtLink>
        </div>
      </div>

      <!-- Quick links -->
      <div v-if="hasContent" class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <NuxtLink
          to="/graph"
          class="block rounded-xl p-5 focus-ring hover-card bg-card"
        >
          <div class="flex items-center gap-3">
            <UIcon name="i-lucide-workflow" class="size-5" style="color: var(--accent);" />
            <div class="flex-1">
              <div class="text-[13px] font-medium">Relationship Graph</div>
              <div class="text-[12px] text-label">
                See how your agents, commands, and skills connect to each other
              </div>
            </div>
            <UIcon name="i-lucide-arrow-right" class="size-4 text-meta" />
          </div>
        </NuxtLink>

        <NuxtLink
          to="/workflows"
          class="block rounded-xl p-5 focus-ring hover-card bg-card"
        >
          <div class="flex items-center gap-3">
            <UIcon name="i-lucide-git-branch" class="size-5" style="color: var(--accent);" />
            <div class="flex-1">
              <div class="text-[13px] font-medium">Create a Workflow</div>
              <div class="text-[12px] text-label">
                Chain agents together into multi-step pipelines
              </div>
            </div>
            <UIcon name="i-lucide-arrow-right" class="size-4 text-meta" />
          </div>
        </NuxtLink>
      </div>

      <!-- Advanced: directory picker -->
      <details>
        <summary class="text-[12px] flex items-center gap-1.5 text-meta">
          <UIcon name="i-lucide-settings" class="size-3" />
          Advanced: Configuration folder
        </summary>
        <div
          class="rounded-xl p-4 mt-2 bg-card"
        >
          <p class="text-[12px] mb-3 text-label">
            This is where Claude Code stores your agents, commands, and settings. The default is ~/.claude.
          </p>
          <div class="flex items-center gap-3">
            <UIcon name="i-lucide-folder" class="size-4 shrink-0 text-meta" />
            <form class="flex-1 flex gap-2" @submit.prevent="changeDir">
              <input v-model="dirInput" placeholder="~/.claude" class="field-input flex-1" />
              <UButton type="submit" :loading="settingDir" label="Load" size="sm" variant="soft" />
            </form>
          </div>
        </div>
      </details>

      <!-- Keyboard shortcuts -->
      <div class="flex items-center gap-4 px-2 text-meta">
        <span class="text-[12px] flex items-center gap-1.5">
          <kbd class="text-[10px] font-mono px-1 py-px rounded badge-subtle">&#x2318;K</kbd>
          Search
        </span>
        <span class="text-[12px] flex items-center gap-1.5">
          <kbd class="text-[10px] font-mono px-1 py-px rounded badge-subtle">&#x2318;S</kbd>
          Save
        </span>
      </div>
    </div>
  </div>
</template>
