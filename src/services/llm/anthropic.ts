import type { LLMConfig } from '@/types';

const DEFAULT_MODEL = 'claude-3-5-sonnet-20241022';

interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AnthropicResponse {
  content: {
    text: string;
  }[];
  error?: {
    message: string;
  };
}

export async function sendToAnthropic(
  systemPrompt: string,
  messages: AnthropicMessage[],
  config: LLMConfig
): Promise<string> {
  const model = config.model || DEFAULT_MODEL;
  
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model,
      max_tokens: 2000,
      system: systemPrompt,
      messages,
    }),
  });

  if (!response.ok) {
    const error = await response.json() as AnthropicResponse;
    throw new Error(`Anthropic API error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json() as AnthropicResponse;
  return data.content[0].text;
}

