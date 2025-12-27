import type { LLMConfig } from '@/types';

const DEFAULT_MODEL = 'gemini-1.5-flash';

interface GeminiResponse {
  candidates?: {
    content: {
      parts: {
        text: string;
      }[];
    };
  }[];
  error?: {
    message: string;
  };
}

export async function sendToGemini(
  prompt: string,
  config: LLMConfig
): Promise<string> {
  const model = config.model || DEFAULT_MODEL;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.apiKey}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2000,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json() as GeminiResponse;
    throw new Error(`Gemini API error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json() as GeminiResponse;
  
  if (!data.candidates || data.candidates.length === 0) {
    throw new Error('Gemini API returned no response candidates');
  }

  return data.candidates[0].content.parts[0].text;
}

