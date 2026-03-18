import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, resolve, sep } from 'node:path'

let currentClaudeDir: string | null = null

export function getClaudeDir(): string {
  if (!currentClaudeDir) {
    const envDir = process.env.CLAUDE_DIR
    currentClaudeDir = envDir || join(homedir(), '.claude')
  }
  return currentClaudeDir
}

export function setClaudeDir(dir: string): void {
  const resolved = resolve(dir)
  const home = resolve(homedir())
  if (!resolved.startsWith(home + sep) && resolved !== home) {
    throw createError({ statusCode: 403, message: 'Directory must be under home directory' })
  }
  if (!existsSync(dir)) {
    throw createError({ statusCode: 400, message: `Directory does not exist: ${dir}` })
  }
  currentClaudeDir = resolved
}

export function resolveClaudePath(...segments: string[]): string {
  const base = resolve(getClaudeDir())
  const target = resolve(base, ...segments)
  if (!target.startsWith(base + sep) && target !== base) {
    throw createError({ statusCode: 400, message: 'Path traversal detected' })
  }
  return target
}
