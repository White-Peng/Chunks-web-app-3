import type { Story, Chunk } from '@/types';
import { LLMService } from './llm';
import { getCachedPhotoUrl, getFallbackImage } from './unsplash';

// Parse JSON from LLM response (handles markdown code blocks)
function parseJSON<T>(response: string): T {
  let cleaned = response.trim();
  
  // Remove markdown code blocks if present
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }
  
  return JSON.parse(cleaned);
}

/**
 * Fetch image from Unsplash API with fallback
 */
async function getImageForKeywords(keywords: string): Promise<string> {
  try {
    return await getCachedPhotoUrl(keywords);
  } catch (error) {
    console.warn('Failed to fetch from Unsplash API, using fallback:', error);
    return getFallbackImage(keywords);
  }
}

/**
 * Generate Stories from browsing history URLs using Deepseek LLM
 */
export async function generateStoriesFromHistory(urls: string[]): Promise<Story[]> {
  const llm = new LLMService();
  
  try {
    const response = await llm.generateStories(urls);
    const parsed = parseJSON<Array<{
      id: number;
      title: string;
      description: string;
      imageKeywords?: string;
      image?: string; // Legacy support
      relatedUrls?: string[];
    }>>(response);
    
    // Fetch images from Unsplash API in parallel
    const storiesWithImages = await Promise.all(
      parsed.map(async (item) => {
        const keywords = item.imageKeywords || item.image || item.title;
        const imageUrl = await getImageForKeywords(keywords);
        
        return {
          id: item.id,
          title: item.title,
          description: item.description,
          image: imageUrl,
          imageKeywords: keywords,
          relatedUrls: item.relatedUrls || [],
          createdAt: new Date(),
        };
      })
    );
    
    return storiesWithImages;
  } catch (error) {
    console.error('Error generating stories:', error);
    throw error;
  }
}

/**
 * Generate Chunks from a Story using Deepseek LLM
 */
export async function generateChunksFromStory(story: Story): Promise<Chunk[]> {
  const llm = new LLMService();
  
  try {
    const response = await llm.generateChunks(
      story.title,
      story.description,
      story.relatedUrls || [],
      story.imageKeywords
    );
    
    const parsed = parseJSON<Array<{
      id: number;
      title: string;
      content: string;
      imageKeywords?: string;
      image?: string; // Legacy support
    }>>(response);
    
    // Fetch unique images for each chunk from Unsplash API in parallel
    const chunksWithImages = await Promise.all(
      parsed.map(async (item) => {
        const keywords = item.imageKeywords || item.image || story.imageKeywords || story.title;
        const imageUrl = await getImageForKeywords(keywords);
        
        return {
          id: item.id,
          title: item.title,
          content: item.content,
          image: imageUrl,
          imageKeywords: keywords,
        };
      })
    );
    
    return chunksWithImages;
  } catch (error) {
    console.error('Error generating chunks:', error);
    throw error;
  }
}

/**
 * Generate a chat response using Deepseek LLM
 */
export async function generateChatResponse(
  userMessage: string,
  storyTitle: string,
  storyDescription: string,
  chunks: Chunk[],
  previousMessages: Array<{ text: string; sender: 'user' | 'bot' }>
): Promise<string> {
  const llm = new LLMService();
  
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
      title: 'The Future of AI',
      description: 'Explore the cutting-edge developments in artificial intelligence',
      image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800',
      imageKeywords: 'artificial intelligence robot futuristic',
      relatedUrls: ['https://openai.com', 'https://anthropic.com'],
      createdAt: new Date(),
    },
    {
      id: 2,
      title: 'Web Development Trends',
      description: 'Modern frameworks and tools shaping the future of web',
      image: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800',
      imageKeywords: 'coding programming web development',
      relatedUrls: ['https://react.dev', 'https://vitejs.dev'],
      createdAt: new Date(),
    },
    {
      id: 3,
      title: 'Design Systems',
      description: 'Building consistent and scalable design systems',
      image: 'https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=800',
      imageKeywords: 'design ui ux interface',
      relatedUrls: ['https://tailwindcss.com', 'https://ui.shadcn.com'],
      createdAt: new Date(),
    },
  ];
}

/**
 * Generate mock chunks for demo/development (with unique images)
 */
export function generateMockChunks(story: Story): Chunk[] {
  const chunkKeywords = [
    'abstract concept idea light bulb',
    'vintage history timeline old',
    'professional expert business meeting',
    'everyday practical real world application',
    'technical detail microscope close up',
  ];
  
  return [
    {
      id: 1,
      title: 'Key Insight #1',
      content: `Discover the fundamental concepts behind ${story.title}. This chunk explores the basics and sets the foundation for deeper understanding.`,
      image: getFallbackImage(chunkKeywords[0]),
      imageKeywords: chunkKeywords[0],
    },
    {
      id: 2,
      title: 'Historical Context',
      content: `Learn about the evolution and background of ${story.title}. Understanding the past helps illuminate the present.`,
      image: getFallbackImage(chunkKeywords[1]),
      imageKeywords: chunkKeywords[1],
    },
    {
      id: 3,
      title: 'Expert Perspective',
      content: `Industry leaders share their insights on ${story.title}. Gain valuable knowledge from those at the forefront.`,
      image: getFallbackImage(chunkKeywords[2]),
      imageKeywords: chunkKeywords[2],
    },
    {
      id: 4,
      title: 'Real-World Application',
      content: `See how ${story.title} manifests in everyday life. Practical examples that bring theory to reality.`,
      image: getFallbackImage(chunkKeywords[3]),
      imageKeywords: chunkKeywords[3],
    },
    {
      id: 5,
      title: 'Deep Dive',
      content: `An in-depth exploration of the most fascinating aspects of ${story.title}. For those who want to go further.`,
      image: getFallbackImage(chunkKeywords[4]),
      imageKeywords: chunkKeywords[4],
    },
  ];
}
