import { query } from '@anthropic-ai/claude-agent-sdk'
import { getClaudeDir } from '../utils/claudeDir'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export default defineEventHandler(async (event) => {
  const body = await readBody<{ messages: ChatMessage[]; sessionId?: string }>(event)

  if (!body.messages?.length) {
    throw createError({ statusCode: 400, message: 'messages is required' })
  }

  const lastUserMessage = body.messages.filter(m => m.role === 'user').pop()
  if (!lastUserMessage) {
    throw createError({ statusCode: 400, message: 'No user message found' })
  }

  const claudeDir = getClaudeDir()

  // Set up SSE headers
  setResponseHeaders(event, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  })

  const sendEvent = (type: string, data: unknown) => {
    event.node.res.write(`data: ${JSON.stringify({ type, ...data as object })}\n\n`)
  }

  try {
    let sessionId = body.sessionId || null
    let resultText = ''

    for await (const message of query({
      prompt: lastUserMessage.content,
      options: {
        cwd: claudeDir,
        allowedTools: ['Read', 'Write', 'Edit', 'Glob', 'Grep'],
        permissionMode: 'bypassPermissions',
        allowDangerouslySkipPermissions: true,
        maxTurns: 10,
        includePartialMessages: true,
        systemPrompt: {
          type: 'preset',
          preset: 'claude_code',
          append: `You are an assistant integrated into the Agent Manager UI. The user is managing their Claude Code agents, commands, skills, and plugins through a web interface.

The current working directory is the user's Claude configuration folder: ${claudeDir}

When the user asks you to create, update, or delete agents/commands/skills:
- Agents are markdown files in ${claudeDir}/agents/ with YAML frontmatter (name, model, allowedTools, description)
- Commands are markdown files in ${claudeDir}/commands/ with YAML frontmatter (name, description)
- Skills are in ${claudeDir}/skills/ organized as directories with skill.md files

Always confirm what you did after making changes.`,
        },
        ...(sessionId ? { resume: sessionId } : {}),
      },
    })) {
      // Capture session ID for resumption
      if (message.type === 'system' && message.subtype === 'init') {
        sessionId = message.session_id
        sendEvent('session', { sessionId })
      }

      // Stream incremental text and thinking deltas
      if (message.type === 'stream_event' && message.event) {
        const evt = message.event as {
          type: string
          content_block?: { type: string }
          delta?: { type: string; text?: string; thinking?: string }
        }
        if (evt.type === 'content_block_start' && evt.content_block?.type === 'thinking') {
          sendEvent('thinking_start', {})
        }
        if (evt.type === 'content_block_delta') {
          if (evt.delta?.type === 'text_delta' && evt.delta.text) {
            sendEvent('text_delta', { text: evt.delta.text })
          } else if (evt.delta?.type === 'thinking_delta' && evt.delta.thinking) {
            sendEvent('thinking_delta', { text: evt.delta.thinking })
          }
        }
      }

      // Tool progress — surface what Claude is doing
      if (message.type === 'tool_progress') {
        sendEvent('tool_progress', {
          toolName: message.tool_name,
          elapsed: message.elapsed_time_seconds,
        })
      }

      // Final result
      if ('result' in message) {
        resultText = message.result
        sendEvent('result', { text: resultText, stopReason: message.stop_reason })
      }
    }

    sendEvent('done', { sessionId })
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    sendEvent('error', { message: errorMessage })
  }

  event.node.res.end()
})
