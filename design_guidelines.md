# Design Guidelines: Seasonal Slipper Design AI Web App

## Design Approach

**Selected Approach:** Design System (Material Design) with Linear-inspired refinements

**Rationale:** This is a professional productivity tool for designers that requires clean, efficient workflows with emphasis on generated visual outputs. Material Design provides robust form patterns and data display components, while Linear's typography and spacing principles add polish.

**Key Principles:**
- Content-first: UI recedes, generated designs shine
- Efficient workflow: Clear visual hierarchy guides users through upload → configure → generate → download
- Professional polish: Clean, modern aesthetic builds designer confidence

---

## Typography

**Font Stack:** Inter (via Google Fonts CDN)

**Hierarchy:**
- Page Title: text-3xl, font-semibold, tracking-tight
- Section Headers: text-xl, font-semibold
- Subsection Labels: text-sm, font-medium, uppercase, tracking-wide (subtle hierarchy)
- Input Labels: text-sm, font-medium
- Body/Descriptions: text-base, font-normal
- Helper Text: text-sm, text-gray-600

---

## Layout System

**Spacing Primitives:** Tailwind units of 2, 4, 6, 8, 12, 16, 24

**Grid Structure:**
- Two-column layout for main workflow (desktop): 
  - Left column (40%): Input controls, configuration panel
  - Right column (60%): Image gallery, preview area
- Single column stack on tablet/mobile
- Container: max-w-7xl, mx-auto, px-6

**Vertical Rhythm:**
- Section spacing: space-y-8 to space-y-12
- Form group spacing: space-y-6
- Input spacing: space-y-4
- Component internal padding: p-6 to p-8

---

## Component Library

### Upload Zone
- Large dropzone area with dashed border (border-2, border-dashed, rounded-lg)
- Prominent upload icon (via Heroicons - cloud-arrow-up)
- Primary text: "Upload Slipper Template" + helper text with supported formats
- Drag-and-drop active state with subtle background change
- Uploaded file preview with thumbnail + filename + remove button

### Form Controls
- **Dropdowns:** Full-width select elements with chevron-down icon, rounded-lg, border, p-3
- **Text Inputs:** Clean text fields with focus ring, rounded-lg, border, p-3
- **Color/Material Chips:** Horizontal scrollable row of selectable chips (rounded-full, px-4, py-2)
- **Labels:** Above inputs, consistent text-sm, font-medium, mb-2

### Generation Controls
- **Primary CTA:** Large, prominent button - "Generate Slipper Design" with arrow-right icon
- **Secondary CTA:** "Generate Model Scene" with slightly less visual weight
- Full-width on mobile, auto-width on desktop
- Loading states with spinner icon during AI generation

### Image Gallery
- Masonry grid layout (2 columns on mobile, 3-4 on desktop)
- Each image card: rounded-xl, shadow-lg, overflow-hidden
- Hover state: subtle scale transform, shadow increases
- Download button overlay (bottom-right) with arrow-down icon
- View toggle: Top View / 45° View tabs above gallery

### Navigation
- Top header with app logo/name (left), minimal utility nav (right)
- Sticky position during scroll
- Clean horizontal divider below (border-b)

---

## Page Structure

**Main Workflow Page:**

1. **Header Section** (py-6)
   - App branding + tagline
   - Minimal navigation (if future phases)

2. **Hero/Introduction** (py-12)
   - Brief value statement: "Accelerate seasonal slipper design with AI"
   - Stat highlights in horizontal row: "70% faster" | "3× more concepts" | "80% approval rate"

3. **Two-Column Workspace** (py-8)
   
   **Left Column: Configuration Panel**
   - Upload Template section
   - Theme Selection dropdown
   - Style Selection dropdown  
   - Color Palette selector (chip-based)
   - Material Input (dropdown + text)
   - Angle Requirements (checkboxes: Top View, 45° View)
   - Generate Design CTA
   - Divider (my-8)
   - Model Scene Configuration (collapsible/expandable):
     - Nationality dropdown
     - Family Combination dropdown
     - Scenario dropdown
     - Location dropdown
     - Presentation Style selector
   - Generate Model Scene CTA

   **Right Column: Results Gallery**
   - Generated Designs section header
   - View toggle tabs
   - Image grid with download functionality
   - Empty state: Placeholder illustration with "Upload template to begin"

---

## Icons

**Library:** Heroicons (via CDN)

**Usage:**
- Upload: cloud-arrow-up
- Download: arrow-down-tray
- Generate: sparkles or arrow-right
- Dropdowns: chevron-down
- Remove/Close: x-mark
- Success: check-circle
- Loading: spinner (animated)

---

## Accessibility

- All form inputs have associated labels (for/id)
- Focus states use visible ring (ring-2, ring-offset-2)
- Sufficient color contrast for all text
- Alt text for all generated images
- Keyboard navigation for all interactive elements
- ARIA labels for icon-only buttons

---

## Images

**No decorative hero image required** - This is a utility tool where the workflow starts immediately.

**Generated Output Images:**
- User-uploaded slipper templates (displayed as thumbnails)
- AI-generated slipper designs (top view + 45° view) - primary content
- AI-generated model wearing scenes - primary content
- Empty state placeholder illustration (simple line-art showing upload concept)

**Image Treatment:**
- All generated images displayed at high quality
- Subtle shadow for depth (shadow-md to shadow-lg)
- Rounded corners for polish (rounded-lg to rounded-xl)
- Responsive sizing with object-fit: cover for consistency

---

## Animations

**Minimal, purposeful animations only:**
- Button hover: subtle scale (scale-105) + shadow increase
- Image card hover: scale-102 + shadow increase  
- Loading spinner: rotate animation during AI generation
- Dropdown open/close: smooth height transition
- No scroll-based animations or complex micro-interactions

---

This utility-first design ensures designers can efficiently navigate the workflow while keeping focus on their creative output—the AI-generated slipper designs themselves.