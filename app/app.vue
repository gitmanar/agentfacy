<script setup lang="ts">
const route = useRoute()
const { claudeDir, load: loadConfig } = useClaudeDir()
const { fetchAll: fetchAgents, agents } = useAgents()
const { fetchAll: fetchCommands, commands } = useCommands()
const { fetchAll: fetchPlugins, plugins } = usePlugins()
const { fetchAll: fetchSkills, skills } = useSkills()

const initialized = ref(false)
const showSearch = ref(false)
const sidebarOpen = ref(false)
const colorMode = useColorMode()

function toggleTheme() {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}

watch(() => route.path, () => { sidebarOpen.value = false })

onMounted(async () => {
  await loadConfig()
  await Promise.all([fetchAgents(), fetchCommands(), fetchPlugins(), fetchSkills()])
  initialized.value = true
})

const navLinks = [
  { label: 'Dashboard', icon: 'i-lucide-layout-dashboard', to: '/' },
  { label: 'Agents', icon: 'i-lucide-cpu', to: '/agents' },
  { label: 'Commands', icon: 'i-lucide-terminal', to: '/commands' },
  { label: 'Skills', icon: 'i-lucide-sparkles', to: '/skills' },
  { label: 'Plugins', icon: 'i-lucide-puzzle', to: '/plugins' },
]

const navSecondary = [
  { label: 'Templates', icon: 'i-lucide-layout-template', to: '/templates' },
  { label: 'Graph', icon: 'i-lucide-workflow', to: '/graph' },
  { label: 'Settings', icon: 'i-lucide-settings', to: '/settings' },
]

function isActive(to: string) {
  if (to === '/') return route.path === '/'
  return route.path.startsWith(to)
}

function badgeFor(to: string) {
  if (to === '/agents') return agents.value.length || null
  if (to === '/commands') return commands.value.length || null
  if (to === '/skills') return skills.value.length || null
  if (to === '/plugins') return plugins.value.length || null
  return null
}
</script>

