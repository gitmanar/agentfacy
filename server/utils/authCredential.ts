import crypto from 'node:crypto'

let credential: string | null = null

/**
 * Returns the API token, generating one on first call if
 * AGENTFACY_API_TOKEN is not set in the environment.
 */
export function getToken(): string {
  if (credential === null) {
    const envValue = process.env.AGENTFACY_API_TOKEN
    credential = envValue || crypto.randomBytes(32).toString('hex')
  }
  return credential
}

/**
 * Validates a candidate token against the stored token using
 * timing-safe comparison to prevent timing attacks.
 */
export function validateToken(candidate: string): boolean {
  const actual = getToken()
  try {
    const maxLen = Math.max(candidate.length, actual.length)
    const a = Buffer.alloc(maxLen, 0)
    const b = Buffer.alloc(maxLen, 0)
    a.write(candidate, 'utf-8')
    b.write(actual, 'utf-8')
    return crypto.timingSafeEqual(a, b) && candidate.length === actual.length
  } catch {
    return false
  }
}
