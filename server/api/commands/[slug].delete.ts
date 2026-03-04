import { unlink } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { resolveClaudePath } from '../../utils/claudeDir'

function slugToPath(slug: string): { directory: string; filename: string } {
  const parts = slug.split('--')
  if (parts.length === 1) {
    return { directory: '', filename: `${parts[0]}.md` }
  }
  const filename = `${parts.pop()}.md`
  const directory = parts.join('/')
  return { directory, filename }
}

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')!
  const { directory, filename } = slugToPath(slug)
  const filePath = directory
    ? resolveClaudePath('commands', directory, filename)
    : resolveClaudePath('commands', filename)

  if (!existsSync(filePath)) {
    throw createError({ statusCode: 404, message: `Command not found: ${slug}` })
  }

  await unlink(filePath)
  return { deleted: true, slug }
})
