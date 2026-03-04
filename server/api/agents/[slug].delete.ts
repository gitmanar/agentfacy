import { unlink } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { resolveClaudePath } from '../../utils/claudeDir'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')!
  const filePath = resolveClaudePath('agents', `${slug}.md`)

  if (!existsSync(filePath)) {
    throw createError({ statusCode: 404, message: `Agent not found: ${slug}` })
  }

  await unlink(filePath)
  return { deleted: true, slug }
})
