import type { LLMConfig, ChatContext } from '@/types';
import { sendToOpenAI } from './openai';
import { sendToAnthropic } from './anthropic';
import { sendToGemini } from './gemini';

export class LLMService {
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;
  }

  /**
   * Generate Stories from browsing history URLs
   */
  async generateStories(urls: string[]): Promise<string> {
    const prompt = `You are a content curator. Based on the following browsing history URLs, group them into 3-5 thematic stories that represent the user's interests.

For each story, provide:
- id: A unique number (1, 2, 3, etc.)
- title: A catchy, engaging title (max 50 characters)
- description: Brief description of the theme (max 100 characters)
- image: A relevant Unsplash search term for finding an image (e.g., "technology", "nature", "cooking")
- relatedUrls: Array of URLs from the input that belong to this theme

URLs to analyze:
${urls.map((url, i) => `${i + 1}. ${url}`).join('\n')}

IMPORTANT: Respond ONLY with valid JSON array, no markdown formatting, no code blocks. Example:
[{"id":1,"title":"Tech Innovations","description":"Latest in technology","image":"technology","relatedUrls":["url1","url2"]}]`;

    return this.sendMessage(prompt);
  }

  /**
   * Generate Chunks from a Story
   */
  async generateChunks(storyTitle: string, storyDescription: string, relatedUrls: string[]): Promise<string> {
    const prompt = `You are an educational content creator. Create 5 engaging "chunks" (bite-sized knowledge cards) for the following topic:

Topic: ${storyTitle}
Description: ${storyDescription}
Related URLs for context: ${relatedUrls.join(', ')}

Each chunk should be educational and provide unique insights. Create exactly 5 chunks with:
- id: Number from 1 to 5
- title: Short, catchy title (max 30 characters)
- content: Educational content that teaches something valuable (100-150 characters)
- image: Keep the same image keyword as the story

The chunks should follow this progression:
1. Core Concept - Introduce the fundamental idea
2. Historical Context - Background and evolution
3. Expert Insight - What experts say about this
4. Real-World Application - Practical examples
5. Deep Dive - Advanced or fascinating aspect

IMPORTANT: Respond ONLY with valid JSON array, no markdown formatting, no code blocks. Example:
[{"id":1,"title":"Key Insight","content":"The fundamental concept...","image":"technology"}]`;

    return this.sendMessage(prompt);
  }

  /**
   * Chat with the user about the content they learned
   */
  async chat(userMessage: string, context: ChatContext): Promise<string> {
    const systemPrompt = `You are a helpful learning assistant. The user has just finished reading about "${context.storyTitle}".

Story description: ${context.storyDescription}

The user learned these key points:
${context.chunks.map((c, i) => `${i + 1}. ${c.title}: ${c.content}`).join('\n')}

Your role is to:
1. Help the user reflect on what they learned
2. Answer questions about the topic
3. Provide additional insights when relevant
4. Encourage deeper thinking

Keep responses concise and engaging (max 150 words). Be conversational and supportive.`;

    const conversationHistory = context.previousMessages
      .map(m => `${m.sender === 'user' ? 'User' : 'Assistant'}: ${m.text}`)
      .join('\n');

    const fullPrompt = conversationHistory 
      ? `${systemPrompt}\n\nPrevious conversation:\n${conversationHistory}\n\nUser: ${userMessage}\n\nAssistant:`
      : `${systemPrompt}\n\nUser: ${userMessage}\n\nAssistant:`;

    return this.sendMessage(fullPrompt, systemPrompt);
  }

  /**
   * Send a message to the configured LLM provider
   */
  private async sendMessage(prompt: string, systemPrompt?: string): Promise<string> {
    const { provider } = this.config;

    switch (provider) {
      case 'openai':
        return sendToOpenAI(
          systemPrompt 
            ? [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt },
              ]
            : [{ role: 'user', content: prompt }],
          this.config
        );

      case 'anthropic':
        return sendToAnthropic(
          systemPrompt || 'You are a helpful assistant.',
          [{ role: 'user', content: prompt }],
          this.config
        );

      case 'gemini':
        return sendToGemini(
          systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt,
          this.config
        );

      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }
}

export { sendToOpenAI } from './openai';
export { sendToAnthropic } from './anthropic';
export { sendToGemini } from './gemini';

