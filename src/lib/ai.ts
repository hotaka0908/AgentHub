import OpenAI from 'openai'

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured')
  }
  return new OpenAI({ apiKey })
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export async function* streamOpenAIResponse(
  messages: ChatMessage[],
  systemPrompt: string
): AsyncGenerator<string> {
  const openai = getOpenAIClient()
  const stream = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ],
    stream: true,
  })

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content
    if (content) {
      yield content
    }
  }
}

export function countTokens(text: string): number {
  // Approximate token count (1 token ≈ 4 characters for English, less for Japanese)
  return Math.ceil(text.length / 3)
}
