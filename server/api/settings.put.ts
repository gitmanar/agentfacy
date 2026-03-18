import { readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { resolveClaudePath, getClaudeDir } from '../utils/claudeDir'

const FORBIDDEN_KEYS = ['hooks', 'permissions', 'mcpServers']

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body || typeof body !== 'object') {
    throw createError({ statusCode: 400, message: 'Request body must be a JSON object' })
  }

  // Cap request body at 64KB
  if (JSON.stringify(body).length > 65536) {
    throw createError({ statusCode: 413, message: 'Request body exceeds 64KB limit' })
  }

  const claudeDir = getClaudeDir()
  if (!existsSync(claudeDir)) {
    throw createError({ statusCode: 400, message: `Claude directory does not exist: ${claudeDir}` })
  }

  const filePath = resolveClaudePath('settings.json')

  // Read existing settings
  let existing: Record<string, unknown> = {}
  try {
    if (existsSync(filePath)) {
      const raw = await readFile(filePath, 'utf-8')
      existing = JSON.parse(raw)
    }
  } catch {
    // If file is corrupt, start fresh
    existing = {}
  }

  // Strip forbidden keys from incoming body before merge
  // (preserves existing hooks/permissions set by Claude Code CLI)
  for (const key of FORBIDDEN_KEYS) {
    delete body[key]
  }
  const merged = { ...existing, ...body }

  // Validate allowedProjectDirs is string[] if present
  if ('allowedProjectDirs' in merged) {
    if (!Array.isArray(merged.allowedProjectDirs) || !merged.allowedProjectDirs.every((d: unknown) => typeof d === 'string')) {
      throw createError({ statusCode: 400, message: 'allowedProjectDirs must be an array of strings' })
    }
  }

  // Validate enabledPlugins is Record<string, boolean> if present
  if ('enabledPlugins' in merged) {
    const ep = merged.enabledPlugins
    if (!ep || typeof ep !== 'object' || Array.isArray(ep)) {
      throw createError({ statusCode: 400, message: 'enabledPlugins must be an object' })
    }
    for (const val of Object.values(ep as Record<string, unknown>)) {
      if (typeof val !== 'boolean') {
        throw createError({ statusCode: 400, message: 'enabledPlugins values must be booleans' })
      }
    }
  }

  try {
    await writeFile(filePath, JSON.stringify(merged, null, 2), 'utf-8')
  } catch {
    throw createError({ statusCode: 500, message: 'Failed to write settings.json' })
  }
  return merged
})
