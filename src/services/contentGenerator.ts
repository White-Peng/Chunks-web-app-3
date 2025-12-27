import type { Story, Chunk, LLMConfig } from '@/types';
import { LLMService } from './llm';

// Unsplash image URL helper
function getUnsplashImage(keyword: string, index: number = 0): string {
  // Using Unsplash source for random images based on keyword
  const seed = `${keyword}-${index}`;
  return `https://source.unsplash.com/800x600/?${encodeURIComponent(keyword)}&sig=${seed}`;
}

// Parse JSON from LLM response (handles markdown code blocks)
function parseJSON<T>(response: string): T {
  // Remove markdown code blocks if present
  let cleaned = response.trim();
  
  // Remove ```json ... ``` or ``` ... ```
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }
  
  return JSON.parse(cleaned);
}

/**
 * Generate Stories from browsing history URLs using LLM
 */
export async function generateStoriesFromHistory(
  urls: string[],
  config: LLMConfig
): Promise<Story[]> {
  const llm = new LLMService(config);
  
  try {
    const response = await llm.generateStories(urls);
    const parsed = parseJSON<Array<{
      id: number;
      title: string;
      description: string;
      image: string;
      relatedUrls?: string[];
    }>>(response);
    
    // Convert to Story format with actual image URLs
    return parsed.map((item, index) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      image: getUnsplashImage(item.image, index),
      relatedUrls: item.relatedUrls || [],
      createdAt: new Date(),
    }));
  } catch (error) {
    console.error('Error generating stories:', error);
    throw error;
  }
}

/**
 * Generate Chunks from a Story using LLM
 */
export async function generateChunksFromStory(
  story: Story,
  config: LLMConfig
): Promise<Chunk[]> {
  const llm = new LLMService(config);
  
  try {
    const response = await llm.generateChunks(
      story.title,
      story.description,
      story.relatedUrls || []
    );
    
    const parsed = parseJSON<Array<{
      id: number;
      title: string;
      content: string;
      image?: string;
    }>>(response);
    
    // Use the story's image for all chunks
    return parsed.map(item => ({
      id: item.id,
      title: item.title,
      content: item.content,
      image: story.image,
    }));
  } catch (error) {
    console.error('Error generating chunks:', error);
    throw error;
  }
}

/**
 * Generate a chat response using LLM
 */
export async function generateChatResponse(
  userMessage: string,
  storyTitle: string,
  storyDescription: string,
  chunks: Chunk[],
  previousMessages: Array<{ text: string; sender: 'user' | 'bot' }>,
  config: LLMConfig
): Promise<string> {
  const llm = new LLMService(config);
  
  try {
    const response = await llm.chat(userMessage, {
      storyTitle,
      storyDescription,
      chunks: chunks.map(c => ({ title: c.title, content: c.content })),
      previousMessages: previousMessages.map((m, i) => ({
        id: i,
        text: m.text,
        sender: m.sender,
        timestamp: new Date(),
      })),
    });
    
    return response;
  } catch (error) {
    console.error('Error generating chat response:', error);
    throw error;
  }
}

/**
 * Generate mock stories for demo/development
 */
export function generateMockStories(): Story[] {
  return [
    {
      id: 1,
      title: 'AI Revolution',
      description: 'The latest developments in artificial intelligence and machine learning',
      image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800',
      relatedUrls: ['https://openai.com', 'https://anthropic.com'],
      createdAt: new Date(),
    },
    {
      id: 2,
      title: 'Web Development Trends',
      description: 'Modern frameworks and tools shaping the future of web development',
      image: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800',
      relatedUrls: ['https://react.dev', 'https://vitejs.dev'],
      createdAt: new Date(),
    },
    {
      id: 3,
      title: 'Design Systems',
      description: 'Building consistent and scalable design systems for better UX',
      image: 'https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=800',
      relatedUrls: ['https://tailwindcss.com', 'https://ui.shadcn.com'],
      createdAt: new Date(),
    },
  ];
}

/**
 * Generate mock chunks for demo/development
 */
export function generateMockChunks(story: Story): Chunk[] {
  return [
    {
      id: 1,
      title: 'Key Insight #1',
      content: `Discover the fundamental concepts behind ${story.title}. This chunk explores the basics and sets the foundation for deeper understanding.`,
      image: story.image,
    },
    {
      id: 2,
      title: 'Historical Context',
      content: `Learn about the evolution and background of ${story.title}. Understanding the past helps illuminate the present.`,
      image: story.image,
    },
    {
      id: 3,
      title: 'Expert Perspective',
      content: `Industry leaders share their insights on ${story.title}. Gain valuable knowledge from those at the forefront.`,
      image: story.image,
    },
    {
      id: 4,
      title: 'Real-World Application',
      content: `See how ${story.title} manifests in everyday life. Practical examples that bring theory to reality.`,
      image: story.image,
    },
    {
      id: 5,
      title: 'Deep Dive',
      content: `An in-depth exploration of the most fascinating aspects of ${story.title}. For those who want to go further.`,
      image: story.image,
    },
  ];
}

