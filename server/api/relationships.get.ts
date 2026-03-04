import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { existsSync } from 'node:fs'
import { resolveClaudePath } from '../utils/claudeDir'
import { parseFrontmatter } from '../utils/frontmatter'
import { extractRelationships } from '../utils/relationships'

async function loadAgents() {
  const dir = resolveClaudePath('agents')
  if (!existsSync(dir)) return []
  const files = (await readdir(dir)).filter(f => f.endsWith('.md'))
  return Promise.all(files.map(async (f) => {
    const raw = await readFile(join(dir, f), 'utf-8')
    const { frontmatter, body } = parseFrontmatter<Record<string, unknown>>(raw)
    return { slug: f.replace(/\.md$/, ''), body, frontmatter }
  }))
}

async function loadCommands(dir: string, relDir: string): Promise<{ slug: string; body: string; frontmatter: Record<string, unknown> }[]> {
  if (!existsSync(dir)) return []
  const entries = await readdir(dir, { withFileTypes: true })
  const results: { slug: string; body: string; frontmatter: Record<string, unknown> }[] = []

  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...await loadCommands(fullPath, relDir ? `${relDir}/${entry.name}` : entry.name))
    } else if (entry.name.endsWith('.md')) {
      const raw = await readFile(fullPath, 'utf-8')
      const { frontmatter, body } = parseFrontmatter<Record<string, unknown>>(raw)
      const baseName = entry.name.replace(/\.md$/, '')
      const slug = relDir ? `${relDir.replace(/\//g, '--')}--${baseName}` : baseName
      results.push({ slug, body, frontmatter })
    }
  }
  return results
}

export default defineEventHandler(async () => {
  const agents = await loadAgents()
  const commands = await loadCommands(resolveClaudePath('commands'), '')
  return extractRelationships(agents, commands)
})
