import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { resolveClaudePath } from '../utils/claudeDir'

export default defineEventHandler(async () => {
  const filePath = resolveClaudePath('settings.json')
  if (!existsSync(filePath)) return {}

  const raw = await readFile(filePath, 'utf-8')
  return JSON.parse(raw)
})
