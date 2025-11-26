// Based on javascript_gemini_ai_integrations blueprint
import { GoogleGenAI, Modality } from "@google/genai";

// This is using Replit's AI Integrations service, which provides Gemini-compatible API access
// without requiring your own Gemini API key. Charges are billed to your Replit credits.
const GEMINI_API_KEY =
  process.env.AI_INTEGRATIONS_GEMINI_API_KEY ||
  process.env.GEMINI_API_KEY ||
  process.env.GOOGLE_API_KEY;

if (!GEMINI_API_KEY) {
  throw new Error(
    "Gemini API key is missing. Set AI_INTEGRATIONS_GEMINI_API_KEY (preferred) or GEMINI_API_KEY.",
  );
}

const ai = new GoogleGenAI({
  apiKey: GEMINI_API_KEY,
  httpOptions: {
    apiVersion: "v1beta",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL || process.env.GEMINI_API_BASE_URL,
  },
});

export async function generateSlipperDesign(
  templateBuffer: Buffer,
  mimeType: string,
  theme: string,
  style: string,
  color: string,
  material: string,
  angle: "top" | "45degree",
  referenceImageBuffer?: Buffer,
  referenceImageMimeType?: string,
  brandLogoBuffer?: Buffer,
  brandLogoMimeType?: string,
  designDescription?: string,
  canonicalDesignBuffer?: Buffer,
  canonicalDesignMimeType?: string
): Promise<string> {
  if (templateBuffer.length < 100) {
    throw new Error("Image file is too small or invalid. Please upload a valid slipper template image.");
  }

  const angleDescription = angle === "top" 
    ? "top-down view showing the upper surface of the slipper" 
    : "45-degree angled view showing both the top and side profile of the slipper";

  let prompt = "";

  // CRITICAL: If canonicalDesignBuffer is provided, this is the SECOND generation
  // We must enforce design consistency
  if (canonicalDesignBuffer) {
    prompt = `CRITICAL INSTRUCTION: You are creating an ALTERNATE ANGLE VIEW of an EXISTING slipper design.

The first image shows the CANONICAL DESIGN (top-down view) that has already been created.
The second image is the original template for reference.

YOUR TASK:
Create a ${angleDescription} of the EXACT SAME slipper design shown in the canonical design image.

STRICT CONSISTENCY REQUIREMENTS:
1. ✓ MUST use the IDENTICAL pattern/graphic design from the canonical image
2. ✓ MUST use the EXACT SAME colors and color scheme
3. ✓ MUST maintain the SAME material textures and finishes
4. ✓ MUST keep the SAME background style and lighting
5. ✓ MUST preserve the SAME brand logo placement (if present)
6. ✓ ONLY CHANGE: Camera angle from top-down to 45-degree angled view
7. ✓ NO new design elements, NO pattern variations, NO color changes

DESIGN SPECIFICATIONS (for reference only - already applied in canonical design):
- Seasonal Theme: ${theme}
- Design Style: ${style}
- Color Palette: ${color}
- Material: ${material}`;

    if (designDescription && designDescription.trim()) {
      prompt += `\n- Design Notes: ${designDescription}`;
    }

    prompt += `\n\nThis is a RENDERING TASK, not a creative design task. Your goal is to show the SAME design from a different camera angle with perfect consistency.`;

  } else {
    // FIRST generation - create the canonical design
    prompt = `Create a professional slipper design concept based on this template. This will be the CANONICAL DESIGN that will be shown from multiple angles.

CRITICAL SHAPE PRESERVATION RULES:
⚠️ PRESERVE THE EXACT PHYSICAL FORM - DO NOT MODIFY:
1. ✓ Keep the EXACT shoe shape, silhouette, and outline from the template
2. ✓ Maintain the SAME dimensions, proportions, and size
3. ✓ Preserve the EXACT contours, curves, and structural lines
4. ✓ Keep the SAME sole thickness, heel height, and overall structure
5. ✓ DO NOT change the physical form, body shape, or 3D geometry

WHAT YOU CAN MODIFY (SURFACE DESIGN ONLY):
✓ Apply new colors, patterns, and graphic designs to the surface
✓ Change material textures and finishes
✓ Add decorative elements within the existing shape
✓ Incorporate brand logos on the surface
✓ Modify surface aesthetics while keeping the exact shape

DESIGN SPECIFICATIONS:
- Seasonal Theme: ${theme}
- Design Style: ${style}
- Color Palette: ${color}
- Material: ${material}
- View Angle: ${angleDescription}`;

    // Add design description if provided
    if (designDescription && designDescription.trim()) {
      prompt += `\n\nADDITIONAL DESIGN REQUIREMENTS:
${designDescription}`;
    }

    // Add reference image instructions if provided
    if (referenceImageBuffer) {
      prompt += `\n\nSTYLE REFERENCE:
A reference image is provided showing the desired design aesthetic, patterns, colors, or style inspiration. Please incorporate these SURFACE DESIGN elements into the slipper while maintaining the template's EXACT physical shape and structure.`;
    }

    // Add brand logo instructions if provided
    if (brandLogoBuffer) {
      prompt += `\n\nBRAND IDENTITY:
A brand logo is provided. Please tastefully incorporate this logo into the slipper's SURFACE design in an appropriate location (such as the side, heel area, or top surface). The logo should be clearly visible but integrated naturally into the overall design WITHOUT changing the shoe's physical form.`;
    }

    prompt += `\n\nREQUIREMENTS:
1. ✓ PRESERVE the template's EXACT shape, silhouette, and 3D structure
2. ✓ Apply ONLY surface-level changes: colors, patterns, materials, textures
3. ✓ DO NOT alter the shoe's physical dimensions, proportions, or form
4. ✓ Create a photorealistic, high-quality product visualization
5. ✓ The design should look professional and production-ready
6. ✓ Show clear details of surface textures, patterns, and material characteristics
7. ✓ Ensure the ${angle === "top" ? "top surface" : "side and top surfaces"} are clearly visible
8. ✓ Use professional product photography lighting and presentation
9. ✓ Make the design visually appealing for seasonal footwear collections
10. ✓ Create a CONSISTENT design that will look good from multiple angles

CRITICAL REMINDER: Think of this as applying a "skin" or "wrap" to the exact template shape. The underlying 3D form must remain 100% identical to the template. Only the surface appearance changes.

Create a stunning, market-ready slipper design that maintains the exact template shape while showcasing beautiful surface design.`;
  }

  try {
    // Build parts array - order matters for prompt clarity
    const parts: any[] = [{ text: prompt }];

    // CASE 1: Second generation with canonical design
    // Order: canonical design first, then template, then optional images
    if (canonicalDesignBuffer && canonicalDesignMimeType) {
      parts.push({
        inlineData: {
          mimeType: canonicalDesignMimeType,
          data: canonicalDesignBuffer.toString("base64"),
        },
      });
      parts.push({
        inlineData: {
          mimeType,
          data: templateBuffer.toString("base64"),
        },
      });
    } else {
      // CASE 2: First generation (canonical design creation)
      // Order: template first, then optional reference images and logo
      parts.push({
        inlineData: {
          mimeType,
          data: templateBuffer.toString("base64"),
        },
      });

      // Add reference image if provided
      if (referenceImageBuffer && referenceImageMimeType) {
        parts.push({
          inlineData: {
            mimeType: referenceImageMimeType,
            data: referenceImageBuffer.toString("base64"),
          },
        });
      }

      // Add brand logo if provided
      if (brandLogoBuffer && brandLogoMimeType) {
        parts.push({
          inlineData: {
            mimeType: brandLogoMimeType,
            data: brandLogoBuffer.toString("base64"),
          },
        });
      }
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image-preview",
      contents: [
        {
          role: "user",
          parts,
        },
      ],
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
      },
    });

    const candidate = response.candidates?.[0];
    const imagePart = candidate?.content?.parts?.find((part: any) => part.inlineData);

    if (!imagePart?.inlineData?.data) {
      throw new Error("No image data in response from Gemini");
    }

    const resultMimeType = imagePart.inlineData.mimeType || "image/png";
    return `data:${resultMimeType};base64,${imagePart.inlineData.data}`;
  } catch (error: any) {
    if (error.message?.includes("INVALID_ARGUMENT") || error.message?.includes("not valid")) {
      throw new Error("The uploaded image is not valid or supported. Please upload a clear, high-quality slipper template image (PNG or JPG).");
    }
    throw error;
  }
}

