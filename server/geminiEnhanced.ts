// Enhanced Gemini service with two-stage architecture:
// Stage 1: LLM generates optimized prompts (professional designer)
// Stage 2: Use optimized prompts with gemini-2.5-flash-image-preview

import { GoogleGenAI, Modality } from "@google/genai";
import { generateOptimizedPrompts, type DesignInputs, type ModelSceneInputs } from "./promptOptimizer";

const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

export async function generateSlipperDesignEnhanced(
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

  let prompt = "";

  // CRITICAL: If canonicalDesignBuffer is provided, this is the SECOND generation
  // We use CONSISTENCY-FOCUSED prompts, not the LLM optimizer
  if (canonicalDesignBuffer) {
    const angleDescription = angle === "top" 
      ? "top-down view showing the upper surface of the slipper" 
      : "45-degree angled view showing both the top and side profile of the slipper";

    // For second generation (45° view), use strict consistency prompts
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
    // FIRST generation - Use LLM to generate optimized professional prompt
    console.log("Stage 1: Generating optimized prompt using professional designer LLM...");
    
    const designInputs: DesignInputs = {
      theme,
      style,
      color,
      material,
      designDescription,
      hasReferenceImage: !!referenceImageBuffer,
      hasBrandLogo: !!brandLogoBuffer,
    };

    // Generate a placeholder model scene input (will be used properly in model wearing function)
    const modelSceneInputs: ModelSceneInputs = {
      slipperDesignSummary: `${style} style ${theme} themed slippers in ${color} colors with ${material} materials`,
      nationality: "International",
      familyCombination: "Adult",
      scenario: "Casual wear",
      location: "Studio",
      presentationStyle: "Product mockup",
    };

    try {
      const optimizedPrompts = await generateOptimizedPrompts(designInputs, modelSceneInputs);
      console.log("Stage 1 complete: Professional prompt generated");
      console.log("Debug notes:", optimizedPrompts.debug_notes);
      
      // Use the optimized slipper design prompt
      prompt = optimizedPrompts.slipper_design_prompt;
      
      // Add critical shape preservation rules
      prompt += `\n\nCRITICAL SHAPE PRESERVATION RULES:
⚠️ PRESERVE THE EXACT PHYSICAL FORM - DO NOT MODIFY:
1. ✓ Keep the EXACT shoe shape, silhouette, and outline from the template
2. ✓ Maintain the SAME dimensions, proportions, and size
3. ✓ Preserve the EXACT contours, curves, and structural lines
4. ✓ Keep the SAME sole thickness, heel height, and overall structure
5. ✓ DO NOT change the physical form, body shape, or 3D geometry

View angle: Create a ${angle === "top" ? "top-down view showing the upper surface" : "45-degree angled view showing both top and side profile"} of the slipper.

REMEMBER: Think of this as applying a "skin" or "wrap" to the exact template shape. The underlying 3D form must remain 100% identical to the template. Only the surface appearance changes.`;

    } catch (error) {
      console.error("Stage 1 failed, using fallback prompt:", error);
      // Fallback to basic prompt if LLM optimizer fails
      const angleDescription = angle === "top" 
        ? "top-down view showing the upper surface of the slipper" 
        : "45-degree angled view showing both the top and side profile of the slipper";

      prompt = `Create a professional slipper design concept based on this template.

CRITICAL SHAPE PRESERVATION RULES:
⚠️ PRESERVE THE EXACT PHYSICAL FORM - DO NOT MODIFY:
1. ✓ Keep the EXACT shoe shape, silhouette, and outline from the template
2. ✓ Maintain the SAME dimensions, proportions, and size
3. ✓ Preserve the EXACT contours, curves, and structural lines
4. ✓ Keep the SAME sole thickness, heel height, and overall structure
5. ✓ DO NOT change the physical form, body shape, or 3D geometry

DESIGN SPECIFICATIONS:
- Seasonal Theme: ${theme}
- Design Style: ${style}
- Color Palette: ${color}
- Material: ${material}
- View Angle: ${angleDescription}`;

      if (designDescription && designDescription.trim()) {
        prompt += `\n- Design Notes: ${designDescription}`;
      }
    }
  }

  try {
    console.log("Stage 2: Generating image with gemini-2.5-flash-image-preview...");
    
    // Build parts array - order matters for prompt clarity
    const parts: any[] = [{ text: prompt }];

    // CASE 1: Second generation with canonical design
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
      // CASE 2: First generation with LLM-optimized prompt
      parts.push({
        inlineData: {
          mimeType,
          data: templateBuffer.toString("base64"),
        },
      });

      if (referenceImageBuffer && referenceImageMimeType) {
        parts.push({
          inlineData: {
            mimeType: referenceImageMimeType,
            data: referenceImageBuffer.toString("base64"),
          },
        });
      }

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
      model: "gemini-2.5-flash-image",
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
    console.log("Stage 2 complete: Image generated successfully");
    return `data:${resultMimeType};base64,${imagePart.inlineData.data}`;
  } catch (error: any) {
    if (error.message?.includes("INVALID_ARGUMENT") || error.message?.includes("not valid")) {
      throw new Error("The uploaded image is not valid or supported. Please upload a clear, high-quality slipper template image (PNG or JPG).");
    }
    throw error;
  }
}

export async function generateModelWearingSceneEnhanced(
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

  console.log("Stage 1: Generating optimized model wearing prompt using professional designer LLM...");
  
  const designInputs: DesignInputs = {
    theme: "Seasonal",
    style: "Professional",
    color: "As shown in design",
    material: "As shown in design",
  };

  const modelSceneInputs: ModelSceneInputs = {
    slipperDesignSummary: "The provided slipper design with its exact colors, patterns, and materials",
    nationality,
    familyCombination,
    scenario,
    location,
    presentationStyle,
  };

  let prompt = "";
  
  try {
    const optimizedPrompts = await generateOptimizedPrompts(designInputs, modelSceneInputs);
    console.log("Stage 1 complete: Professional model wearing prompt generated");
    console.log("Debug notes:", optimizedPrompts.debug_notes);
    
    prompt = optimizedPrompts.model_wearing_prompt;
    
  } catch (error) {
    console.error("Stage 1 failed, using fallback model wearing prompt:", error);
    // Fallback prompt
    prompt = `Create a professional model-wearing scene showing this slipper design being worn in a realistic setting.

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
10. The slipper design must match exactly what was provided`;
  }

  try {
    console.log("Stage 2: Generating model wearing scene with gemini-2.5-flash-image-preview...");
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
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
    console.log("Stage 2 complete: Model wearing scene generated successfully");
    return `data:${resultMimeType};base64,${imagePart.inlineData.data}`;
  } catch (error: any) {
    if (error.message?.includes("INVALID_ARGUMENT") || error.message?.includes("not valid")) {
      throw new Error("The slipper image is not valid or supported. Please use a generated slipper design image.");
    }
    throw error;
  }
}
