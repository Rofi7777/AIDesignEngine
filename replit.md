# Craft AI Studio

## Overview
**Craft AI Studio** is a comprehensive AI-powered design platform with **four main features**: (1) **Product Design Engine** supporting 4-angle generation for multiple fashion categories, (2) **Model Try-on System** generating realistic images of models wearing/using products, (3) **Virtual Try-on** for precise single or multi-product garment replacement on model images, and (4) **E-commerce Scene Composition** combining models, products, and props into complete marketing scenes. All features use Google Gemini 2.5 Flash with complete multi-language support (English, Traditional Chinese, Vietnamese).

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
- **Advanced Three-Stage AI Architecture for Maximum Design Consistency:**
  - **Stage 1 (Prompt Optimizer):** LLM acts as professional designer with 10+ years product design experience, transforms structured inputs into optimized prompts using gemini-2.5-flash text model
  - **Stage 2 (Image Generation):** Uses expertly-crafted prompts with gemini-2.5-flash-image for superior design quality
  - **Stage 3 (Design Spec Extraction - NEW):** After canonical design generation, extracts structured JSON specification containing all design elements (colors, patterns, textures, materials, branding, decorative elements, structural features) for ultra-strict consistency enforcement
  - Intelligent fallback system ensures stability if any stage encounters issues
  - Comprehensive debug logging for monitoring and troubleshooting
- **AI Integration:** Google Gemini 2.5 Flash Image Preview via Replit AI Integrations.
- **Validation:** Zod with drizzle-zod for robust form validation.
- **Internationalization (i18n):** A React Context-based translation system with localStorage persistence supporting English, Traditional Chinese, and Vietnamese.
- **Multi-Product Type System:** Supports 5 product categories with **4-angle configuration**:
  - **All Products:** top view + 45° view + side view + bottom view
  - Each product type has 4 professionally labeled viewing angles with multi-language support
- **4-Angle Template Upload System:**
  - Users can upload **up to 4 optional templates** (one per angle) in a responsive 2x2 grid layout
  - Angle-specific template upload (e.g., template_top, template_45degree, template_side, template_bottom)
  - Fallback mechanism: if no angle-specific template, uses first uploaded template for all angles
  - Validation ensures at least one template is provided
- **Sequential Generation with Structured Specification Consistency:**
  - **Step 1:** First angle generated as canonical design using three-stage AI architecture
  - **Step 1.5:** Extract structured design specification (JSON) from canonical containing all design elements: colors, patterns, textures, materials, branding, decorative elements, structural features
  - **Step 2-4:** Remaining angles use BOTH canonical image AND structured specification as dual control inputs
  - Each subsequent generation receives explicit positive/negative prompt blocks derived from extracted specification
  - Fallback to visual-only consistency if specification extraction fails
  - Think of it as rotating a 3D model with locked design properties - only camera angle changes
- **Shape Preservation System:** AI prompts strictly enforce preservation of the exact product silhouette, dimensions, proportions, and 3D structure from the template. Only surface design elements (colors, patterns, materials, textures, logos) are modified, treating generation as a "skin wrap."
- **Enhanced Design Input:** Supports optional reference image uploads, detailed design descriptions (text input), and brand logo uploads to guide AI generation.
- **Multi-Image Gemini API Integration:** The Gemini API calls accept multiple images (template + canonical design + reference + logo) in a single request for perfect consistency.
- **Click-to-Enlarge Image Zoom:** All generated images include a click-to-zoom feature, displaying images in a dialog modal for detailed inspection.
- **Custom Options:** Users can specify custom colors, materials, presentation styles, and custom product types with associated validation.
- **Database Schema:** `SlipperDesign` (product_type, custom_product_type, template, theme, style, color, material, **view1Url, view2Url, view3Url, view4Url**, custom options) and `ModelScene` (product image reference, product_type, nationality, family, scenario, location, presentation style, generated scene image). Schemas are defined in `shared/schema.ts`.
- **4-Angle Storage Design:** Each product design is stored with four view URLs (view1Url through view4Url) supporting the new 4-angle system across all product types. Database schema extended with view3Url and view4Url columns.

### Feature Specifications

#### Feature 1: Product Design Engine
- **4-Angle Template Upload:** Upload up to 4 optional product templates (PNG/JPG up to 10MB each) for 5 product categories: shoes, slippers, clothes, bags, custom. Each template corresponds to a specific viewing angle.
- **AI-Generated 4-Angle Product Designs:** All products are generated with 4 viewing angles (top view, 45° view, side view, bottom view) with ULTRA-STRICT design consistency across all angles.

#### Feature 2: Model Try-on System
- **AI-Generated Model-Wearing Scenes:** Configurable elements (nationality, family, scenario, location, presentation) for realistic product visualization.
- **Product-Model Integration:** Uses previously generated product designs as input for model scenes.

#### Feature 3: Virtual Try-on (NEW)
- **Dual Mode Operation:** 
  - **Single-Product Mode:** Precise garment replacement maintaining exact fit and proportions
  - **Multi-Product Mode:** Flexible outfit composition with multiple garments
- **Smart Garment Integration:** AI intelligently replaces specific clothing items while preserving model pose, lighting, and background
- **Supported Product Types:** Tops, bottoms, dresses, shoes, accessories, full outfits

#### Feature 4: E-commerce Scene Composition (NEW)
- **Multi-Asset Support:** Combine 1 model + 2-3 products + 1-2 props (max 6 total assets)
- **Asset Type System:** Products (primary focus) and props (supporting elements like plants, furniture, decorative items)
- **Scene Configuration:** Multiple scene types (studio, lifestyle, outdoor, minimalist), lighting options, composition styles, and aspect ratios
- **Professional Marketing Scenes:** Generate complete e-commerce photography with proper product placement and styling

#### Cross-Feature Capabilities
- **High-Resolution PNG Download:** All generated images support full-resolution downloads.
- **Multi-Language Interface:** Complete support for English, Traditional Chinese, and Vietnamese across all major UI elements.
- **Comprehensive Validation:** Form validation with user-friendly error messages and custom field clearing.
- **Click-to-Enlarge:** All generated images include zoom functionality for detailed inspection.

## External Dependencies
- **Google Gemini 2.5 Flash Image Preview:** For AI image generation.
- **PostgreSQL:** Relational database for storing design data.
- **Replit AI Integrations:** Used for Gemini API access.