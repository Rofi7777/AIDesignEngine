import { GoogleGenAI, type Content, HarmCategory, HarmBlockThreshold } from "@google/genai";

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
      model: "gemini-3-pro-preview",
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
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_NONE
          },
          {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_NONE
          },
          {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_NONE
          },
          {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_NONE
          }
        ],
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
  const colorList = [...spec.primaryColors, ...spec.secondaryColors];
  const hasColors = colorList.length > 0;
  
  return `
╔════════════════════════════════════════════════════════════════╗
║    🚨 CRITICAL: ABSOLUTE DESIGN CONSISTENCY REQUIRED 🚨        ║
║         ZERO DEVIATION PERMITTED - EXACT COPY ONLY             ║
╚════════════════════════════════════════════════════════════════╝

YOU ARE GENERATING: ${angle} VIEW OF THE SAME PRODUCT

⚠️⚠️⚠️ CRITICAL RULES - READ CAREFULLY ⚠️⚠️⚠️

1. This is NOT a new product - it is the SAME EXACT PRODUCT from a different angle
2. You are looking at a PHYSICAL OBJECT that has already been manufactured
3. The design is FIXED and CANNOT CHANGE
4. ONLY the camera position/viewing angle changes
5. Think of this as taking multiple photos of ONE physical item

═══════════════════════════════════════════════════════════════
                 🎨 COLOR CONSISTENCY (CRITICAL!)
═══════════════════════════════════════════════════════════════

${hasColors ? `
🔴 MANDATORY COLORS - USE EXACTLY THESE COLORS:
${colorList.map((c, i) => `   ${i + 1}. ${c.toUpperCase()}`).join('\n')}

⛔ FORBIDDEN COLORS:
   ❌ DO NOT use white if the canonical uses pink/rose/blush
   ❌ DO NOT use pink if the canonical uses white
   ❌ DO NOT use any color not listed above
   ❌ DO NOT create color variations or alternatives
   ❌ DO NOT change color saturation, brightness, or tone
   ❌ DO NOT mix colors that were not mixed in the canonical

🎯 COLOR VERIFICATION:
   ✓ Main body color: ${spec.primaryColors[0] || 'match canonical exactly'}
   ✓ Accent colors: ${spec.secondaryColors.join(', ') || 'match canonical exactly'}
   ✓ Every pixel's color must come from the canonical design
` : `
⚠️ NO COLOR SPECIFICATION PROVIDED
🔍 Solution: Study the canonical design image carefully
✅ Copy EVERY color you see EXACTLY as it appears
❌ DO NOT invent new colors or change existing ones
`}

═══════════════════════════════════════════════════════════════
              📐 DESIGN ELEMENTS (MUST MATCH 100%)
═══════════════════════════════════════════════════════════════

${spec.patterns.length > 0 ? `
🔷 PATTERNS (MUST REPLICATE):
${spec.patterns.map(p => `   ✓ ${p}`).join('\n')}
` : ''}

${spec.textures.length > 0 ? `
✋ TEXTURES (MUST MATCH):
${spec.textures.map(t => `   ✓ ${t}`).join('\n')}
` : ''}

${spec.materials.length > 0 ? `
🧵 MATERIALS (MUST USE):
${spec.materials.map(m => `   ✓ ${m}`).join('\n')}
` : ''}

${spec.brandingElements.length > 0 ? `
🏷️ BRANDING (MUST INCLUDE):
${spec.brandingElements.map(b => `   ✓ ${b}`).join('\n')}
` : ''}

${spec.decorativeElements.length > 0 ? `
✨ DECORATIVE ELEMENTS (MUST PRESERVE):
${spec.decorativeElements.map(d => `   ✓ ${d}`).join('\n')}
` : ''}

${spec.structuralFeatures.length > 0 ? `
🔧 STRUCTURAL FEATURES (MUST PRESERVE):
${spec.structuralFeatures.map(s => `   ✓ ${s}`).join('\n')}
` : ''}

🎯 OVERALL STYLE:
   ${spec.overallStyle}

═══════════════════════════════════════════════════════════════
                 🎬 YOUR TASK (STEP-BY-STEP)
═══════════════════════════════════════════════════════════════

STEP 1: ANALYZE the canonical design image
   - Identify every color used
   - Note all patterns and their placement
   - Observe all decorative elements
   - Study the overall design aesthetic
   - IGNORE any watermarks, text overlays, or third-party branding

STEP 2: UNDERSTAND your angle: ${angle}
   - This angle shows the product from a different viewpoint
   - The product itself is UNCHANGED
   - You are NOT redesigning - you are PHOTOGRAPHING

STEP 3: GENERATE the image
   - Use the canonical image as your ABSOLUTE reference
   - Copy EVERY design detail exactly
   - Change ONLY the viewing angle
   - Maintain 100% visual consistency

═══════════════════════════════════════════════════════════════
                     ❌ STRICTLY FORBIDDEN ❌
═══════════════════════════════════════════════════════════════

🚫 NEVER reproduce watermarks, text overlays, logos, or platform branding (e.g., "小紅書", phone numbers, URLs) from reference images
🚫 NEVER change colors (e.g., pink → white, white → pink)
🚫 NEVER add patterns that weren't in the canonical
🚫 NEVER remove patterns that were in the canonical
🚫 NEVER modify textures or materials
🚫 NEVER change decorative elements
🚫 NEVER alter the style or aesthetic
🚫 NEVER create variations or alternatives
🚫 NEVER interpret or improvise - ONLY COPY (except watermarks/third-party marks)

═══════════════════════════════════════════════════════════════

🔍 QUALITY CHECK (Before submitting):
   ✓ Do all colors match the canonical EXACTLY?
   ✓ Are all patterns preserved and placed correctly?
   ✓ Are all decorative elements included?
   ✓ Does it look like the same physical product from a different angle?
   ✓ Would a customer recognize this as the SAME item?

IF YOU ANSWERED "NO" TO ANY QUESTION ABOVE → REGENERATE

REMEMBER: You are photographing ONE product from the ${angle} angle.
The product cannot change between photos.

NOW GENERATE THE ${angle} VIEW WITH PERFECT CONSISTENCY.
`;
}
