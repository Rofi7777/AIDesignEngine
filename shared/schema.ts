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

// Insert and Select Schemas
export const insertProjectSchema = createInsertSchema(projects).omit({ id: true, createdAt: true });
export const insertDesignSchema = createInsertSchema(designs).omit({ id: true, createdAt: true });
export const insertModelSceneSchema = createInsertSchema(modelScenes).omit({ id: true, createdAt: true });
export const insertBrandColorSchema = createInsertSchema(brandColors).omit({ id: true, createdAt: true });
export const insertBomMaterialSchema = createInsertSchema(bomMaterials).omit({ id: true, createdAt: true });

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
