import { GoogleGenAI, type Content } from "@google/genai";

const genAI = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY || "",
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

export interface DesignSpecification {
  primaryColors: string[];
  secondaryColors: string[];
  patterns: string[];
  textures: string[];
  materials: string[];
  brandingElements: string[];
  decorativeElements: string[];
  structuralFeatures: string[];
  overallStyle: string;
}

export async function extractDesignSpecification(
  canonicalImageBase64: string,
  productType: string
): Promise<DesignSpecification> {
  console.log('[Design Spec Extractor] Starting specification extraction...');
  
  const extractionPrompt = `You are a professional product designer analyzing a ${productType} design to create a detailed specification.

TASK: Extract EVERY visual design element from this image into a structured specification.

ANALYZE AND DOCUMENT:

1. PRIMARY COLORS (list all main colors with specific shades)
   - What are the dominant colors?
   - Include exact color descriptions (e.g., "deep crimson red", "cool gray", "butter yellow")

2. SECONDARY COLORS (list all accent/minor colors)
   - What colors appear in smaller amounts?
   - Include all visible color variations

3. PATTERNS (describe all patterns in detail)
   - Floral, geometric, text, graphics?
   - Pattern placement and distribution
   - Pattern colors and style

4. TEXTURES (describe visible textures)
   - Smooth, rough, fabric, leather, rubber?
   - Texture locations on the product

5. MATERIALS (identify all materials)
   - What materials are visible? (canvas, EVA foam, rubber, suede, etc.)
   - Material finish (matte, glossy, textured)

6. BRANDING ELEMENTS (list all text/logos)
   - Brand names visible
   - Logo placements
   - Text content and typography
   - Embossed or printed details

7. DECORATIVE ELEMENTS (describe all decorative features)
   - Graphics, illustrations, motifs
   - Embellishments, stitching patterns
   - Special design features

8. STRUCTURAL FEATURES (describe product structure)
   - Shape characteristics
   - Component parts and their relationship
   - Construction details visible

9. OVERALL STYLE
   - Design aesthetic (minimal, festive, sporty, elegant, etc.)
   - Design theme or concept

OUTPUT FORMAT:
Return a JSON object with the following structure:
{
  "primaryColors": ["color1", "color2", ...],
  "secondaryColors": ["color1", "color2", ...],
  "patterns": ["pattern description 1", "pattern description 2", ...],
  "textures": ["texture1", "texture2", ...],
  "materials": ["material1", "material2", ...],
  "brandingElements": ["brand/text element 1", "brand/text element 2", ...],
  "decorativeElements": ["decorative element 1", "decorative element 2", ...],
  "structuralFeatures": ["structural feature 1", "structural feature 2", ...],
  "overallStyle": "detailed style description"
}

BE EXTREMELY THOROUGH AND PRECISE. This specification will be used to ensure identical design across multiple viewing angles.`;

  try {
    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: extractionPrompt },
            {
              inlineData: {
                mimeType: "image/png",
                data: canonicalImageBase64,
              },
            },
          ],
        },
      ],
      config: {
        temperature: 0.1, // Low temperature for consistent extraction
        maxOutputTokens: 2048,
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error('No text response from AI');
    }
    
    console.log('[Design Spec Extractor] Raw AI response:', text.substring(0, 200) + '...');

    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
    }

    const designSpec = JSON.parse(jsonMatch[0]) as DesignSpecification;
    
    console.log('[Design Spec Extractor] Extracted specification:', JSON.stringify(designSpec, null, 2));
    
    return designSpec;
  } catch (error) {
    console.error('[Design Spec Extractor] Error extracting design specification:', error);
    
    // Fallback: return empty specification
    return {
      primaryColors: [],
      secondaryColors: [],
      patterns: [],
      textures: [],
      materials: [],
      brandingElements: [],
      decorativeElements: [],
      structuralFeatures: [],
      overallStyle: "Unable to extract design specification",
    };
  }
}

export function createConsistencyPrompt(spec: DesignSpecification, angle: string): string {
  return `
╔════════════════════════════════════════════════════════════════╗
║         ABSOLUTE DESIGN CONSISTENCY REQUIREMENTS               ║
║              ZERO DEVIATION PERMITTED                          ║
╚════════════════════════════════════════════════════════════════╝

YOU ARE GENERATING: ${angle}

⚠️ CRITICAL: This is a DIFFERENT CAMERA ANGLE of the SAME EXACT PRODUCT
⚠️ ONLY the viewing angle changes - ALL design elements MUST remain IDENTICAL

═══════════════════════════════════════════════════════════════
                    MANDATORY DESIGN SPECIFICATION
═══════════════════════════════════════════════════════════════

🎨 PRIMARY COLORS (MUST USE EXACTLY):
${spec.primaryColors.map(c => `   ✓ ${c}`).join('\n') || '   (none specified)'}

🎨 SECONDARY COLORS (MUST USE EXACTLY):
${spec.secondaryColors.map(c => `   ✓ ${c}`).join('\n') || '   (none specified)'}

📐 PATTERNS (MUST REPLICATE EXACTLY):
${spec.patterns.map(p => `   ✓ ${p}`).join('\n') || '   (none specified)'}

✋ TEXTURES (MUST MATCH EXACTLY):
${spec.textures.map(t => `   ✓ ${t}`).join('\n') || '   (none specified)'}

🧵 MATERIALS (MUST USE EXACTLY):
${spec.materials.map(m => `   ✓ ${m}`).join('\n') || '   (none specified)'}

🏷️ BRANDING ELEMENTS (MUST INCLUDE EXACTLY):
${spec.brandingElements.map(b => `   ✓ ${b}`).join('\n') || '   (none specified)'}

✨ DECORATIVE ELEMENTS (MUST INCLUDE EXACTLY):
${spec.decorativeElements.map(d => `   ✓ ${d}`).join('\n') || '   (none specified)'}

🔧 STRUCTURAL FEATURES (MUST PRESERVE):
${spec.structuralFeatures.map(s => `   ✓ ${s}`).join('\n') || '   (none specified)'}

🎯 OVERALL STYLE:
   ${spec.overallStyle}

═══════════════════════════════════════════════════════════════
                    POSITIVE REQUIREMENTS
═══════════════════════════════════════════════════════════════

✅ USE the exact colors listed above
✅ REPLICATE all patterns with same placement logic
✅ MAINTAIN all branding/text elements
✅ PRESERVE all decorative features
✅ KEEP the same material appearance
✅ MATCH the overall aesthetic and style
✅ ONLY change the camera viewing angle

═══════════════════════════════════════════════════════════════
                    NEGATIVE CONSTRAINTS (FORBIDDEN)
═══════════════════════════════════════════════════════════════

❌ DO NOT change any colors from the specification
❌ DO NOT add new patterns or modify existing ones
❌ DO NOT alter branding elements or text
❌ DO NOT change materials or textures
❌ DO NOT add or remove decorative elements
❌ DO NOT change the product style or aesthetic
❌ DO NOT invent new design features

═══════════════════════════════════════════════════════════════

THINK OF THIS AS: Rotating a physical product in your hand
- The product design is LOCKED and UNCHANGEABLE
- ONLY your viewing angle shifts to show the ${angle}
- Every color, pattern, text, and detail remains IDENTICAL

VERIFICATION CHECKLIST (before generating):
□ All colors from specification used?
□ All patterns replicated accurately?
□ All branding elements included?
□ All decorative features preserved?
□ Materials and textures matched?
□ Only camera angle changed?

GENERATE THE ${angle} NOW with PERFECT CONSISTENCY.
`;
}
