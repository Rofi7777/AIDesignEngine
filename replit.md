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
- ✅ Migrated from in-memory to PostgreSQL database with proper design pairing
- ✅ Implemented multi-language interface (i18n) with English, Traditional Chinese (繁體中文), and Vietnamese (Tiếng Việt) support

## Tech Stack
- **Frontend:** React, TypeScript, shadcn UI, React Hook Form, TanStack Query, Tailwind CSS
- **Backend:** Node.js, Express, Multer (file uploads), PostgreSQL database with Drizzle ORM
- **AI:** Google Gemini 2.5 Flash Image Preview via Replit AI Integrations
- **Routing:** Wouter
- **Validation:** Zod with drizzle-zod
- **i18n:** React Context-based translation system with localStorage persistence

## Project Architecture

### Data Models
All schemas defined in `shared/schema.ts`:
- **SlipperDesign:** Template image, theme, style, color, material, custom options, generated images (top + 45° views)
- **ModelScene:** Slipper image reference, nationality, family combination, scenario, location, presentation style, generated scene image

### Frontend Structure
- **Single-page application** with two-column layout (40% configuration / 60% gallery)
- **Language Selector:** Dropdown in header to switch between English, Traditional Chinese, and Vietnamese
- **Translation System:** React Context (LanguageProvider) with localStorage persistence
- **Translation Helpers:** Helper functions to translate dropdown options (themes, styles, colors, materials, etc.)
- **File upload zone** with drag-and-drop, preview, and validation
- **Design configuration** with theme, style, color palette, and material selectors
- **Model scene configuration** with nationality, family, scenario, location, and presentation style
- **Image gallery** with toggle between top/45° views and download functionality
- **Comprehensive validation** using React Hook Form + Zod refinements
- **Custom field clearing** when switching from custom to preset options
- **All UI text translated:** Headers, labels, placeholders, buttons, toast messages, form options

### Backend Structure
- **Database:** PostgreSQL with Drizzle ORM, tables for projects, designs, modelScenes, brandColors, bomMaterials
- **Storage Interface:** `server/storage.ts` with DatabaseStorage implementation
- **API Routes:** `server/routes.ts` with `/api/generate-design` and `/api/generate-model`
- **Gemini Integration:** `server/gemini.ts` with functions for slipper design and model scene generation
- **File Handling:** Multer for multipart/form-data with Buffer objects passed directly to Gemini
- **Design Pairing:** saveCompleteDesign method ensures top and 45° views are stored in single database row

### Key Features
1. **Slipper Template Upload:** PNG/JPG up to 10MB with preview and remove functionality
2. **Design Generation:** AI creates top and 45° view slipper designs based on theme, style, color, and material
3. **Model Scene Generation:** AI creates model wearing scenes with configurable nationality, family, scenario, location, and presentation
4. **Download Functionality:** High-resolution PNG download for all generated images
5. **Custom Options:** Users can specify custom colors, materials, and presentation styles with validation
6. **Multi-Language Interface:** Full i18n support for English, Traditional Chinese (繁體中文), and Vietnamese (Tiếng Việt) with language selector in header
7. **Database Persistence:** PostgreSQL database stores all generated designs with proper pairing of top and 45° views
8. **Responsive Design:** Material Design principles with Inter font and polished UI components

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
- **Language Coverage:** Currently supports English, Traditional Chinese, and Vietnamese. Additional languages can be added to `client/src/lib/translations.ts`

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
- `DATABASE_URL`: PostgreSQL connection string (automatically configured by Replit)
- Gemini API integration uses Replit AI Integrations (no API key required, charges billed to credits)

## Multi-Language Support (i18n)

### Complete i18n Architecture
**Status:** Production-ready with 100% translation coverage

### Schema-Driven Translation System
All dropdown options use **stable PascalCase keys** stored in the database, ensuring proper translation in all languages:

**Schema Constants (`shared/schema.ts`):**
- `THEMES`: ["SpringSummer", "FallWinter", "HolidaySeason", ...]
- `STYLES`: ["Graffiti", "Minimal", "Sporty", ...]
- `COLOR_PALETTES`: ["Pastel", "EarthTones", "Neon", ...]
- `MATERIALS`: ["Leather", "Canvas", "Synthetic", ...]
- `NATIONALITIES`: ["American", "European", "Asian", ...]
- `FAMILY_COMBINATIONS`: ["MotherChild", "FatherChild", ...]
- `SCENARIOS`: ["ParentChildPlay", "SoloRelaxation", ...]
- `LOCATIONS`: ["CityStreet", "HomeInterior", "OutdoorPark", ...]
- `PRESENTATION_STYLES`: ["RealisticPhotography", "ProductMockup", "Custom"]

**Translation Mapping:**
- Schema key "SpringSummer" → Translation key "themeSpringSummer" → Localized: "Spring/Summer" (EN), "春夏" (ZH-TW), "Xuân Hè" (VI)
- Helper functions in `home.tsx` automatically map schema keys to translation keys
- Database stores stable keys (e.g., "SpringSummer"), frontend displays translations

### Implementation Details
- **Translation Files:** `client/src/lib/translations.ts` contains all translation dictionaries
- **Context Provider:** `client/src/contexts/LanguageContext.tsx` manages language state
- **Language Selector:** `client/src/components/LanguageSelector.tsx` dropdown component in header
- **Storage:** User's language preference persisted to localStorage

### Supported Languages
1. **English (en):** Default language
2. **Traditional Chinese (zh-TW / 繁體中文):** Full translation of all UI elements
3. **Vietnamese (vi / Tiếng Việt):** Full translation of all UI elements

### Translation Coverage
- Header and hero section
- All form labels and placeholders
- Dropdown options (themes, styles, colors, materials, nationalities, families, scenarios, locations, presentation styles)
- Button labels (Generate Design, Generate Model Scene, etc.)
- View mode tabs (Top View, 45° View)
- Toast messages (success and error notifications)
- Empty states and helper text

### Adding New Languages
1. Add new language code to `Language` type in `client/src/lib/translations.ts`
2. Copy English translation object and translate all values
3. Add language name to `languageNames` object in `LanguageSelector.tsx`
4. New language will automatically appear in language selector dropdown
