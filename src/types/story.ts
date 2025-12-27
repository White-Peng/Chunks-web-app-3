export interface Story {
  id: number;
  title: string;
  description: string;
  image: string;
  relatedUrls?: string[];
  createdAt?: Date;
}

