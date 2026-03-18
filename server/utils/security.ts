import { resolve, sep } from 'node:path'

/**
 * Validate a slug for agents, skills, and workflows.
 * Allows alphanumeric, hyphens, and underscores only.
 */
export function validateSlug(slug: string | undefined): string {
  if (!slug || typeof slug !== 'string') {
    throw createError({ statusCode: 400, message: 'Slug is required' })
  }
  if (slug.length > 128) {
    throw createError({ statusCode: 400, message: 'Slug exceeds maximum length' })
  }
  if (!/^[\w][\w.-]*$/.test(slug)) {
    throw createError({ statusCode: 400, message: `Invalid slug: ${slug}` })
  }
  return slug
}

/**
 * Validate a command slug which uses `--` as directory separator.
 * Each segment must be alphanumeric with hyphens/underscores.
 */
export function validateCommandSlug(slug: string | undefined): string {
  if (!slug || typeof slug !== 'string') {
    throw createError({ statusCode: 400, message: 'Slug is required' })
  }
  const parts = slug.split('--')
  if (parts.length > 5) {
    throw createError({ statusCode: 400, message: 'Command slug has too many segments' })
  }
  for (const part of parts) {
    if (!part || part.length > 64) {
      throw createError({ statusCode: 400, message: `Invalid command slug segment: ${part}` })
    }
    if (part === '.' || part === '..') {
      throw createError({ statusCode: 400, message: 'Path traversal detected in slug' })
    }
    if (!/^[\w][\w.-]*$/.test(part)) {
      throw createError({ statusCode: 400, message: `Invalid command slug segment: ${part}` })
    }
  }
  return slug
}

/**
 * Validate a plugin ID (format: name@source or scoped like @org/name).
 */
export function validatePluginId(id: string | undefined): string {
  if (!id || typeof id !== 'string') {
    throw createError({ statusCode: 400, message: 'Plugin ID is required' })
  }
  if (id.length > 256) {
    throw createError({ statusCode: 400, message: 'Plugin ID exceeds maximum length' })
  }
  if (id.includes('..')) {
    throw createError({ statusCode: 400, message: 'Path traversal detected in plugin ID' })
  }
  if (!/^[\w@./-]+$/.test(id)) {
    throw createError({ statusCode: 400, message: `Invalid plugin ID: ${id}` })
  }
  return id
}

/**
 * Check if a path is contained within a parent directory.
 */
export function isContainedIn(child: string, parent: string): boolean {
  const resolvedChild = resolve(child)
  const resolvedParent = resolve(parent)
  return resolvedChild.startsWith(resolvedParent + sep) || resolvedChild === resolvedParent
}

/**
 * Validate a project directory against the claude dir and an allowlist.
 * Returns the validated resolved path, or falls back to claudeDir.
 */
export function validateProjectDir(
  dir: string | undefined,
  claudeDir: string,
  allowedDirs: string[],
): string {
  if (!dir || typeof dir !== 'string') {
    return claudeDir
  }
  const resolved = resolve(dir)
  if (isContainedIn(resolved, claudeDir)) {
    return resolved
  }
  for (const allowed of allowedDirs) {
    if (isContainedIn(resolved, allowed)) {
      return resolved
    }
  }
  return claudeDir
}
