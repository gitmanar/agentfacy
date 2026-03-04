<script setup lang="ts">
import { VueFlow } from '@vue-flow/core'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import '@vue-flow/controls/dist/style.css'
import '@vue-flow/minimap/dist/style.css'
import type { Relationship } from '~/types'
import { getAgentColor } from '~/utils/colors'

const { agents } = useAgents()
const { commands } = useCommands()
const router = useRouter()

const relationships = ref<Relationship[]>([])
const loading = ref(true)
const showLegend = ref(true)

onMounted(async () => {
  try {
    relationships.value = await $fetch<Relationship[]>('/api/relationships')
  } finally {
    loading.value = false
  }
})

const AGENT_X = 550
const CMD_X = 50
const Y_GAP = 72

const nodes = computed(() => {
  const agentNodes = agents.value.map((a, i) => ({
    id: `agent-${a.slug}`,
    type: 'agent',
    position: { x: AGENT_X, y: i * Y_GAP + 40 },
    data: {
      label: a.frontmatter.name,
      description: a.frontmatter.description,
      color: getAgentColor(a.frontmatter.color),
      model: a.frontmatter.model,
      slug: a.slug,
    },
  }))

  const cmdNodes = commands.value.map((c, i) => ({
    id: `command-${c.slug}`,
    type: 'command',
    position: { x: CMD_X, y: i * Y_GAP + 40 },
    data: {
      label: c.frontmatter.name,
      slug: c.slug,
      directory: c.directory,
    },
  }))

  return [...agentNodes, ...cmdNodes]
})

const edges = computed(() => {
  return relationships.value.map((r, i) => ({
    id: `edge-${i}`,
    source: `${r.sourceType}-${r.sourceSlug}`,
    target: `${r.targetType}-${r.targetSlug}`,
    type: 'smoothstep',
    animated: r.type === 'spawns',
    style: {
      stroke: r.type === 'spawns' ? 'var(--accent)' : r.type === 'agent-frontmatter' ? 'var(--success)' : 'var(--text-disabled)',
      strokeWidth: r.type === 'spawns' ? 2 : 1,
      opacity: r.type === 'spawns' ? 0.7 : 0.4,
    },
  }))
})

function onNodeClick(_: any, node: any) {
  if (node.type === 'agent') router.push(`/agents/${node.data.slug}`)
  else router.push(`/commands/${node.data.slug}`)
}
</script>

<template>
  <div class="relative h-screen flex flex-col">
    <!-- Floating header -->
    <div
      class="absolute top-0 left-0 right-0 z-10 h-14 flex items-center gap-3 px-6"
      style="background: rgba(9, 9, 11, 0.75); backdrop-filter: blur(12px); border-bottom: 1px solid var(--border-subtle);"
    >
      <h1 class="text-page-title flex-1">Graph</h1>
      <span class="font-mono text-[11px]" style="color: var(--text-disabled);">
        {{ nodes.length }} nodes
      </span>
      <span class="font-mono text-[11px]" style="color: var(--text-disabled);">
        {{ edges.length }} edges
      </span>
      <button
        class="font-mono text-[11px] px-2 py-1 rounded focus-ring"
        style="color: var(--text-tertiary); background: var(--surface-raised); border: 1px solid var(--border-default);"
        @click="showLegend = !showLegend"
      >
        {{ showLegend ? 'Hide' : 'Show' }} Legend
      </button>
    </div>

    <div v-if="loading" class="flex-1 flex items-center justify-center" style="background: var(--surface-base);">
      <UIcon name="i-lucide-loader-2" class="size-6 animate-spin" style="color: var(--text-disabled);" />
    </div>

    <div v-else class="flex-1 graph-canvas">
      <VueFlow
        :nodes="nodes"
        :edges="edges"
        fit-view-on-init
        :default-edge-options="{ type: 'smoothstep' }"
        :min-zoom="0.3"
        :max-zoom="2"
        @node-click="onNodeClick"
      >
        <!-- Agent node -->
        <template #node-agent="{ data }">
          <div
            class="graph-node graph-node--agent"
            :style="{
              '--node-glow': `${data.color}25`,
              borderColor: `${data.color}30`,
            }"
          >
            <div class="flex items-center gap-2 mb-0.5">
              <div class="size-2 rounded-full shrink-0" :style="{ background: data.color }" />
              <span class="font-mono text-[12px] font-medium truncate" style="color: var(--text-primary);">
                {{ data.label }}
              </span>
              <span
                v-if="data.model"
                class="ml-auto text-[10px] font-mono font-medium px-1.5 py-px rounded-full shrink-0"
                :style="{
                  background: data.model === 'opus' ? 'rgba(192,132,252,0.15)' : data.model === 'sonnet' ? 'rgba(96,165,250,0.15)' : 'rgba(251,191,36,0.15)',
                  color: data.model === 'opus' ? 'var(--model-opus)' : data.model === 'sonnet' ? 'var(--model-sonnet)' : 'var(--model-haiku)',
                }"
              >
                {{ data.model }}
              </span>
            </div>
            <div v-if="data.description" class="text-[10px] line-clamp-1 mt-0.5" style="color: var(--text-tertiary);">
              {{ data.description }}
            </div>
          </div>
        </template>

        <!-- Command node -->
        <template #node-command="{ data }">
          <div class="graph-node graph-node--command">
            <div class="flex items-center gap-1.5">
              <span class="font-mono text-[10px] font-medium shrink-0" style="color: var(--text-disabled);">
                &gt;_
              </span>
              <span class="font-mono text-[11px] truncate" style="color: var(--text-secondary);">
                /{{ data.label }}
              </span>
            </div>
          </div>
        </template>

        <Controls position="bottom-right" />
        <MiniMap position="top-right" :style="{ marginTop: '64px' }" />
      </VueFlow>

      <!-- Legend -->
      <Transition name="page">
        <div
          v-if="showLegend"
          class="absolute bottom-4 left-4 z-10 rounded-lg p-3 text-[11px] space-y-2"
          style="background: rgba(19, 19, 22, 0.9); backdrop-filter: blur(12px); border: 1px solid var(--border-default);"
        >
          <div class="font-mono font-semibold mb-2" style="color: var(--text-secondary);">Legend</div>
          <div class="flex items-center gap-2">
            <div class="size-3 rounded graph-node" style="border-color: rgba(192,132,252,0.3);" />
            <span style="color: var(--text-tertiary);">Agent</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="size-3 rounded" style="background: var(--surface-overlay); border: 1px solid var(--border-default);" />
            <span style="color: var(--text-tertiary);">Command</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-5 h-[2px] rounded-full" style="background: var(--accent);" />
            <span style="color: var(--text-tertiary);">Spawns</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-5 h-[1px] rounded-full" style="background: var(--success); opacity: 0.5;" />
            <span style="color: var(--text-tertiary);">Uses</span>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>
