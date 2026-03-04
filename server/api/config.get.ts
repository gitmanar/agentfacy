import { getClaudeDir } from '../utils/claudeDir'

export default defineEventHandler(() => {
  return { claudeDir: getClaudeDir() }
})
