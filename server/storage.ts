import { type GeneratedImage } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  saveGeneratedImage(image: Omit<GeneratedImage, 'id' | 'timestamp'>): Promise<GeneratedImage>;
  getGeneratedImages(): Promise<GeneratedImage[]>;
}

export class MemStorage implements IStorage {
  private images: Map<string, GeneratedImage>;

  constructor() {
    this.images = new Map();
  }

  async saveGeneratedImage(imageData: Omit<GeneratedImage, 'id' | 'timestamp'>): Promise<GeneratedImage> {
    const id = randomUUID();
    const image: GeneratedImage = {
      ...imageData,
      id,
      timestamp: Date.now(),
    };
    this.images.set(id, image);
    return image;
  }

  async getGeneratedImages(): Promise<GeneratedImage[]> {
    return Array.from(this.images.values()).sort((a, b) => b.timestamp - a.timestamp);
  }
}

export const storage = new MemStorage();
