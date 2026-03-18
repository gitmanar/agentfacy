export default defineNuxtConfig({
  modules: ['@nuxt/ui'],

  devtools: { enabled: true },

  future: { compatibilityVersion: 4 },

  css: ['~/assets/css/main.css'],

  compatibilityDate: '2025-01-15',

  runtimeConfig: {
    claudeDir: process.env.CLAUDE_DIR || '',
  },

  app: {
    head: {
      title: 'Claude Code Agent Manager',
      htmlAttrs: { lang: 'en' },
      meta: [
        { name: 'description', content: 'Visual manager for Claude Code agents, commands, skills, and plugins. Configure AI assistants without touching the terminal.' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'theme-color', content: '#F7F8FA' },
        { property: 'og:title', content: 'Agent Manager — Claude Code' },
        { property: 'og:description', content: 'Visual manager for Claude Code agents, commands, skills, and plugins. Configure AI assistants without touching the terminal.' },
        { property: 'og:type', content: 'website' },
        { name: 'twitter:card', content: 'summary' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
{ rel: 'stylesheet', href: 'https://api.fontshare.com/v2/css?f[]=clash-display@400;500;600;700&display=swap' },
        { rel: 'stylesheet', href: 'https://cdn.jsdelivr.net/npm/geist@1.3.1/dist/fonts/geist-sans/style.min.css' },
        { rel: 'stylesheet', href: 'https://cdn.jsdelivr.net/npm/geist@1.3.1/dist/fonts/geist-mono/style.min.css' },
      ],
    },
    pageTransition: { name: 'page', mode: 'out-in' },
  },

  colorMode: {
    preference: 'light',
  },

  routeRules: {
    '/api/**': {
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
      },
    },
    '/**': {
      headers: {
        'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://api.fontshare.com https://cdn.jsdelivr.net; font-src 'self' https://api.fontshare.com https://cdn.jsdelivr.net https://fonts.gstatic.com data:; connect-src 'self'; img-src 'self' data:; frame-ancestors 'none'",
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
      },
    },
  },
})
