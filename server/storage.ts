import { 
  type GeneratedImage,
  type Design,
  type InsertDesign,
  type ModelScene,
  type InsertModelScene,
  type Project,
  type InsertProject,
  type BrandColor,
  type InsertBrandColor,
  type BomMaterial,
  type InsertBomMaterial,
  designs,
  modelScenes,
  projects,
  brandColors,
  bomMaterials,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Legacy method for backward compatibility
  saveGeneratedImage(image: Omit<GeneratedImage, 'id' | 'timestamp'>): Promise<GeneratedImage>;
  getGeneratedImages(): Promise<GeneratedImage[]>;
  
  // Save both angles as a single design record
  saveCompleteDesign(params: {
    topViewUrl: string | null;
    view45Url: string | null;
    theme: string;
    style: string;
    color: string;
    material: string;
    designDescription?: string | null;
    referenceImageUrl?: string | null;
    brandLogoUrl?: string | null;
    projectId?: number | null;
    templateUrl?: string | null;
  }): Promise<Design>;
  
  // Projects
  createProject(project: InsertProject): Promise<Project>;
  getProjects(): Promise<Project[]>;
  getProject(id: number): Promise<Project | undefined>;
  
  // Designs
  createDesign(design: InsertDesign): Promise<Design>;
  getDesigns(projectId?: number): Promise<Design[]>;
  getDesign(id: number): Promise<Design | undefined>;
  
  // Model Scenes
  createModelScene(scene: InsertModelScene): Promise<ModelScene>;
  getModelScenes(designId?: number): Promise<ModelScene[]>;
  
  // Brand Colors
  createBrandColor(color: InsertBrandColor): Promise<BrandColor>;
  getBrandColors(): Promise<BrandColor[]>;
  
  // BOM Materials
  createBomMaterial(material: InsertBomMaterial): Promise<BomMaterial>;
  getBomMaterials(): Promise<BomMaterial[]>;
}

export class DatabaseStorage implements IStorage {
  // Legacy method - saves to designs or modelScenes table
  async saveGeneratedImage(imageData: Omit<GeneratedImage, 'id' | 'timestamp'>): Promise<GeneratedImage> {
    const metadata = imageData.metadata || {};
    
    if (imageData.type === 'slipper_design') {
      const design = await this.createDesign({
        projectId: null,
        templateUrl: null,
        theme: metadata.theme || 'Unknown',
        style: metadata.style || 'Unknown',
        color: metadata.color || 'Unknown',
        material: metadata.material || 'Unknown',
        topViewUrl: imageData.angle === 'top' ? imageData.imageUrl : null,
        view45Url: imageData.angle === '45degree' ? imageData.imageUrl : null,
      });
      
      return {
        id: design.id.toString(),
        type: imageData.type,
        imageUrl: imageData.imageUrl,
        angle: imageData.angle,
        timestamp: design.createdAt.getTime(),
        metadata: imageData.metadata,
      };
    }
    
    if (imageData.type === 'model_wearing') {
      // For model_wearing, we need to save to modelScenes table
      const scene = await this.createModelScene({
        designId: null,
        slipperImageUrl: metadata.slipperImageUrl || '',
        nationality: metadata.nationality || 'Unknown',
        familyCombination: metadata.familyCombination || 'Single Adult',
        scenario: metadata.scenario || 'Unknown',
        location: metadata.location || 'Modern Apartment',
        presentationStyle: metadata.presentationStyle || 'Realistic Photography',
        sceneUrl: imageData.imageUrl,
      });
      
      return {
        id: scene.id.toString(),
        type: imageData.type,
        imageUrl: imageData.imageUrl,
        timestamp: scene.createdAt.getTime(),
        metadata: imageData.metadata,
      };
    }
    
    // Fallback for unknown types
    return {
      id: Date.now().toString(),
      type: imageData.type,
      imageUrl: imageData.imageUrl,
      timestamp: Date.now(),
      metadata: imageData.metadata,
    };
  }

