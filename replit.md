# AI-Powered Seasonal Slipper Design Engine

## Overview
AI-powered seasonal slipper design application using Google Gemini 2.5 Flash Image Preview. Users upload slipper templates, configure design parameters, generate AI-created slipper designs (top and 45° views), and create model-wearing scenes with customizable options. All generated images support high-resolution PNG downloads.

## Project Status
**Current State:** MVP Complete - Production Ready

**Last Updated:** November 15, 2025

## Recent Changes
- ✅ Implemented Gemini 2.5 Flash Image Preview integration using Replit AI Integrations
- ✅ Built complete frontend with React Hook Form + zodResolver validation
- ✅ Implemented backend API with Multer file upload and Buffer-to-Gemini pipeline
- ✅ Fixed critical validation issues for custom field clearing and async FormData handling
- ✅ Added comprehensive data-testid coverage for all interactive elements
- ✅ Achieved architect approval for production-ready implementation
- ✅ Added robust error handling for invalid images with user-friendly messages
- ✅ Implemented image buffer validation before calling Gemini API
- ✅ Fixed error status codes (400 for client errors, 500 for server errors)

## Tech Stack
- **Frontend:** React, TypeScript, shadcn UI, React Hook Form, TanStack Query, Tailwind CSS
- **Backend:** Node.js, Express, Multer (file uploads), in-memory storage
- **AI:** Google Gemini 2.5 Flash Image Preview via Replit AI Integrations
- **Routing:** Wouter
- **Validation:** Zod with drizzle-zod

## Project Architecture

### Data Models
All schemas defined in `shared/schema.ts`:
- **SlipperDesign:** Template image, theme, style, color, material, custom options, generated images (top + 45° views)
- **ModelScene:** Slipper image reference, nationality, family combination, scenario, location, presentation style, generated scene image

### Frontend Structure
- **Single-page application** with two-column layout (40% configuration / 60% gallery)
- **File upload zone** with drag-and-drop, preview, and validation
- **Design configuration** with theme, style, color palette, and material selectors
- **Model scene configuration** with nationality, family, scenario, location, and presentation style
- **Image gallery** with toggle between top/45° views and download functionality
- **Comprehensive validation** using React Hook Form + Zod refinements
- **Custom field clearing** when switching from custom to preset options

### Backend Structure
- **Storage Interface:** `server/storage.ts` with in-memory implementation
- **API Routes:** `server/routes.ts` with `/api/generate-design` and `/api/generate-model`
- **Gemini Integration:** `server/gemini.ts` with functions for slipper design and model scene generation
- **File Handling:** Multer for multipart/form-data with Buffer objects passed directly to Gemini

### Key Features
1. **Slipper Template Upload:** PNG/JPG up to 10MB with preview and remove functionality
2. **Design Generation:** AI creates top and 45° view slipper designs based on theme, style, color, and material
3. **Model Scene Generation:** AI creates model wearing scenes with configurable nationality, family, scenario, location, and presentation
4. **Download Functionality:** High-resolution PNG download for all generated images
5. **Custom Options:** Users can specify custom colors, materials, and presentation styles with validation
6. **Responsive Design:** Material Design principles with Inter font and polished UI components

## Critical Implementation Details

### File Upload Flow
1. User uploads template → Frontend validates size/type → Preview displayed
2. On design submit → File converted to FormData → Posted to `/api/generate-design`
3. Backend receives multipart/form-data → Multer extracts file as Buffer
4. Buffer passed directly to Gemini (no base64 conversion required)
5. Generated images stored in memory → Returned as data URLs to frontend

### Custom Field Validation
- **Color/Material:** When "custom" is selected, customColor/customMaterial fields become required
- **Presentation Style:** When "Custom" is selected, customStyleText field becomes required
- **Field Clearing:** Custom fields automatically reset to "" when user switches to preset options
- **Refinement Validation:** Zod refinements ensure non-empty custom values before submission

### Data-testid Coverage
All interactive elements and content displays have data-testid attributes following the pattern:
- Interactive: `{action}-{target}` (e.g., `button-submit`, `input-email`)
- Display: `{type}-{content}` (e.g., `text-username`, `img-avatar`)
- Dynamic: `{type}-{description}-{id}` (e.g., `card-product-${id}`)

## User Preferences
- Follow design_guidelines.md religiously for visual quality
- Use Material Design principles with Inter font
- Implement comprehensive validation with user-friendly error messages
- Provide loading states during AI generation
- Enable download functionality for all generated images

## Known Issues & Future Enhancements

### Known Limitations
- **Image Requirements:** Gemini API requires valid, properly formatted images. Very small or corrupted images will be rejected with a clear error message.
- **Generation Time:** AI image generation can take 10-30 seconds per request depending on Gemini API load
- **In-Memory Storage:** Generated images are stored in memory and will be lost on server restart

### Future Enhancements
- Persistent database storage for generated designs
- User accounts and authentication
- Design history and favorites
- Batch processing for multiple designs
- Image optimization and compression
- Export to multiple formats (PNG, JPG, SVG)

## Running the Project
```bash
npm run dev
```
Starts Express server (backend) and Vite server (frontend) on the same port.

## Environment Variables
- `SESSION_SECRET`: Session secret for Express session middleware (already configured)
- Gemini API integration uses Replit AI Integrations (no API key required, charges billed to credits)
