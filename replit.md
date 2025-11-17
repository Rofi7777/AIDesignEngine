# Craft AI Studio

## Overview
**Craft AI Studio** is an AI-powered design application for generating seasonal fashion product concepts across multiple categories (shoes, slippers, clothes, bags, and custom products). Users can upload product templates, configure design parameters, and generate AI-created product designs with multiple viewing angles along with model-wearing scenes. All generated images support high-resolution PNG downloads. The project leverages Google Gemini 2.5 Flash Image Preview.

**Tagline:** "Craft Design Ideas with AI"

## User Preferences
- Follow design_guidelines.md religiously for visual quality
- Use Material Design principles with Inter font
- Implement comprehensive validation with user-friendly error messages
- Provide loading states during AI generation
- Enable download functionality for all generated images

## System Architecture

### UI/UX Decisions
The application features a single-page layout with a two-column structure (40% configuration / 60% gallery). The UI implements a "La Letter-inspired aesthetic" using a soft purple/lavender color palette, light backgrounds, rounded components (rounded-2xl cards, rounded-xl buttons), generous padding (p-8), softer shadows (shadow-sm), and refined typography (font-light, tracking-wide). A language selector is present in the header for multi-language support.

### Technical Implementations
- **Frontend:** React, TypeScript, shadcn UI, React Hook Form, TanStack Query, Tailwind CSS, Wouter for routing.
- **Backend:** Node.js, Express, Multer (for file uploads).
- **Database:** PostgreSQL with Drizzle ORM for data persistence.
- **Professional Two-Stage AI Architecture:**
  - **Stage 1 (Prompt Optimizer):** LLM acts as professional designer with 10+ years product design experience, transforms structured inputs into optimized prompts using gemini-2.5-flash text model
  - **Stage 2 (Image Generation):** Uses expertly-crafted prompts with gemini-2.5-flash-image for superior design quality
  - Intelligent fallback system ensures stability if Stage 1 encounters issues
  - Comprehensive debug logging for monitoring and troubleshooting
- **AI Integration:** Google Gemini 2.5 Flash Image Preview via Replit AI Integrations.
- **Validation:** Zod with drizzle-zod for robust form validation.
- **Internationalization (i18n):** A React Context-based translation system with localStorage persistence supporting English, Traditional Chinese, and Vietnamese.
- **Multi-Product Type System:** Supports 5 product categories with dynamic viewing angle configuration:
  - **Shoes/Slippers:** top view + 45° view
  - **Clothes:** front view + back view
  - **Bags:** front view + side view
  - **Custom:** user-defined view1 + view2
- **Two-Step Design Generation:** Ensures consistency between viewing angles. The first angle is generated as a canonical reference, and the second angle uses this reference to maintain identical patterns, colors, and backgrounds, only changing the camera angle.
- **Shape Preservation System:** AI prompts strictly enforce preservation of the exact product silhouette, dimensions, proportions, and 3D structure from the template. Only surface design elements (colors, patterns, materials, textures, logos) are modified, treating generation as a "skin wrap."
- **Enhanced Design Input:** Supports optional reference image uploads, detailed design descriptions (text input), and brand logo uploads to guide AI generation.
- **Multi-Image Gemini API Integration:** The Gemini API calls accept multiple images (template + reference + logo) in a single request.
- **Click-to-Enlarge Image Zoom:** All generated images include a click-to-zoom feature, displaying images in a dialog modal for detailed inspection.
- **Custom Options:** Users can specify custom colors, materials, presentation styles, and custom product types with associated validation.
- **Database Schema:** `SlipperDesign` (product_type, custom_product_type, template, theme, style, color, material, view1Url, view2Url, custom options) and `ModelScene` (product image reference, product_type, nationality, family, scenario, location, presentation style, generated scene image). Schemas are defined in `shared/schema.ts`.
- **Two-Angle Storage Design:** Each product design is stored with two view URLs (view1Url, view2Url) which align perfectly with all current product configurations (shoes/slippers: top+45°, clothes: front+back, bags: front+side, custom: view1+view2). Future expansion to >2 angles would require schema migration with JSON column or separate angle table.

### Feature Specifications
- Product Template Upload (PNG/JPG up to 10MB) for 5 product categories: shoes, slippers, clothes, bags, custom.
- AI-generated product designs with category-specific viewing angles (shoes/slippers: top+45°, clothes: front+back, bags: front+side, custom: view1+view2).
- AI-generated model-wearing scenes with configurable elements (nationality, family, scenario, location, presentation).
- High-resolution PNG download for all generated images.
- Multi-language interface with English, Traditional Chinese, and Vietnamese.
- Comprehensive form validation and custom field clearing.

## External Dependencies
- **Google Gemini 2.5 Flash Image Preview:** For AI image generation.
- **PostgreSQL:** Relational database for storing design data.
- **Replit AI Integrations:** Used for Gemini API access.