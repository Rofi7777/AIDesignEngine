import { z } from "zod";

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
    theme: z.string().optional(),
    style: z.string().optional(),
    color: z.string().optional(),
    material: z.string().optional(),
    nationality: z.string().optional(),
    scenario: z.string().optional(),
  }).optional(),
});

export type SlipperDesignRequest = z.infer<typeof slipperDesignRequestSchema>;
export type ModelWearingRequest = z.infer<typeof modelWearingRequestSchema>;
export type GeneratedImage = z.infer<typeof generatedImageSchema>;

export const THEMES = [
  "Spring/Summer",
  "Fall/Winter",
  "Holiday Season",
  "Beach/Resort",
  "Urban Contemporary",
  "Minimalist",
  "Bohemian",
  "Athletic/Sporty",
] as const;

export const STYLES = [
  "Graffiti",
  "Minimal",
  "Sporty",
  "Elegant",
  "Casual",
  "Luxury",
  "Eco-Friendly",
  "Futuristic",
] as const;

export const COLOR_PALETTES = [
  "Pastel",
  "Earth Tones",
  "Neon",
  "Monochrome",
  "Vibrant",
  "Muted",
  "Metallic",
] as const;

export const MATERIALS = [
  "Leather",
  "Canvas",
  "Synthetic",
  "Wool",
  "Recycled Materials",
  "Rubber",
  "Cork",
  "Textile",
] as const;

export const NATIONALITIES = [
  "American",
  "European",
  "Asian",
  "Latin American",
  "African",
  "Middle Eastern",
  "Australian",
  "Nordic",
] as const;

export const FAMILY_COMBINATIONS = [
  "Mother + Child",
  "Father + Child",
  "Parents + Child",
  "Single Adult",
  "Couple",
  "Multi-Generational",
  "Siblings",
] as const;

export const SCENARIOS = [
  "Parent-Child Play",
  "Solo Relaxation",
  "Travel Adventure",
  "Home Comfort",
  "Beach Day",
  "Garden Party",
  "Morning Routine",
  "Evening Walk",
] as const;

export const LOCATIONS = [
  "City Street",
  "Home Interior",
  "Outdoor Park",
  "Beach",
  "Garden",
  "Modern Apartment",
  "Coffee Shop",
  "Vacation Resort",
] as const;

export const PRESENTATION_STYLES = [
  "Realistic Photography",
  "Product Mockup",
  "Custom",
] as const;
