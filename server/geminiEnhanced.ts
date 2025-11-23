// Enhanced Gemini service with three-stage architecture:
// Stage 1: LLM generates optimized prompts (professional designer)
// Stage 2: Use optimized prompts with gemini-2.5-flash-image
// Stage 3: Extract structured design spec from canonical design (for consistency)

import { GoogleGenAI, Modality } from "@google/genai";
import { generateOptimizedPrompts, type DesignInputs, type ModelSceneInputs } from "./promptOptimizer";
import { ProductType, getProductConfig } from "../shared/productConfig";
import { extractDesignSpecification, createConsistencyPrompt, type DesignSpecification } from "./designSpecExtractor";

const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

export async function generateProductDesignEnhanced(
  productType: ProductType,
  customProductType: string | undefined,
  templateBuffer: Buffer,
  mimeType: string,
  theme: string,
  style: string,
  color: string,
  material: string,
  angle: string,
  referenceImageBuffer?: Buffer,
  referenceImageMimeType?: string,
  brandLogoBuffer?: Buffer,
  brandLogoMimeType?: string,
  designDescription?: string,
  canonicalDesignBuffer?: Buffer,
  canonicalDesignMimeType?: string,
  designSpecification?: DesignSpecification,
  customOptimizedPrompt?: string
): Promise<string> {
  if (templateBuffer.length < 100) {
    throw new Error("Image file is too small or invalid. Please upload a valid product template image.");
  }
  
  const config = getProductConfig(productType);
  const productName = productType === 'custom' && customProductType ? customProductType : config.displayName.en;
  const angleLabel = config.angleLabels[angle]?.en || angle;

  let prompt = "";

  // CRITICAL: If canonicalDesignBuffer is provided, this is NOT the first generation
  // Use structured design specification for MAXIMUM consistency
  if (canonicalDesignBuffer && designSpecification) {
    // Use the structured design specification for ultra-strict consistency
    prompt = createConsistencyPrompt(designSpecification, angleLabel);
    
    // Add product-specific context
    prompt += `\n\n📋 DESIGN PARAMETERS (Reference Only):
- Product: ${productName}
- Theme: ${theme}
- Style: ${style}
- Base Colors: ${color}
- Material: ${material}`;

    if (designDescription && designDescription.trim()) {
      prompt += `\n- Design Notes: ${designDescription}`;
    }

    prompt += `\n\n🎯 FINAL INSTRUCTION:
Generate a ${angleLabel} view of this ${productName} that PERFECTLY matches the design specification above.
Use the provided canonical design image as your visual reference.
Use the template image to maintain the correct product shape and structure.`;

  } else if (customOptimizedPrompt && customOptimizedPrompt.trim()) {
    // User provided a custom optimized prompt - use it directly
    console.log(`Using user-provided optimized prompt for ${productName}...`);
    prompt = customOptimizedPrompt;
      
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

  } else {
    // FIRST generation - Use LLM to generate optimized professional prompt
    console.log(`Stage 1: Generating optimized prompt for ${productName} using professional designer LLM...`);
    
    const designInputs: DesignInputs = {
      productType,
      customProductType,
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
      productDesignSummary: `${style} style ${theme} themed ${productName.toLowerCase()} in ${color} colors with ${material} materials`,
      productType,
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
      
      // Use the optimized product design prompt
      prompt = optimizedPrompts.product_design_prompt;
      
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
    console.log("Stage 2: Generating image with gemini-2.5-flash-image...");
    
    // Build parts array - order matters for prompt clarity
    const parts: any[] = [{ text: prompt }];

    // CASE 1: Second generation with canonical design
    if (canonicalDesignBuffer && canonicalDesignMimeType) {
      // Add canonical design as PRIMARY visual reference
      parts.push({
        inlineData: {
          mimeType: canonicalDesignMimeType,
          data: canonicalDesignBuffer.toString("base64"),
        },
      });
      // Add template for shape preservation
      parts.push({
        inlineData: {
          mimeType,
          data: templateBuffer.toString("base64"),
        },
      });
      
      // CRITICAL: Also include reference image and logo for consistency
      // These provide additional design context that canonical alone may not capture
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

export async function generateModelSceneEnhanced(
  productType: ProductType,
  customProductType: string | undefined,
  productImageBuffer: Buffer,
  mimeType: string,
  nationality: string,
  familyCombination: string,
  scenario: string,
  location: string,
  presentationStyle: string,
  viewAngle?: string
): Promise<string> {
  if (productImageBuffer.length < 100) {
    throw new Error("Product image is too small or invalid. Please use a valid generated product design.");
  }
  
  const config = getProductConfig(productType);
  const productName = productType === 'custom' && customProductType ? customProductType : config.displayName.en;

  const angleInfo = viewAngle ? ` (${viewAngle})` : '';
  console.log(`Stage 1: Generating optimized model scene prompt for ${productName}${angleInfo} using professional designer LLM...`);
  
  const designInputs: DesignInputs = {
    productType,
    customProductType,
    theme: "Seasonal",
    style: "Professional",
    color: "As shown in design",
    material: "As shown in design",
  };

  const modelSceneInputs: ModelSceneInputs = {
    productDesignSummary: `The provided ${productName.toLowerCase()} design with its exact colors, patterns, and materials`,
    productType,
    nationality,
    familyCombination,
    scenario,
    location,
    presentationStyle,
  };

  // Map view angles to specific camera instructions
  const getViewAngleInstruction = (angle?: string): string => {
    if (!angle) return "";
    
    const normalized = angle.toLowerCase().trim();
    
    // Support multiple languages
    if (normalized.includes('front') || normalized.includes('正面') || normalized.includes('mặt trước')) {
      return "\n\nCAMERA ANGLE: Front-facing view. The model should be photographed from directly in front, showing their face and front of the body clearly. This is a standard portrait orientation.";
    }
    if (normalized.includes('back') || normalized.includes('背面') || normalized.includes('phía sau')) {
      return "\n\nCAMERA ANGLE: Back view. The model should be photographed from directly behind, showing the back of their head, back, and rear view. The model's face should NOT be visible - only their back side should be shown.";
    }
    if (normalized.includes('side') || normalized.includes('側面') || normalized.includes('bên')) {
      return "\n\nCAMERA ANGLE: Side profile view. The model should be photographed from exactly 90 degrees to the side, showing a true profile view. Only one side of the face and body should be visible.";
    }
    if (normalized.includes('45') || normalized.includes('three-quarter') || normalized.includes('3/4')) {
      return "\n\nCAMERA ANGLE: Three-quarter view (45-degree angle). The model should be photographed from a 45-degree angle, showing both the front and one side partially.";
    }
    
    // Fallback for custom angles
    return `\n\nCAMERA ANGLE: ${angle}. Position the camera to capture this specific viewing angle as requested.`;
  };

  let prompt = "";
  
  try {
    const optimizedPrompts = await generateOptimizedPrompts(designInputs, modelSceneInputs);
    console.log("Stage 1 complete: Professional model scene prompt generated");
    console.log("Debug notes:", optimizedPrompts.debug_notes);
    
    prompt = optimizedPrompts.model_scene_prompt;
    
    // Append view angle instruction to optimized prompt
    const angleInstruction = getViewAngleInstruction(viewAngle);
    if (angleInstruction) {
      prompt += angleInstruction;
      console.log(`Added camera angle instruction for: ${viewAngle}`);
    }
    
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
${viewAngle ? `- Camera View/Angle: ${viewAngle}` : ''}

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
${viewAngle ? `11. IMPORTANT: Capture the scene from the ${viewAngle} perspective` : ''}`;
  }

  try {
    console.log("Stage 2: Generating model wearing scene with gemini-2.5-flash-image...");
    
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
                data: productImageBuffer.toString("base64"),
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
