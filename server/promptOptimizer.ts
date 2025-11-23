// Stage 1: LLM-based Prompt Optimizer
// This service acts as a professional fashion product designer with 10+ years of experience
// It transforms structured inputs into optimized prompts for gemini-3-pro-image-preview

import { GoogleGenAI } from "@google/genai";
import { ProductType, getProductConfig } from "../shared/productConfig";

const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

function buildDesignerSystemPrompt(productType: ProductType, customProductType?: string): string {
  const config = getProductConfig(productType);
  const productName = productType === 'custom' && customProductType ? customProductType : config.displayName.en.toLowerCase();
  const expertise = config.designerExpertise;
  const anglesList = config.angles.map((a, i) => config.angleLabels[a].en).join(' and ');
  
  return `You are the core design brain of **Craft AI Studio**.

Role & Expertise:
- You are a senior fashion product designer with 10+ years of experience in ${expertise}.
- You specialize in seasonal collections, trend-driven concepts, and commercial product design.
- You are also an expert AI image prompt engineer who knows how to write precise, visual prompts for gemini-3-pro-image-preview.
- You know how to transform a user's template image, shape, and options into detailed, production-ready design prompts.

Goal:
Given a set of structured inputs from the UI (template upload + dropdowns + custom text), you will:
1. Interpret the design intent like a professional seasonal product designer.
2. Turn it into:
   - A clear image prompt for **${productName} design generation**.
   - A clear image prompt for **model wearing/using scene generation**.
3. Always respect the uploaded template shape: ${config.shapePreservationRules}

Output format:
You MUST always respond in valid JSON with two main fields:

{
  "product_design_prompt": "<string: final prompt for gemini-3-pro-image-preview to generate ${productName} design images>",
  "model_scene_prompt": "<string: final prompt for gemini-3-pro-image-preview to generate model wearing/using scene>",
  "debug_notes": "<optional string: short design rationale for developers, not sent to the image model>"
}

Design & Prompting Guidelines:

1. ${productName.charAt(0).toUpperCase() + productName.slice(1)} Design Prompt Rules:
   - Explicitly tell the model to:
     - Use the uploaded ${productName} template as the base shape.
     - ${config.shapePreservationRules}
   - Focus on these design areas:
${config.designFocusAreas.map(area => `     - ${area}`).join('\n')}
   - Ask for TWO angles/views:
     - ${anglesList}
   - Be very clear that background should be simple and not distract from the ${productName}.

2. Model Scene Prompt Rules:
   - Start by briefly summarizing the ${productName} design:
     - colors, patterns, style, and overall vibe.
   - Instruct the model to:
     - ${config.modelSceneContext}
     - Make sure the ${productName} is clearly visible and consistent with the design.
   - Add:
     - Nationality and group type
     - Location and scenario
     - Presentation style:
       - If "Realistic photography": use terms like "high-quality fashion photo, natural lighting, realistic skin and fabric".
       - If "Product mockup": use terms like "studio lighting, clean background, product-focused".
       - If custom: incorporate the designer's text naturally.
   - Emphasize:
     - Realistic proportions and anatomy.
     - Natural lighting and shadows.
     - No distortion or bizarre angles.

3. Writing Style for Prompts:
   - Use concise, visual English.
   - Prefer concrete visual terms over vague adjectives.
   - Avoid long storytelling; focus on how the image should look.
   - Do NOT mention Gemini, AI, or prompts inside the prompt content itself.
   - Do NOT include JSON or quotes inside the prompt strings you return.

If some UI fields are empty, intelligently ignore them and still generate a strong, consistent prompt.

Your main responsibility:
Turn structured options + template into two excellent, production-quality image prompts for:
1) ${productName} design generation;
2) model wearing/using scene generation.`;
}

export interface DesignInputs {
  productType: ProductType;
  customProductType?: string;
  templateDescription?: string;
  theme: string;
  style: string;
  color: string;
  material: string;
  designDescription?: string;
  hasReferenceImage?: boolean;
  hasBrandLogo?: boolean;
}

export interface ModelSceneInputs {
  productDesignSummary: string;
  productType: ProductType;
  nationality: string;
  familyCombination: string;
  scenario: string;
  location: string;
  presentationStyle: string;
}

export interface OptimizedPrompts {
  product_design_prompt: string;
  model_scene_prompt: string;
  debug_notes?: string;
}

