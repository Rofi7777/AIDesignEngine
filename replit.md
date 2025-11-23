# Craft AI Studio

## Overview
**Craft AI Studio** is an AI-powered design platform offering five core features:
1.  **Product Design Engine:** Generates 4-angle product designs for various fashion categories.
2.  **Model Try-on System:** Creates realistic images of models wearing/using products.
3.  **Virtual Try-on:** Enables precise single or multi-product garment replacement on model images.
4.  **E-commerce Scene Composition:** Combines models, products, and props into marketing scenes.
5.  **E-commerce Poster Design:** Configurable system for creating marketing posters with products, copy, branding, and pricing.

All features leverage **Google Gemini 3 Pro Image Preview** and support English, Traditional Chinese, and Vietnamese. The platform's tagline is "Craft Design Ideas with AI."

## User Preferences
- Follow design_guidelines.md religiously for visual quality
- Use Material Design principles with Inter font
- Implement comprehensive validation with user-friendly error messages
- Provide loading states during AI generation
- Enable download functionality for all generated images

## System Architecture

### UI/UX Decisions
The application features a single-page, two-column layout with a "La Letter-inspired aesthetic," utilizing a soft purple/lavender palette, light backgrounds, rounded components, generous padding, softer shadows, and refined typography. A multi-language selector is available in the header.

### Technical Implementations
-   **Frontend:** React, TypeScript, shadcn UI, React Hook Form, TanStack Query, Tailwind CSS, Wouter.
-   **Backend:** Node.js, Express, Multer.
-   **Database:** PostgreSQL with Drizzle ORM.
-   **AI Architecture:** A three-stage system ensures design consistency:
    1.  **Prompt Optimizer:** **Gemini 3 Pro** text model (`gemini-3-pro-preview`) transforms structured inputs into optimized prompts with advanced reasoning.
    2.  **Image Generation:** **Gemini 3 Pro Image Preview** (`gemini-3-pro-image-preview`) generates high-quality images using optimized prompts.
    3.  **Design Spec Extraction:** **Gemini 3 Pro** (`gemini-3-pro-preview`) extracts structured JSON specifications from canonical designs for ultra-strict consistency across angles.
-   **AI Models:** 
    -   **Text/Reasoning:** Google Gemini 3 Pro Preview (`gemini-3-pro-preview`)
    -   **Image Generation:** Google Gemini 3 Pro Image Preview (`gemini-3-pro-image-preview`)
-   **Validation:** Zod with drizzle-zod for robust form validation.
-   **Internationalization (i18n):** React Context-based translation system with localStorage persistence for English, Traditional Chinese, and Vietnamese.
-   **Multi-Product Type System:** Supports 5 product categories with a 4-angle configuration (top, 45°, side, bottom views).
-   **4-Angle Template Upload System:** Allows uploading up to 4 templates (one per angle) with a fallback mechanism.
-   **Sequential Generation with Enhanced Consistency:** Generates the first angle as a canonical design, extracts its structured design specification, and then uses this specification, along with the canonical image, reference images, and brand logo, to generate subsequent angles with ultra-strict prompting and a color lock system.
-   **Shape Preservation System:** AI strictly enforces the preservation of product silhouette and dimensions from templates, modifying only surface design elements.
-   **Enhanced Design Input:** Supports optional reference image uploads, detailed text descriptions, and brand logo uploads.
-   **Multi-Image Gemini API Integration:** Gemini API calls accept multiple images (template, canonical, reference, logo) for improved consistency.
-   **Custom Options:** Users can specify custom colors, materials, presentation styles, and custom product types.
-   **Database Schema:** Includes `SlipperDesign` (with four view URLs), `ModelScene`, and `PosterRequest` schemas, defined in `shared/schema.ts`.
-   **Feature-Specific Implementations:**
    *   **Product Design Engine:** Includes interactive prompt optimization and 4-angle template upload.
    *   **Model Try-on System:** Configurable elements for realistic product visualization.
    *   **Virtual Try-on:** Dual-mode (single/multi-product) operation with smart garment integration and custom type support.
    *   **E-commerce Scene Composition:** Supports multiple assets (products, props, optional models), various scene types, lighting, and composition styles.
    *   **E-commerce Poster Design:** Three-module configuration for campaign, visual style/layout, and copy/elements, integrating product images, copy, pricing, and branding.

### Cross-Feature Capabilities
-   **Custom Pixel Dimension Support:** For Model Try-on, Virtual Try-on, and E-commerce Scene features, with preset options and custom input (100-4096 pixels).
-   **High-Resolution PNG Download:** Available for all generated images.
-   **Multi-Image Generation:** E-commerce Scene and Poster Design features support generating 1-8 variations per request.
-   **State Management:** Automatic cleanup of previous results on new generation requests.

## Testing Status

### Verified Features ✅
1. **Product Design Engine (Tab 1)** - 4-angle generation working correctly
2. **Product Try-on System (Tab 2)** - Model wearing product generation working after Multer file filter fix
3. **Virtual Try-on (Tab 3)** - Single and multi-product garment replacement working correctly

### Known Issues 🔧
- AI prompt optimization in Product Design page needs debugging (returns 500 error)
- Model Try-on functionality in Product Design page has fetch issues preventing backend request

### Pending Testing ⏳
- E-commerce Scene Composition (Tab 4)
- E-commerce Poster Design (Tab 5)

## Recent Updates
- **2025-11-23:** ✅ **Model Configuration Verified:**
  - Using **`gemini-2.5-flash-image`** for all image generation (supported by Replit AI Integrations)
  - Using **`gemini-2.5-flash`** for all text reasoning and prompt optimization
  - Confirmed Replit AI Integrations supports: Gemini Pro, Gemini 2.5 Flash (text/image), and Imagen 4
  - Note: Gemini 3 Pro models are NOT supported by Replit AI Integrations at this time

## External Dependencies
-   **Google Gemini 2.5 Flash Models:**
    -   **Image** (`gemini-2.5-flash-image`): AI image generation for all 5 features
    -   **Text** (`gemini-2.5-flash`): Prompt optimization and design specification extraction
    -   Both models supported by Replit AI Integrations
-   **PostgreSQL:** Relational database for storing design data
-   **Replit AI Integrations:** Secure Gemini API access with automatic key management