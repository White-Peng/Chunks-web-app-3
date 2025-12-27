export interface Story {
  id: number;
  title: string;
  description: string;
  image: string;
  imageKeywords?: string; // Keywords for Unsplash image search
  relatedUrls?: string[];
  createdAt?: Date;
}

