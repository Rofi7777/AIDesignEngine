import { z } from "zod";
import { pgTable, serial, varchar, text, timestamp, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";

// Product Types
export const PRODUCT_TYPES = [
  "shoes",
  "slippers",
  "clothes",
  "bags",
  "custom",
] as const;

// Angle types for different products - supporting 4 angles per product
export const PRODUCT_ANGLES = {
  shoes: ["top", "45degree", "side", "bottom"] as const,
  slippers: ["top", "45degree", "side", "bottom"] as const,
  clothes: ["front", "back", "side", "detail"] as const,
  bags: ["front", "side", "top", "detail"] as const,
  custom: ["view1", "view2", "view3", "view4"] as const,
} as const;

// Base schema without validation - can be used with .omit() and .extend()
export const slipperDesignRequestBaseSchema = z.object({
  productType: z.enum(PRODUCT_TYPES),
  customProductType: z.string().optional(),
  templateImage: z.string(),
  theme: z.string().min(1, "Theme is required"),
  style: z.string().min(1, "Style is required"),
  color: z.string().min(1, "Color is required"),
  material: z.string().min(1, "Material is required"),
  angles: z.array(z.string()),
  referenceImage: z.string().optional(),
  designDescription: z.string().optional(),
  brandLogo: z.string().optional(),
});

// Schema with validation for API endpoints
export const slipperDesignRequestSchema = slipperDesignRequestBaseSchema.refine(
  (data) => data.productType !== "custom" || data.customProductType,
  {
    message: "Custom product type name is required when product type is 'custom'",
    path: ["customProductType"],
  }
);

export const modelWearingRequestSchema = z.object({
  productDesignImage: z.string(),
  productType: z.enum(PRODUCT_TYPES).optional(),
  nationality: z.string().min(1, "Nationality is required"),
  familyCombination: z.string().min(1, "Family combination is required"),
  scenario: z.string().min(1, "Scenario is required"),
  location: z.string().min(1, "Location is required"),
  presentationStyle: z.string().min(1, "Presentation style is required"),
  customStyleText: z.string().optional(),
});

export const generatedImageSchema = z.object({
  id: z.string(),
  type: z.enum(["product_design", "model_wearing"]),
  imageUrl: z.string(),
  angle: z.string().optional(),
  productType: z.enum(PRODUCT_TYPES).optional(),
  timestamp: z.number(),
  metadata: z.object({
    // Product design metadata
    productType: z.string().optional(),
    theme: z.string().optional(),
    style: z.string().optional(),
    color: z.string().optional(),
    material: z.string().optional(),
    // Model scene metadata
    nationality: z.string().optional(),
    familyCombination: z.string().optional(),
    scenario: z.string().optional(),
    location: z.string().optional(),
    presentationStyle: z.string().optional(),
    productImageUrl: z.string().optional(),
  }).optional(),
});

export type SlipperDesignRequest = z.infer<typeof slipperDesignRequestSchema>;
export type ModelWearingRequest = z.infer<typeof modelWearingRequestSchema>;
export type GeneratedImage = z.infer<typeof generatedImageSchema>;

export const THEMES = [
  "SpringSummer",
  "FallWinter",
  "HolidaySeason",
  "BeachResort",
  "UrbanContemporary",
  "Minimalist",
  "Bohemian",
  "AthleticSporty",
] as const;

export const STYLES = [
  "Graffiti",
  "Minimal",
  "Sporty",
  "Elegant",
  "Casual",
  "Luxury",
  "EcoFriendly",
  "Futuristic",
] as const;

export const COLOR_PALETTES = [
  "Pastel",
  "EarthTones",
  "Neon",
  "Monochrome",
  "Vibrant",
  "Muted",
  "Metallic",
  "Custom",
] as const;

export const MATERIALS = [
  "Leather",
  "Canvas",
  "Synthetic",
  "Wool",
  "RecycledMaterials",
  "Rubber",
  "Cork",
  "Textile",
  "Custom",
] as const;

export const NATIONALITIES = [
  "American",
  "European",
  "Asian",
  "LatinAmerican",
  "African",
  "MiddleEastern",
  "Australian",
  "Nordic",
] as const;

export const FAMILY_COMBINATIONS = [
  "MotherChild",
  "FatherChild",
  "ParentsChild",
  "SingleAdult",
  "Couple",
  "MultiGenerational",
  "Siblings",
] as const;

export const SCENARIOS = [
  "ParentChildPlay",
  "SoloRelaxation",
  "TravelAdventure",
  "HomeComfort",
  "BeachDay",
  "GardenParty",
  "MorningRoutine",
  "EveningWalk",
] as const;

export const LOCATIONS = [
  "CityStreet",
  "HomeInterior",
  "OutdoorPark",
  "Beach",
  "Garden",
  "ModernApartment",
  "CoffeeShop",
  "VacationResort",
] as const;

export const PRESENTATION_STYLES = [
  "RealisticPhotography",
  "ProductMockup",
  "Custom",
] as const;

// Model Try-On Product Types
export const MODEL_TRYON_PRODUCT_TYPES = [
  "Hat",
  "Top / Shirt / Jacket",
  "Bottom / Pants / Skirt",
  "Shoes / Slippers",
  "Accessories",
  "Custom",
] as const;

// Model Try-On Options
export const MODEL_NATIONALITIES = [
  "East Asian",
  "Southeast Asian",
  "Western / European",
  "Middle Eastern / Latin",
  "Custom",
] as const;

export const MODEL_HAIRSTYLES = [
  "Short straight hair",
  "Medium wavy hair",
  "Long straight hair",
  "Curly / Afro-textured hair",
  "Custom",
] as const;

export const MODEL_COMBINATIONS = [
  "Single male model",
  "Single female model",
  "One male + one female",
  "Two male models",
  "Two female models",
  "Custom",
] as const;

export const MODEL_SCENES = [
  "Studio background (clean, plain)",
  "City street / urban environment",
  "Home interior (living room / bedroom)",
  "Park / nature / outdoor",
  "Retail store / shopping mall",
  "Custom",
] as const;

export const MODEL_POSES = [
  "Standing front-facing, relaxed",
  "Walking mid-step (dynamic pose)",
  "Sitting, relaxed pose",
  "Close-up pose focusing on product",
  "Fashion pose (editorial style)",
  "Custom",
] as const;

export const MODEL_ASPECT_RATIOS = [
  "1:1",
  "9:16",
  "16:9",
  "4:3",
  "3:4",
] as const;

export const MODEL_CAMERA_ANGLES = [
  "Front view",
  "Side view",
  "Back view",
  "Custom",
] as const;

// Database Tables
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  season: varchar("season", { length: 100 }).notNull(), // e.g., "SS26", "FW26"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const designs = pgTable("designs", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id),
  productType: varchar("product_type", { length: 50 }).notNull().default('slippers'),
  customProductType: varchar("custom_product_type", { length: 100 }),
  templateUrl: text("template_url"),
  theme: varchar("theme", { length: 100 }).notNull(),
  style: varchar("style", { length: 100 }).notNull(),
  color: varchar("color", { length: 100 }).notNull(),
  material: varchar("material", { length: 100 }).notNull(),
  referenceImageUrl: text("reference_image_url"),
  designDescription: text("design_description"),
  brandLogoUrl: text("brand_logo_url"),
  view1Url: text("view_1_url"),
  view2Url: text("view_2_url"),
  view3Url: text("view_3_url"),
  view4Url: text("view_4_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const modelScenes = pgTable("model_scenes", {
  id: serial("id").primaryKey(),
  designId: integer("design_id").references(() => designs.id),
  productImageUrl: text("product_image_url").notNull(),
  productType: varchar("product_type", { length: 50 }),
  nationality: varchar("nationality", { length: 100 }).notNull(),
  familyCombination: varchar("family_combination", { length: 100 }).notNull(),
  scenario: varchar("scenario", { length: 100 }).notNull(),
  location: varchar("location", { length: 100 }).notNull(),
  presentationStyle: varchar("presentation_style", { length: 100 }).notNull(),
  sceneUrl: text("scene_url").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const brandColors = pgTable("brand_colors", {
  id: serial("id").primaryKey(),
  brandName: varchar("brand_name", { length: 255 }).notNull(),
  colorName: varchar("color_name", { length: 255 }).notNull(),
  hexCode: varchar("hex_code", { length: 7 }).notNull(),
  pantoneCode: varchar("pantone_code", { length: 50 }),
  category: varchar("category", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const bomMaterials = pgTable("bom_materials", {
  id: serial("id").primaryKey(),
  materialName: varchar("material_name", { length: 255 }).notNull(),
  supplier: varchar("supplier", { length: 255 }),
  costPerUnit: varchar("cost_per_unit", { length: 50 }),
  leadTime: varchar("lead_time", { length: 100 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Model Try-On table - stores model try-on sessions
export const modelTryOns = pgTable("model_try_ons", {
  id: serial("id").primaryKey(),
  nationality: varchar("nationality", { length: 100 }).notNull(),
  nationalityCustom: varchar("nationality_custom", { length: 255 }),
  hairstyle: varchar("hairstyle", { length: 100 }).notNull(),
  hairstyleCustom: varchar("hairstyle_custom", { length: 255 }),
  combination: varchar("combination", { length: 100 }).notNull(),
  combinationCustom: varchar("combination_custom", { length: 255 }),
  scene: varchar("scene", { length: 100 }).notNull(),
  sceneCustom: varchar("scene_custom", { length: 255 }),
  pose: varchar("pose", { length: 100 }).notNull(),
  poseCustom: varchar("pose_custom", { length: 255 }),
  aspectRatio: varchar("aspect_ratio", { length: 20 }).notNull(),
  customWidth: integer("custom_width"), // Custom width in pixels for 'custom' aspect ratio
  customHeight: integer("custom_height"), // Custom height in pixels for 'custom' aspect ratio
  cameraAngles: text("camera_angles").notNull(), // JSON array of angles
  cameraAngleCustom: varchar("camera_angle_custom", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Model Try-On Products table - stores product images for each try-on session
export const modelTryOnProducts = pgTable("model_try_on_products", {
  id: serial("id").primaryKey(),
  tryOnId: integer("try_on_id").references(() => modelTryOns.id).notNull(),
  productImageUrl: text("product_image_url").notNull(),
  productType: varchar("product_type", { length: 100 }).notNull(),
  productTypeCustom: varchar("product_type_custom", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Model Try-On Results table - stores generated images
export const modelTryOnResults = pgTable("model_try_on_results", {
  id: serial("id").primaryKey(),
  tryOnId: integer("try_on_id").references(() => modelTryOns.id).notNull(),
  productId: integer("product_id").references(() => modelTryOnProducts.id).notNull(),
  cameraAngle: varchar("camera_angle", { length: 100 }).notNull(),
  imageUrl: text("image_url").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const projectsRelations = relations(projects, ({ many }) => ({
  designs: many(designs),
}));

export const designsRelations = relations(designs, ({ one, many }) => ({
  project: one(projects, {
    fields: [designs.projectId],
    references: [projects.id],
  }),
  modelScenes: many(modelScenes),
}));

export const modelScenesRelations = relations(modelScenes, ({ one }) => ({
  design: one(designs, {
    fields: [modelScenes.designId],
    references: [designs.id],
  }),
}));

export const modelTryOnsRelations = relations(modelTryOns, ({ many }) => ({
  products: many(modelTryOnProducts),
  results: many(modelTryOnResults),
}));

export const modelTryOnProductsRelations = relations(modelTryOnProducts, ({ one, many }) => ({
  tryOn: one(modelTryOns, {
    fields: [modelTryOnProducts.tryOnId],
    references: [modelTryOns.id],
  }),
  results: many(modelTryOnResults),
}));

export const modelTryOnResultsRelations = relations(modelTryOnResults, ({ one }) => ({
  tryOn: one(modelTryOns, {
    fields: [modelTryOnResults.tryOnId],
    references: [modelTryOns.id],
  }),
  product: one(modelTryOnProducts, {
    fields: [modelTryOnResults.productId],
    references: [modelTryOnProducts.id],
  }),
}));

// Insert and Select Schemas
export const insertProjectSchema = createInsertSchema(projects).omit({ id: true, createdAt: true });
export const insertDesignSchema = createInsertSchema(designs).omit({ id: true, createdAt: true });
export const insertModelSceneSchema = createInsertSchema(modelScenes).omit({ id: true, createdAt: true });
export const insertBrandColorSchema = createInsertSchema(brandColors).omit({ id: true, createdAt: true });
export const insertBomMaterialSchema = createInsertSchema(bomMaterials).omit({ id: true, createdAt: true });
export const insertModelTryOnSchema = createInsertSchema(modelTryOns).omit({ id: true, createdAt: true });
export const insertModelTryOnProductSchema = createInsertSchema(modelTryOnProducts).omit({ id: true, createdAt: true });
export const insertModelTryOnResultSchema = createInsertSchema(modelTryOnResults).omit({ id: true, createdAt: true });

// Types
export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Design = typeof designs.$inferSelect;
export type InsertDesign = z.infer<typeof insertDesignSchema>;
export type ModelScene = typeof modelScenes.$inferSelect;
export type InsertModelScene = z.infer<typeof insertModelSceneSchema>;
export type BrandColor = typeof brandColors.$inferSelect;
export type InsertBrandColor = z.infer<typeof insertBrandColorSchema>;
export type BomMaterial = typeof bomMaterials.$inferSelect;
export type InsertBomMaterial = z.infer<typeof insertBomMaterialSchema>;
export type ModelTryOn = typeof modelTryOns.$inferSelect;
export type InsertModelTryOn = z.infer<typeof insertModelTryOnSchema>;
export type ModelTryOnProduct = typeof modelTryOnProducts.$inferSelect;
export type InsertModelTryOnProduct = z.infer<typeof insertModelTryOnProductSchema>;
export type ModelTryOnResult = typeof modelTryOnResults.$inferSelect;
export type InsertModelTryOnResult = z.infer<typeof insertModelTryOnResultSchema>;

// Virtual Try-On Tables
export const virtualTryOns = pgTable("virtual_try_ons", {
  id: serial("id").primaryKey(),
  modelImageUrl: text("model_image_url").notNull(),
  tryonMode: varchar("tryon_mode", { length: 50 }).notNull(), // 'single' or 'multi'
  tryonType: varchar("tryon_type", { length: 100 }), // for single mode: 'accessory', 'top', 'bottom', 'full'
  preservePose: varchar("preserve_pose", { length: 10 }).default('yes'),
  style: varchar("style", { length: 100 }).default('natural'), // 'natural' or 'fashion'
  aspectRatio: varchar("aspect_ratio", { length: 20 }).notNull().default('9:16'),
  customWidth: integer("custom_width"), // Custom width in pixels for 'custom' aspect ratio
  customHeight: integer("custom_height"), // Custom height in pixels for 'custom' aspect ratio
  resultImageUrl: text("result_image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const virtualTryOnProducts = pgTable("virtual_try_on_products", {
  id: serial("id").primaryKey(),
  tryOnId: integer("try_on_id").references(() => virtualTryOns.id).notNull(),
  productImageUrl: text("product_image_url").notNull(),
  productType: varchar("product_type", { length: 100 }).notNull(), // 'accessory', 'top', 'bottom', etc.
  productName: varchar("product_name", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// E-commerce Scene Tables
export const ecommerceScenes = pgTable("ecommerce_scenes", {
  id: serial("id").primaryKey(),
  modelImageUrl: text("model_image_url"), // Optional - for product-only display scenes without model
  sceneType: varchar("scene_type", { length: 100 }).notNull(), // 'home', 'office', 'outdoor', 'cafe', etc.
  lighting: varchar("lighting", { length: 100 }).notNull(), // 'natural', 'warm', 'bright', 'soft'
  composition: varchar("composition", { length: 100 }).notNull(), // 'center', 'rule-of-thirds', 'diagonal'
  aspectRatio: varchar("aspect_ratio", { length: 20 }).notNull(),
  customWidth: integer("custom_width"), // Custom width in pixels for 'custom' aspect ratio
  customHeight: integer("custom_height"), // Custom height in pixels for 'custom' aspect ratio
  resultImageUrl: text("result_image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const ecommerceSceneAssets = pgTable("ecommerce_scene_assets", {
  id: serial("id").primaryKey(),
  sceneId: integer("scene_id").references(() => ecommerceScenes.id).notNull(),
  assetType: varchar("asset_type", { length: 50 }).notNull(), // 'product' or 'prop'
  assetImageUrl: text("asset_image_url").notNull(),
  assetName: varchar("asset_name", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations for Virtual Try-On
export const virtualTryOnsRelations = relations(virtualTryOns, ({ many }) => ({
  products: many(virtualTryOnProducts),
}));

export const virtualTryOnProductsRelations = relations(virtualTryOnProducts, ({ one }) => ({
  tryOn: one(virtualTryOns, {
    fields: [virtualTryOnProducts.tryOnId],
    references: [virtualTryOns.id],
  }),
}));

// Relations for E-commerce Scene
export const ecommerceScenesRelations = relations(ecommerceScenes, ({ many }) => ({
  assets: many(ecommerceSceneAssets),
}));

export const ecommerceSceneAssetsRelations = relations(ecommerceSceneAssets, ({ one }) => ({
  scene: one(ecommerceScenes, {
    fields: [ecommerceSceneAssets.sceneId],
    references: [ecommerceScenes.id],
  }),
}));

// Insert and Select Schemas for new tables
export const insertVirtualTryOnSchema = createInsertSchema(virtualTryOns).omit({ id: true, createdAt: true });
export const insertVirtualTryOnProductSchema = createInsertSchema(virtualTryOnProducts).omit({ id: true, createdAt: true });
export const insertEcommerceSceneSchema = createInsertSchema(ecommerceScenes).omit({ id: true, createdAt: true });
export const insertEcommerceSceneAssetSchema = createInsertSchema(ecommerceSceneAssets).omit({ id: true, createdAt: true });

// Types for new tables
export type VirtualTryOn = typeof virtualTryOns.$inferSelect;
export type InsertVirtualTryOn = z.infer<typeof insertVirtualTryOnSchema>;
export type VirtualTryOnProduct = typeof virtualTryOnProducts.$inferSelect;
export type InsertVirtualTryOnProduct = z.infer<typeof insertVirtualTryOnProductSchema>;
export type EcommerceScene = typeof ecommerceScenes.$inferSelect;
export type InsertEcommerceScene = z.infer<typeof insertEcommerceSceneSchema>;
export type EcommerceSceneAsset = typeof ecommerceSceneAssets.$inferSelect;
export type InsertEcommerceSceneAsset = z.infer<typeof insertEcommerceSceneAssetSchema>;

// Model Try-On Request Schema (for API validation)
export const modelTryOnRequestSchema = z.object({
  products: z.array(z.object({
    productImageId: z.string(),
    productType: z.string(),
    productTypeCustom: z.string().optional(),
  })).min(1, "At least one product is required"),
  modelOptions: z.object({
    nationality: z.string().min(1, "Nationality is required"),
    nationalityCustom: z.string().optional(),
    hairstyle: z.string().min(1, "Hairstyle is required"),
    hairstyleCustom: z.string().optional(),
    combination: z.string().min(1, "Model combination is required"),
    combinationCustom: z.string().optional(),
    scene: z.string().min(1, "Scene is required"),
    sceneCustom: z.string().optional(),
    pose: z.string().min(1, "Pose is required"),
    poseCustom: z.string().optional(),
    aspectRatio: z.string().min(1, "Aspect ratio is required"),
    cameraAngles: z.array(z.string()).min(1, "At least one camera angle is required"),
    cameraAngleCustom: z.string().optional(),
  }),
});

export type ModelTryOnRequest = z.infer<typeof modelTryOnRequestSchema>;

// E-commerce Poster Design Tables
export const posterRequests = pgTable("poster_requests", {
  id: serial("id").primaryKey(),
  // Module A: Campaign & Scene
  campaignType: varchar("campaign_type", { length: 100 }).notNull(), // 'discount', 'new-product', 'bestseller', 'festival', 'brand-story', 'bundle', 'custom'
  customCampaign: text("custom_campaign"),
  referenceImageUrl: text("reference_image_url"),
  referenceLevel: varchar("reference_level", { length: 100 }), // 'layout-only', 'layout-color', 'loose-inspiration', 'custom'
  customReferenceLevel: text("custom_reference_level"),
  // Module B: Visual Style & Layout
  visualStyle: varchar("visual_style", { length: 100 }).notNull(), // 'fresh-drink', 'cute-3d', 'premium-minimal', 'taobao-promo', 'natural-lifestyle', 'custom'
  customVisualStyle: text("custom_visual_style"),
  backgroundScene: varchar("background_scene", { length: 100 }).notNull(), // 'gradient', 'studio-tabletop', 'outdoor-nature', 'urban', 'indoor-lifestyle', 'custom'
  customBackgroundScene: text("custom_background_scene"),
  layout: varchar("layout", { length: 100 }).notNull(), // 'single-centered', 'product-number', 'left-right-split', 'top-bottom-split', 'grid-collage', 'custom'
  customLayout: text("custom_layout"),
  aspectRatio: varchar("aspect_ratio", { length: 20 }).notNull(), // '1:1', '9:16', '16:9', '4:3', '3:4', '1080x1080', '1080x1920', '1920x1080', '800x600', 'custom'
  customWidth: integer("custom_width"), // Custom width in pixels (e.g., 1024)
  customHeight: integer("custom_height"), // Custom height in pixels (e.g., 768)
  // Module C: Copy & Elements
  headlineStyle: varchar("headline_style", { length: 100 }).notNull(), // 'emotional', 'benefit-focused', 'price-focused', 'brand-story', 'custom', 'auto-generate'
  customHeadline: text("custom_headline"),
  autoGenerateHeadline: varchar("auto_generate_headline", { length: 10 }).default('no'), // 'yes' or 'no'
  sellingPoints: text("selling_points").array(), // JSON array of selling points
  autoGenerateSellingPoints: varchar("auto_generate_selling_points", { length: 10 }).default('no'),
  priceStyle: varchar("price_style", { length: 100 }), // 'big-price', 'original-discounted', 'coupon', 'no-price', 'custom'
  originalPrice: varchar("original_price", { length: 50 }),
  currentPrice: varchar("current_price", { length: 50 }),
  discountText: varchar("discount_text", { length: 255 }),
  customPriceStyle: text("custom_price_style"),
  logoImageUrl: text("logo_image_url"),
  logoPosition: varchar("logo_position", { length: 50 }), // 'top-left', 'top-right', 'bottom-left', 'bottom-right', 'center', 'custom'
  brandTagline: varchar("brand_tagline", { length: 255 }),
  // Generated result
  resultImageUrl: text("result_image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const posterProductImages = pgTable("poster_product_images", {
  id: serial("id").primaryKey(),
  posterId: integer("poster_id").references(() => posterRequests.id).notNull(),
  productImageUrl: text("product_image_url").notNull(),
  productName: varchar("product_name", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations for Poster Design
export const posterRequestsRelations = relations(posterRequests, ({ many }) => ({
  productImages: many(posterProductImages),
}));

export const posterProductImagesRelations = relations(posterProductImages, ({ one }) => ({
  posterRequest: one(posterRequests, {
    fields: [posterProductImages.posterId],
    references: [posterRequests.id],
  }),
}));

// Insert and Select Schemas for Poster Design
export const insertPosterRequestSchema = createInsertSchema(posterRequests).omit({ id: true, createdAt: true });
export const insertPosterProductImageSchema = createInsertSchema(posterProductImages).omit({ id: true, createdAt: true });

// Types for Poster Design
export type PosterRequest = typeof posterRequests.$inferSelect;
export type InsertPosterRequest = z.infer<typeof insertPosterRequestSchema>;
export type PosterProductImage = typeof posterProductImages.$inferSelect;
export type InsertPosterProductImage = z.infer<typeof insertPosterProductImageSchema>;
