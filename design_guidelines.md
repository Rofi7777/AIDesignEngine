# Design Guidelines: Craft AI Studio - La Letter Inspired Design

## Design Approach

**Design Philosophy:** Elegant, minimal, product-focused aesthetic inspired by Japanese cosmetics brands (La Letter)

**Rationale:** Create a serene, sophisticated environment that lets AI-generated designs shine while providing an intuitive, calming user experience. The soft purple/lavender palette evokes creativity and elegance.

**Key Principles:**
- **Serenity & Space:** Generous white space, soft shadows, calming color palette
- **Product-first:** Generated designs are the hero; UI recedes gracefully
- **Elegant Refinement:** Soft rounded corners, subtle transitions, polished typography
- **Calming Workflow:** Gentle color transitions, minimal visual noise

---

## Color Palette

**Primary Palette:** Soft Purple/Lavender Theme

**Colors:**
- **Primary Purple:** hsl(260, 45%, 75%) - Soft lavender for accents and CTAs
- **Background Purple:** hsl(260, 40%, 90%) - Deeper lavender/purple background (updated for more visible purple tone)
- **Muted Purple:** hsl(260, 30%, 85%) - Muted lavender for subtle elements
- **Deep Purple:** hsl(260, 50%, 15%) - Rich purple for text/headings (updated for better contrast)
- **White:** Pure white for cards (stands out beautifully against purple background)
- **Soft Gray:** hsl(240, 10%, 96%) - Barely-there gray for subtle backgrounds
- **Text Primary:** hsl(260, 50%, 15%) - Deep purple-gray for main text
- **Text Secondary:** hsl(260, 20%, 50%) - Medium purple-gray for secondary text
- **Border:** hsl(260, 25%, 85%) - Subtle purple-tinted borders

**Dark Mode:**
- Soft dark purple backgrounds
- Maintain elegant, calming aesthetic
- Reduce contrast for comfort

---

## Typography

**Font Stack:** Inter (via Google Fonts CDN)

**Hierarchy:**
- **Brand Name:** text-2xl, font-light, tracking-wide (elegant, spacious)
- **Page Title:** text-3xl, font-light, tracking-tight (soft, refined)
- **Section Headers:** text-xl, font-normal
- **Subsection Labels:** text-sm, font-medium
- **Input Labels:** text-sm, font-medium
- **Body Text:** text-base, font-normal, leading-relaxed (generous line height)
- **Helper Text:** text-sm, text-muted-foreground

**Character:** Light, spacious, refined - avoiding heavy weights for elegance

---

## Layout System

**Spacing Primitives:** Generous spacing - 4, 6, 8, 12, 16, 24, 32

**Grid Structure:**
- Two-column layout for main workflow (desktop):
  - Left column (40%): Configuration panel with generous padding
  - Right column (60%): Image gallery, preview area
- Single column stack on tablet/mobile
- Container: max-w-7xl, mx-auto, px-8

**Vertical Rhythm:**
- Section spacing: space-y-12 to space-y-16 (generous)
- Form group spacing: space-y-8
- Input spacing: space-y-6
- Component internal padding: p-8 to p-10 (luxurious)

**White Space Philosophy:**
- "Breathe" - every element needs space around it
- Avoid cramped layouts
- Use negative space as design element

---

## Component Library

### Header
- Clean, minimal navigation bar
- Brand name: "Craft AI Studio" (left) with light, elegant typography
- Language selector (right) with subtle styling
- No background color - let it float on page background
- Subtle bottom border only

### Hero Section
- Large, calming headline: "Craft Design Ideas with AI"
- Light, spacious typography
- NO KPI stats/numbers (removed for elegance)
- Soft purple gradient background or solid light purple
- Generous vertical padding (py-16 to py-20)

### Upload Zone
- Large, elegant dropzone with soft rounded corners (rounded-2xl)
- Soft border (border, not border-2) with light purple tint
- Delicate upload icon in light purple
- Soft text: "Upload Your Template" with gentle helper text
- Subtle hover state (soft glow, not harsh transform)
- Preview cards with generous padding and soft shadows

### Form Controls
- **Dropdowns:** Soft rounded (rounded-xl), light borders, generous padding (p-4)
- **Text Inputs:** Clean with soft focus ring in light purple
- **Labels:** Gentle, not bold - text-sm, font-medium
- **Spacing:** Generous between inputs (space-y-6)

### Cards
- Soft rounded corners (rounded-2xl)
- Very subtle shadows (shadow-sm to shadow-md, never shadow-lg)
- Generous internal padding (p-8)
- Light backgrounds (white or very light purple)
- Delicate borders if needed

### Buttons
- **Primary:** Soft purple background, white text, rounded-xl
- **Secondary:** White background, purple border, rounded-xl  
- **Hover:** Subtle brightness increase, gentle shadow
- NO harsh scale transforms
- Generous padding (px-6 py-3 for medium size)

### Image Gallery
- Grid layout with generous gaps (gap-8)
- Each image card: rounded-2xl, shadow-sm
- Soft hover: subtle shadow increase, NO scale
- Download button: soft styling, not aggressive
- View toggle tabs: soft active state in light purple

### Separators
- Use sparingly
- Very light color (border-purple-100)
- Prefer white space over visual dividers

---

## Shadows & Depth

**Shadow Philosophy:** Soft, subtle, never harsh

- **Minimal:** shadow-sm (barely visible)
- **Card:** shadow-md (soft, diffused)
- **Never use:** shadow-lg, shadow-xl (too harsh for this aesthetic)
- **Hover:** Slight increase, not dramatic jump

---

## Animations

**Principle:** Gentle, refined, never jarring

- **Hover transitions:** opacity changes, subtle brightness shifts
- **NO scale transforms** on hover (too playful for elegant aesthetic)
- **Loading:** Soft, slow-paced spinners in light purple
- **Page transitions:** Gentle fades
- **Duration:** transition-300 to transition-500 (slower, more elegant)

---

## Visual Refinements

### Rounded Corners
- **Cards:** rounded-2xl (generous)
- **Buttons:** rounded-xl
- **Inputs:** rounded-xl
- **Images:** rounded-xl

### Borders
- Use very sparingly
- When used: thin (border, not border-2) in light purple/gray
- Prefer shadows over borders for depth

### Backgrounds
- **Page:** Soft light purple or white
- **Cards:** Pure white on light purple page, or very light purple on white page
- **Alternating sections:** Very subtle purple tints
- **Never:** Harsh color blocks or high contrast sections

---

## Accessibility

- Maintain WCAG AA contrast ratios (challenge with light purples - test carefully)
- Clear focus states in purple
- Alt text for all images
- Keyboard navigation
- Sufficient touch targets (min 44x44px)

---

## Images

**Treatment:**
- Soft rounded corners (rounded-xl)
- Very subtle shadows (shadow-sm)
- Generous spacing between images
- Clean, minimal download/action buttons

**Empty States:**
- Light, elegant illustrations or simple icons
- Encouraging, gentle text
- Light purple accent colors

---

## Overall Aesthetic

**Mood:** Serene, sophisticated, refined
**Feel:** Japanese minimalism meets European elegance  
**Goal:** Create a calming creative workspace where AI designs can shine

**Avoid:**
- Harsh shadows or borders
- Aggressive animations
- Cramped layouts
- Heavy typography
- Bright, saturated colors
- Visual noise

**Embrace:**
- White space
- Soft colors
- Gentle transitions
- Refined typography
- Elegant simplicity