export async function generateModelWearingScene(
  slipperImageBuffer: Buffer,
  mimeType: string,
  nationality: string,
  familyCombination: string,
  scenario: string,
  location: string,
  presentationStyle: string
): Promise<string> {
  if (slipperImageBuffer.length < 100) {
    throw new Error("Slipper image is too small or invalid. Please use a valid generated slipper design.");
  }

  const prompt = `Create a professional model-wearing scene showing this slipper design being worn in a realistic setting.

SCENE SPECIFICATIONS:
- Nationality/Ethnicity: ${nationality}
- Family Combination: ${familyCombination}
- Scenario: ${scenario}
- Location: ${location}
- Presentation Style: ${presentationStyle}

REQUIREMENTS:
1. Show the model(s) naturally wearing the exact slipper design from the provided image
2. The slipper should be clearly visible and prominent in the scene
3. Create a realistic, professional photograph that looks authentic
4. Match the specified family combination (show the appropriate people)
5. Capture the atmosphere of the specified scenario and location
6. Use natural, flattering lighting appropriate for ${presentationStyle.toLowerCase()}
7. Show proper foot positioning and natural wearing posture
8. Ensure skin tones, clothing, and setting match the ${nationality} context
9. Make it look like a professional product photography shoot
10. The slipper design must match exactly what was provided

Create a stunning, photorealistic image that demonstrates how beautiful these slippers look when worn in real life.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image-preview",
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType,
                data: slipperImageBuffer.toString("base64"),
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
      },
    });

    const candidate = response.candidates?.[0];
    const imagePart = candidate?.content?.parts?.find((part: any) => part.inlineData);

    if (!imagePart?.inlineData?.data) {
      throw new Error("No image data in response from Gemini");
    }

    const resultMimeType = imagePart.inlineData.mimeType || "image/png";
    return `data:${resultMimeType};base64,${imagePart.inlineData.data}`;
  } catch (error: any) {
    if (error.message?.includes("INVALID_ARGUMENT") || error.message?.includes("not valid")) {
      throw new Error("The slipper image is not valid or supported. Please use a generated slipper design image.");
    }
    throw error;
  }
}
