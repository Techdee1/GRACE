import { z } from 'zod'

export class PingTool {
  name = 'ping_tool'

  description = 'Health-check tool that echoes a short payload.'

  inputSchema = z.object({
    text: z.string().default('ok'),
  })

  async execute(input: z.input<typeof this.inputSchema>) {
    const parsed = this.inputSchema.parse(input)
    return {
      ok: true,
      pong: parsed.text,
      timestamp: new Date().toISOString(),
    }
  }
}