  async getGeneratedImages(): Promise<GeneratedImage[]> {
    const allDesigns = await db.select().from(designs).orderBy(desc(designs.createdAt));
    const allScenes = await db.select().from(modelScenes).orderBy(desc(modelScenes.createdAt));
    
    const images: GeneratedImage[] = [];
    
    // Add slipper designs
    for (const design of allDesigns) {
      if (design.topViewUrl) {
        images.push({
          id: `${design.id}-top`,
          type: 'slipper_design',
          imageUrl: design.topViewUrl,
          angle: 'top',
          timestamp: design.createdAt.getTime(),
          metadata: {
            theme: design.theme,
            style: design.style,
            color: design.color,
            material: design.material,
          },
        });
      }
      if (design.view45Url) {
        images.push({
          id: `${design.id}-45`,
          type: 'slipper_design',
          imageUrl: design.view45Url,
          angle: '45degree',
          timestamp: design.createdAt.getTime(),
          metadata: {
            theme: design.theme,
            style: design.style,
            color: design.color,
            material: design.material,
          },
        });
      }
    }
    
    // Add model scenes
    for (const scene of allScenes) {
      images.push({
        id: `scene-${scene.id}`,
        type: 'model_wearing',
        imageUrl: scene.sceneUrl,
        timestamp: scene.createdAt.getTime(),
        metadata: {
          nationality: scene.nationality,
          familyCombination: scene.familyCombination,
          scenario: scene.scenario,
          location: scene.location,
          presentationStyle: scene.presentationStyle,
        },
      });
    }
    
    // Sort all images by timestamp (newest first)
    return images.sort((a, b) => b.timestamp - a.timestamp);
  }

  // Save both angles as a single design record
  async saveCompleteDesign(params: {
    topViewUrl: string | null;
    view45Url: string | null;
    theme: string;
    style: string;
    color: string;
    material: string;
    designDescription?: string | null;
    referenceImageUrl?: string | null;
    brandLogoUrl?: string | null;
    projectId?: number | null;
    templateUrl?: string | null;
  }): Promise<Design> {
    // Validate that at least one URL is present
    if (!params.topViewUrl && !params.view45Url) {
      throw new Error('At least one view (top or 45°) must be generated');
    }
    
    const design = await this.createDesign({
      projectId: params.projectId || null,
      templateUrl: params.templateUrl || null,
      theme: params.theme,
      style: params.style,
      color: params.color,
      material: params.material,
      designDescription: params.designDescription || null,
      referenceImageUrl: params.referenceImageUrl || null,
      brandLogoUrl: params.brandLogoUrl || null,
      topViewUrl: params.topViewUrl,
      view45Url: params.view45Url,
    });
    
    return design;
  }

  // Projects
  async createProject(project: InsertProject): Promise<Project> {
    const [newProject] = await db.insert(projects).values(project).returning();
    return newProject;
  }

  async getProjects(): Promise<Project[]> {
    return await db.select().from(projects).orderBy(desc(projects.createdAt));
  }

  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project || undefined;
  }

  // Designs
  async createDesign(design: InsertDesign): Promise<Design> {
    const [newDesign] = await db.insert(designs).values(design).returning();
    return newDesign;
  }

  async getDesigns(projectId?: number): Promise<Design[]> {
    if (projectId) {
      return await db.select().from(designs).where(eq(designs.projectId, projectId)).orderBy(desc(designs.createdAt));
    }
    return await db.select().from(designs).orderBy(desc(designs.createdAt));
  }

  async getDesign(id: number): Promise<Design | undefined> {
    const [design] = await db.select().from(designs).where(eq(designs.id, id));
    return design || undefined;
  }

  // Model Scenes
  async createModelScene(scene: InsertModelScene): Promise<ModelScene> {
    const [newScene] = await db.insert(modelScenes).values(scene).returning();
    return newScene;
  }

  async getModelScenes(designId?: number): Promise<ModelScene[]> {
    if (designId) {
      return await db.select().from(modelScenes).where(eq(modelScenes.designId, designId)).orderBy(desc(modelScenes.createdAt));
    }
    return await db.select().from(modelScenes).orderBy(desc(modelScenes.createdAt));
  }

  // Brand Colors
  async createBrandColor(color: InsertBrandColor): Promise<BrandColor> {
    const [newColor] = await db.insert(brandColors).values(color).returning();
    return newColor;
  }

  async getBrandColors(): Promise<BrandColor[]> {
    return await db.select().from(brandColors).orderBy(brandColors.brandName, brandColors.colorName);
  }

  // BOM Materials
  async createBomMaterial(material: InsertBomMaterial): Promise<BomMaterial> {
    const [newMaterial] = await db.insert(bomMaterials).values(material).returning();
    return newMaterial;
  }

  async getBomMaterials(): Promise<BomMaterial[]> {
    return await db.select().from(bomMaterials).orderBy(bomMaterials.materialName);
  }
}

export const storage = new DatabaseStorage();