export async function generateOptimizedPrompts(
  designInputs: DesignInputs,
  modelSceneInputs: ModelSceneInputs
): Promise<OptimizedPrompts> {
  const config = getProductConfig(designInputs.productType);
  const productName = designInputs.productType === 'custom' && designInputs.customProductType 
    ? designInputs.customProductType 
    : config.displayName.en;
  
  // Build structured input for the LLM
  const structuredInput = `Please generate optimized image prompts based on the following inputs:

PRODUCT DESIGN INPUTS:
- Product Type: ${productName}
- Season Theme: ${designInputs.theme}
- Style Direction: ${designInputs.style}
- Color Palette: ${designInputs.color}
- Material: ${designInputs.material}
${designInputs.designDescription ? `- Custom Design Notes: ${designInputs.designDescription}` : ''}
${designInputs.hasReferenceImage ? '- Reference Image: Provided (use for style inspiration)' : ''}
${designInputs.hasBrandLogo ? '- Brand Logo: Provided (incorporate into design)' : ''}
${designInputs.templateDescription ? `- Template Description: ${designInputs.templateDescription}` : ''}

MODEL SCENE INPUTS:
- Product Design Summary: ${modelSceneInputs.productDesignSummary}
- Nationality/Ethnicity: ${modelSceneInputs.nationality}
- Family Group: ${modelSceneInputs.familyCombination}
- Scenario: ${modelSceneInputs.scenario}
- Location: ${modelSceneInputs.location}
- Presentation Style: ${modelSceneInputs.presentationStyle}

Please provide your response as valid JSON with the following structure:
{
  "product_design_prompt": "<optimized prompt for ${productName.toLowerCase()} design generation>",
  "model_scene_prompt": "<optimized prompt for model wearing/using scene>",
  "debug_notes": "<optional design rationale>"
}`;

  try {
    console.log(`[Prompt Optimizer] Calling Gemini 3 Pro text model for ${productName} design prompt generation...`);
    
    // Build product-specific system prompt
    const systemPrompt = buildDesignerSystemPrompt(designInputs.productType, designInputs.customProductType);
    
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: [
        {
          role: "user",
          parts: [
            { text: systemPrompt },
            { text: structuredInput }
          ],
        },
      ],
    });

    console.log("[Prompt Optimizer] LLM response received, extracting text...");
    
    // Check response structure first
    if (!response.candidates || response.candidates.length === 0) {
      throw new Error("No candidates in LLM response");
    }
    
    const textContent = response.text;
    console.log("[Prompt Optimizer] Text content length:", textContent?.length || 0);
    
    if (!textContent || textContent.trim().length === 0) {
      console.error("[Prompt Optimizer] Empty response from LLM, candidates:", JSON.stringify(response.candidates, null, 2));
      throw new Error("Empty text content in LLM response (possible safety filter)");
    }
    
    console.log("[Prompt Optimizer] Raw LLM response (first 500 chars):", textContent.substring(0, 500));
    
    // Extract JSON from the response (handle markdown code blocks if present)
    let jsonText = textContent;
    const jsonMatch = textContent.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (jsonMatch && jsonMatch[1]) {
      console.log("[Prompt Optimizer] Found JSON in markdown code block");
      jsonText = jsonMatch[1];
    }

    console.log("[Prompt Optimizer] Parsing JSON response...");
    let optimizedPrompts: OptimizedPrompts;
    try {
      optimizedPrompts = JSON.parse(jsonText.trim());
    } catch (parseError: any) {
      console.error("[Prompt Optimizer] JSON parse error:", parseError.message);
      console.error("[Prompt Optimizer] Attempted to parse:", jsonText.substring(0, 1000));
      throw new Error(`Failed to parse LLM response as JSON: ${parseError.message}`);
    }
    
    // Validate the response structure
    if (!optimizedPrompts.product_design_prompt || !optimizedPrompts.model_scene_prompt) {
      throw new Error("LLM response missing required prompt fields");
    }

    console.log("[Prompt Optimizer] ✓ Successfully generated optimized prompts");
    console.log("[Prompt Optimizer] Product design prompt length:", optimizedPrompts.product_design_prompt.length);
    console.log("[Prompt Optimizer] Model scene prompt length:", optimizedPrompts.model_scene_prompt.length);
    
    return optimizedPrompts;
  } catch (error: any) {
    console.error("[Prompt Optimizer] ✗ Error generating optimized prompts:", error.message);
    console.error("[Prompt Optimizer] Error stack:", error.stack);
    // Fallback to basic prompts if LLM fails
    console.log("[Prompt Optimizer] Using fallback prompts");
    return {
      product_design_prompt: generateFallbackProductPrompt(designInputs),
      model_scene_prompt: generateFallbackModelPrompt(modelSceneInputs),
      debug_notes: `Fallback prompts used due to LLM error: ${error.message}`
    };
  }
}

// Fallback prompt generator if LLM fails
function generateFallbackProductPrompt(inputs: DesignInputs): string {
  const config = getProductConfig(inputs.productType);
  const productName = inputs.productType === 'custom' && inputs.customProductType 
    ? inputs.customProductType 
    : config.displayName.en.toLowerCase();
  const angles = config.angles.map(a => config.angleLabels[a].en).join(' and ');
  
  return `Create a professional ${productName} design based on the template.
Season: ${inputs.theme}
Style: ${inputs.style}
Colors: ${inputs.color}
Material: ${inputs.material}
${inputs.designDescription ? `Notes: ${inputs.designDescription}` : ''}
Create both ${angles} with professional product photography lighting.`;
}

function generateFallbackModelPrompt(inputs: ModelSceneInputs): string {
  const config = getProductConfig(inputs.productType);
  const productName = config.displayName.en.toLowerCase();
  
  return `Create a professional model scene showing the ${productName} design.
Design: ${inputs.productDesignSummary}
Models: ${inputs.nationality} ${inputs.familyCombination}
Setting: ${inputs.location}
Scenario: ${inputs.scenario}
Style: ${inputs.presentationStyle}
Show realistic, professional product photography with the ${productName} clearly visible.`;
}
