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
  type ModelTryOn,
  type InsertModelTryOn,
  type ModelTryOnProduct,
  type InsertModelTryOnProduct,
  type ModelTryOnResult,
  type InsertModelTryOnResult,
  designs,
  modelScenes,
  projects,
  brandColors,
  bomMaterials,
  modelTryOns,
  modelTryOnProducts,
  modelTryOnResults,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Legacy method for backward compatibility
  saveGeneratedImage(image: Omit<GeneratedImage, 'id' | 'timestamp'>): Promise<GeneratedImage>;
  getGeneratedImages(): Promise<GeneratedImage[]>;
  
  // Save all 4 angles as a single design record
  saveCompleteDesign(params: {
    view1Url: string | null;
    view2Url: string | null;
    view3Url?: string | null;
    view4Url?: string | null;
    productType?: string;
    customProductType?: string;
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
  
  // Model Try-On
  createModelTryOn(tryOn: InsertModelTryOn): Promise<number>;
  createModelTryOnProduct(product: InsertModelTryOnProduct): Promise<number>;
  createModelTryOnResult(result: InsertModelTryOnResult): Promise<ModelTryOnResult>;
  getModelTryOns(): Promise<ModelTryOn[]>;
  getModelTryOnResults(tryOnId: number): Promise<ModelTryOnResult[]>;
}

export class DatabaseStorage implements IStorage {
  // Legacy method - saves to designs or modelScenes table
  async saveGeneratedImage(imageData: Omit<GeneratedImage, 'id' | 'timestamp'>): Promise<GeneratedImage> {
    const metadata = imageData.metadata || {};
    
    if (imageData.type === 'product_design') {
      const design = await this.createDesign({
        projectId: null,
        productType: metadata.productType || 'slippers',
        customProductType: null,
        templateUrl: null,
        theme: metadata.theme || 'Unknown',
        style: metadata.style || 'Unknown',
        color: metadata.color || 'Unknown',
        material: metadata.material || 'Unknown',
        view1Url: imageData.angle === 'top' || imageData.angle === 'front' || imageData.angle === 'view1' ? imageData.imageUrl : null,
        view2Url: imageData.angle === '45degree' || imageData.angle === 'back' || imageData.angle === 'side' || imageData.angle === 'view2' ? imageData.imageUrl : null,
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
        productImageUrl: metadata.productImageUrl || '',
        productType: metadata.productType || null,
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
    
    // Add product designs (all 4 angles)
    for (const design of allDesigns) {
      if (design.view1Url) {
        images.push({
          id: `${design.id}-view1`,
          type: 'product_design',
          imageUrl: design.view1Url,
          angle: 'view1',
          productType: design.productType as any,
          timestamp: design.createdAt.getTime(),
          metadata: {
            productType: design.productType,
            theme: design.theme,
            style: design.style,
            color: design.color,
            material: design.material,
          },
        });
      }
      if (design.view2Url) {
        images.push({
          id: `${design.id}-view2`,
          type: 'product_design',
          imageUrl: design.view2Url,
          angle: 'view2',
          productType: design.productType as any,
          timestamp: design.createdAt.getTime(),
          metadata: {
            productType: design.productType,
            theme: design.theme,
            style: design.style,
            color: design.color,
            material: design.material,
          },
        });
      }
      if (design.view3Url) {
        images.push({
          id: `${design.id}-view3`,
          type: 'product_design',
          imageUrl: design.view3Url,
          angle: 'view3',
          productType: design.productType as any,
          timestamp: design.createdAt.getTime(),
          metadata: {
            productType: design.productType,
            theme: design.theme,
            style: design.style,
            color: design.color,
            material: design.material,
          },
        });
      }
      if (design.view4Url) {
        images.push({
          id: `${design.id}-view4`,
          type: 'product_design',
          imageUrl: design.view4Url,
          angle: 'view4',
          productType: design.productType as any,
          timestamp: design.createdAt.getTime(),
          metadata: {
            productType: design.productType,
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

  // Save all 4 angles as a single design record
  async saveCompleteDesign(params: {
    view1Url: string | null;
    view2Url: string | null;
    view3Url?: string | null;
    view4Url?: string | null;
    productType?: string;
    customProductType?: string;
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
    if (!params.view1Url && !params.view2Url && !params.view3Url && !params.view4Url) {
      throw new Error('At least one view must be generated');
    }
    
    const design = await this.createDesign({
      projectId: params.projectId || null,
      productType: params.productType || 'slippers',
      customProductType: params.customProductType || null,
      templateUrl: params.templateUrl || null,
      theme: params.theme,
      style: params.style,
      color: params.color,
      material: params.material,
      designDescription: params.designDescription || null,
      referenceImageUrl: params.referenceImageUrl || null,
      brandLogoUrl: params.brandLogoUrl || null,
      view1Url: params.view1Url,
      view2Url: params.view2Url,
      view3Url: params.view3Url || null,
      view4Url: params.view4Url || null,
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

  // Model Try-On methods
  async createModelTryOn(tryOn: InsertModelTryOn): Promise<number> {
    const [newTryOn] = await db.insert(modelTryOns).values(tryOn).returning();
    return newTryOn.id;
  }

  async createModelTryOnProduct(product: InsertModelTryOnProduct): Promise<number> {
    const [newProduct] = await db.insert(modelTryOnProducts).values(product).returning();
    return newProduct.id;
  }

  async createModelTryOnResult(result: InsertModelTryOnResult): Promise<ModelTryOnResult> {
    const [newResult] = await db.insert(modelTryOnResults).values(result).returning();
    return newResult;
  }

  async getModelTryOns(): Promise<ModelTryOn[]> {
    return await db.select().from(modelTryOns).orderBy(desc(modelTryOns.createdAt));
  }

  async getModelTryOnResults(tryOnId: number): Promise<ModelTryOnResult[]> {
    return await db.select().from(modelTryOnResults).where(eq(modelTryOnResults.tryOnId, tryOnId));
  }
}

export const storage = new DatabaseStorage();
