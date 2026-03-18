import { unlink } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { resolveClaudePath } from '../../utils/claudeDir'
import { validateSlug } from '../../utils/security'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  validateSlug(slug)
  const filePath = resolveClaudePath('workflows', `${slug}.json`)

  if (!existsSync(filePath)) {
    throw createError({ statusCode: 404, message: 'Workflow not found' })
  }

  await unlink(filePath)
  return { deleted: true }
})
