import { z } from "zod";
import { pgTable, serial, varchar, text, timestamp, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";

export const slipperDesignRequestSchema = z.object({
  templateImage: z.string(),
  theme: z.string().min(1, "Theme is required"),
  style: z.string().min(1, "Style is required"),
  color: z.string().min(1, "Color is required"),
  material: z.string().min(1, "Material is required"),
  angles: z.array(z.enum(["top", "45degree"])),
});

export const modelWearingRequestSchema = z.object({
  slipperDesignImage: z.string(),
  nationality: z.string().min(1, "Nationality is required"),
  familyCombination: z.string().min(1, "Family combination is required"),
  scenario: z.string().min(1, "Scenario is required"),
  location: z.string().min(1, "Location is required"),
  presentationStyle: z.string().min(1, "Presentation style is required"),
  customStyleText: z.string().optional(),
});

export const generatedImageSchema = z.object({
  id: z.string(),
  type: z.enum(["slipper_design", "model_wearing"]),
  imageUrl: z.string(),
  angle: z.enum(["top", "45degree"]).optional(),
  timestamp: z.number(),
  metadata: z.object({
    // Slipper design metadata
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
    slipperImageUrl: z.string().optional(),
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
  templateUrl: text("template_url"),
  theme: varchar("theme", { length: 100 }).notNull(),
  style: varchar("style", { length: 100 }).notNull(),
  color: varchar("color", { length: 100 }).notNull(),
  material: varchar("material", { length: 100 }).notNull(),
  topViewUrl: text("top_view_url"),
  view45Url: text("view_45_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const modelScenes = pgTable("model_scenes", {
  id: serial("id").primaryKey(),
  designId: integer("design_id").references(() => designs.id),
  slipperImageUrl: text("slipper_image_url").notNull(),
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