<template>
  <UApp>
    <div class="flex h-screen overflow-hidden" style="background: var(--surface-base);">
      <!-- Mobile hamburger (md:hidden) -->
      <button
        class="fixed top-4 left-4 z-30 md:hidden p-2 rounded-lg cursor-pointer"
        style="background: var(--badge-subtle-bg); border: 1px solid var(--border-subtle); color: var(--text-secondary);"
        @click="sidebarOpen = true"
      >
        <UIcon name="i-lucide-menu" class="size-5" />
      </button>

      <!-- Backdrop (mobile only) -->
      <div
        v-if="sidebarOpen"
        class="fixed inset-0 z-30 md:hidden"
        style="background: rgba(0, 0, 0, 0.5);"
        @click="sidebarOpen = false"
      />

      <!-- Sidebar -->
      <aside
        class="w-[220px] shrink-0 flex flex-col relative h-full overflow-hidden fixed inset-y-0 left-0 z-40 -translate-x-full md:relative md:z-auto md:translate-x-0 transition-transform duration-200"
        :class="{ 'translate-x-0': sidebarOpen }"
        style="background: var(--sidebar-bg); border-right: 1px solid var(--border-subtle);"
      >
        <!-- Ambient glow at top -->
        <div
          class="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-24 pointer-events-none"
          style="background: radial-gradient(ellipse, rgba(229, 169, 62, 0.06) 0%, transparent 70%);"
        />

        <!-- Brand -->
        <div class="h-[60px] flex items-center gap-3 px-5 relative">
          <div
            class="size-8 rounded-lg flex items-center justify-center relative"
            style="background: linear-gradient(135deg, rgba(229, 169, 62, 0.15) 0%, rgba(229, 169, 62, 0.05) 100%); border: 1px solid rgba(229, 169, 62, 0.12);"
          >
            <UIcon name="i-lucide-bot" class="size-4" style="color: var(--accent);" />
          </div>
          <div class="flex flex-col">
            <span class="text-[12px] font-semibold tracking-tight" style="color: var(--text-primary); font-family: var(--font-sans);">
              Agent Manager
            </span>
            <span class="text-[9px] font-mono tracking-wider uppercase" style="color: var(--text-disabled);">
              Claude Code
            </span>
          </div>
        </div>

        <!-- Primary Nav -->
        <nav class="flex-1 px-3 pt-1 space-y-0.5 overflow-y-auto">
          <NuxtLink
            v-for="link in navLinks"
            :key="link.to"
            :to="link.to"
            class="group flex items-center gap-2.5 px-3 py-[8px] rounded-lg text-[13px] transition-all duration-150 relative focus-ring"
            :style="{
              color: isActive(link.to) ? 'var(--text-primary)' : 'var(--text-tertiary)',
              background: isActive(link.to) ? 'var(--accent-muted)' : 'transparent',
              fontWeight: isActive(link.to) ? '500' : '400',
            }"
          >
            <!-- Active indicator -->
            <div
              v-if="isActive(link.to)"
              class="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 rounded-r-full"
              style="background: var(--accent); box-shadow: 0 0 8px var(--accent-glow);"
            />
            <UIcon :name="link.icon" class="size-[15px] shrink-0" :style="{ color: isActive(link.to) ? 'var(--accent)' : undefined }" />
            <span class="flex-1" style="font-family: var(--font-sans);">{{ link.label }}</span>
            <span
              v-if="badgeFor(link.to)"
              class="font-mono text-[10px] tabular-nums"
              style="color: var(--text-disabled);"
            >
              {{ badgeFor(link.to) }}
            </span>
          </NuxtLink>

          <!-- Separator -->
          <div class="my-3 mx-2" style="border-top: 1px solid var(--border-subtle);" />

          <NuxtLink
            v-for="link in navSecondary"
            :key="link.to"
            :to="link.to"
            class="group flex items-center gap-2.5 px-3 py-[8px] rounded-lg text-[13px] transition-all duration-150 relative focus-ring"
            :style="{
              color: isActive(link.to) ? 'var(--text-primary)' : 'var(--text-tertiary)',
              background: isActive(link.to) ? 'var(--accent-muted)' : 'transparent',
              fontWeight: isActive(link.to) ? '500' : '400',
            }"
          >
            <div
              v-if="isActive(link.to)"
              class="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 rounded-r-full"
              style="background: var(--accent); box-shadow: 0 0 8px var(--accent-glow);"
            />
            <UIcon :name="link.icon" class="size-[15px] shrink-0" :style="{ color: isActive(link.to) ? 'var(--accent)' : undefined }" />
            <span style="font-family: var(--font-sans);">{{ link.label }}</span>
          </NuxtLink>
        </nav>

        <!-- Search shortcut -->
        <div class="px-3 pb-3">
          <button
            class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-150 focus-ring cursor-pointer"
            style="color: var(--text-disabled); background: var(--input-bg); border: 1px solid var(--border-subtle);"
            @mouseenter="($event.currentTarget as HTMLElement).style.borderColor = 'var(--border-default)'; ($event.currentTarget as HTMLElement).style.color = 'var(--text-tertiary)'"
            @mouseleave="($event.currentTarget as HTMLElement).style.borderColor = 'var(--border-subtle)'; ($event.currentTarget as HTMLElement).style.color = 'var(--text-disabled)'"
            @click="showSearch = true"
          >
            <UIcon name="i-lucide-search" class="size-3.5" />
            <span class="text-[12px] flex-1 text-left" style="font-family: var(--font-sans);">Search</span>
            <kbd class="text-[9px] font-mono px-1.5 py-0.5 rounded" style="background: var(--badge-subtle-bg); color: var(--text-disabled);">⌘K</kbd>
          </button>
        </div>

        <!-- Theme toggle -->
        <div class="px-3 pb-1">
          <button
            class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-150 focus-ring"
            style="color: var(--text-tertiary);"
            @click="toggleTheme"
          >
            <UIcon :name="colorMode.value === 'dark' ? 'i-lucide-sun' : 'i-lucide-moon'" class="size-4" />
            <span class="text-[12px]" style="font-family: var(--font-sans);">
              {{ colorMode.value === 'dark' ? 'Light mode' : 'Dark mode' }}
            </span>
          </button>
        </div>

        <!-- Footer: directory -->
        <div class="px-4 py-3" style="border-top: 1px solid var(--border-subtle);">
          <div class="font-mono text-[9px] truncate tracking-wide" style="color: var(--text-disabled);">
            {{ claudeDir || 'No directory set' }}
          </div>
        </div>
      </aside>

      <!-- Main content -->
      <main class="flex-1 min-w-0 h-full overflow-y-auto" style="background: var(--surface-base);">
        <Transition name="page" mode="out-in">
          <NuxtPage v-if="initialized" />
        </Transition>
        <div v-if="!initialized" class="flex items-center justify-center h-full">
          <UIcon name="i-lucide-loader-2" class="size-5 animate-spin" style="color: var(--text-disabled);" />
        </div>
      </main>
    </div>
    <GlobalSearch />
  </UApp>
</template>
