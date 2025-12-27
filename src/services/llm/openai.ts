import type { LLMConfig } from '@/types';

const DEFAULT_MODEL = 'gpt-4o-mini';

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
  error?: {
    message: string;
  };
}

export async function sendToOpenAI(
  messages: OpenAIMessage[],
  config: LLMConfig
): Promise<string> {
  const model = config.model || DEFAULT_MODEL;
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const error = await response.json() as OpenAIResponse;
    throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json() as OpenAIResponse;
  return data.choices[0].message.content;
}

