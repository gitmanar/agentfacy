import { getToken, validateToken } from '../utils/authCredential'

let tokenLogged = false

export default defineEventHandler((event) => {
  const rawUrl = event.node.req.url || '/'
  const path = rawUrl.split('?')[0]
  const method = event.node.req.method || 'GET'

  // Only protect /api/ routes
  if (!path.startsWith('/api/')) {
    return
  }

  // Allow GET /api/config without auth (needed for setup)
  if (path === '/api/config' && method === 'GET') {
    return
  }

  // Localhost bypass
  const remoteAddress = event.node.req.socket.remoteAddress || ''
  const isLocalhost = remoteAddress === '127.0.0.1' ||
    remoteAddress === '::1' ||
    remoteAddress === '::ffff:127.0.0.1' ||
    remoteAddress.endsWith(':127.0.0.1') ||
    remoteAddress === '' // dev server proxied requests may have no remote address
  if (isLocalhost) {
    return
  }

  // Log the token once on first non-localhost request
  if (!tokenLogged) {
    tokenLogged = true
    console.log('[agentfacy] API token for remote access:', getToken())
  }

  // Check Authorization header
  const authHeader = event.node.req.headers.authorization || ''
  const match = authHeader.match(/^Bearer\s+(.+)$/)
  const bearerToken = match ? match[1] : ''

  if (bearerToken && validateToken(bearerToken)) {
    return
  }

  throw createError({
    statusCode: 401,
    message: 'Unauthorized \u2014 provide a valid Bearer token',
  })
})
