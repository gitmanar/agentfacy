import { writeFile } from 'node:fs/promises'
import { resolveClaudePath } from '../utils/claudeDir'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const filePath = resolveClaudePath('settings.json')
  await writeFile(filePath, JSON.stringify(body, null, 2), 'utf-8')
  return body
})
