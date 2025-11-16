// Stage 1: LLM-based Prompt Optimizer
// This service acts as a professional footwear designer with 10+ years of experience
// It transforms structured inputs into optimized prompts for gemini-2.5-flash-image-preview

import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

const DESIGNER_SYSTEM_PROMPT = `You are the core design brain of **Craft AI Studio**.

Role & Expertise:
- You are a senior footwear & fashion product designer with 10+ years of experience.
- You specialize in seasonal collections, trend-driven concepts, and commercial product design.
- You are also an expert AI image prompt engineer who knows how to write precise, visual prompts for gemini-2.5-flash-image-preview.
- You know how to transform a user's template image, shape, and options into detailed, production-ready design prompts.

Goal:
Given a set of structured inputs from the UI (template upload + dropdowns + custom text), you will:
1. Interpret the design intent like a professional seasonal product designer.
2. Turn it into:
   - A clear image prompt for **slipper design generation**.
   - A clear image prompt for **model wearing scene generation**.
3. Always respect the uploaded template shape: DO NOT change the fundamental shape, last, sole thickness, strap position or construction. Only modify graphics, colors, materials, patterns and styling details.

Output format:
You MUST always respond in valid JSON with two main fields:

{
  "slipper_design_prompt": "<string: final prompt for gemini-2.5-flash-image-preview to generate slipper design images>",
  "model_wearing_prompt": "<string: final prompt for gemini-2.5-flash-image-preview to generate model-wearing images>",
  "debug_notes": "<optional string: short design rationale for developers, not sent to the image model>"
}

Design & Prompting Guidelines:

1. Slipper Design Prompt Rules:
   - Explicitly tell the model to:
     - Use the uploaded slipper template as the base shape.
     - Keep the outsole, midsole, and strap positions consistent with the template.
     - Only modify surface graphics, colors, materials, and decorative details.
   - Mention:
     - Season theme
     - Style and pattern direction (graffiti, minimal, sporty, cute, etc.)
     - Color palette and key color names
     - Material feel (matte, glossy, textured, soft foam, etc.)
     - Target user vibe (kids, adults, gender, lifestyle)
   - Ask for TWO angles:
     - A clean **top view** (flat lay, white or neutral background).
     - A **3/4 perspective / 45-degree side view**, showing depth and shape.
   - Be very clear that background should be simple and not distract from the slipper.

2. Model Wearing Prompt Rules:
   - Start by briefly summarizing the slipper design:
     - colors, patterns, style, and overall vibe.
   - Instruct the model to:
     - Apply THIS EXACT slipper design onto the model's feet.
     - Make sure the slipper is clearly visible and consistent with the design.
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
1) slipper design generation;
2) model wearing scene generation.`;

export interface DesignInputs {
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
  slipperDesignSummary: string;
  nationality: string;
  familyCombination: string;
  scenario: string;
  location: string;
  presentationStyle: string;
}

export interface OptimizedPrompts {
  slipper_design_prompt: string;
  model_wearing_prompt: string;
  debug_notes?: string;
}

export async function generateOptimizedPrompts(
  designInputs: DesignInputs,
  modelSceneInputs: ModelSceneInputs
): Promise<OptimizedPrompts> {
  // Build structured input for the LLM
  const structuredInput = `Please generate optimized image prompts based on the following inputs:

SLIPPER DESIGN INPUTS:
- Season Theme: ${designInputs.theme}
- Style Direction: ${designInputs.style}
- Color Palette: ${designInputs.color}
- Material: ${designInputs.material}
${designInputs.designDescription ? `- Custom Design Notes: ${designInputs.designDescription}` : ''}
${designInputs.hasReferenceImage ? '- Reference Image: Provided (use for style inspiration)' : ''}
${designInputs.hasBrandLogo ? '- Brand Logo: Provided (incorporate into design)' : ''}
${designInputs.templateDescription ? `- Template Description: ${designInputs.templateDescription}` : ''}

MODEL WEARING SCENE INPUTS:
- Slipper Design Summary: ${modelSceneInputs.slipperDesignSummary}
- Nationality/Ethnicity: ${modelSceneInputs.nationality}
- Family Group: ${modelSceneInputs.familyCombination}
- Scenario: ${modelSceneInputs.scenario}
- Location: ${modelSceneInputs.location}
- Presentation Style: ${modelSceneInputs.presentationStyle}

Please provide your response as valid JSON with the following structure:
{
  "slipper_design_prompt": "<optimized prompt for slipper design generation>",
  "model_wearing_prompt": "<optimized prompt for model wearing scene>",
  "debug_notes": "<optional design rationale>"
}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: DESIGNER_SYSTEM_PROMPT },
            { text: structuredInput }
          ],
        },
      ],
    });

    const textContent = response.text;
    
    if (!textContent) {
      throw new Error("No text content in LLM response");
    }
    
    // Extract JSON from the response (handle markdown code blocks if present)
    let jsonText = textContent;
    const jsonMatch = textContent.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (jsonMatch && jsonMatch[1]) {
      jsonText = jsonMatch[1];
    }

    const optimizedPrompts: OptimizedPrompts = JSON.parse(jsonText.trim());
    
    // Validate the response structure
    if (!optimizedPrompts.slipper_design_prompt || !optimizedPrompts.model_wearing_prompt) {
      throw new Error("LLM response missing required prompt fields");
    }

    return optimizedPrompts;
  } catch (error: any) {
    console.error("Error generating optimized prompts:", error);
    // Fallback to basic prompts if LLM fails
    return {
      slipper_design_prompt: generateFallbackSlipperPrompt(designInputs),
      model_wearing_prompt: generateFallbackModelPrompt(modelSceneInputs),
      debug_notes: `Fallback prompts used due to LLM error: ${error.message}`
    };
  }
}

// Fallback prompt generator if LLM fails
function generateFallbackSlipperPrompt(inputs: DesignInputs): string {
  return `Create a professional slipper design based on the template.
Season: ${inputs.theme}
Style: ${inputs.style}
Colors: ${inputs.color}
Material: ${inputs.material}
${inputs.designDescription ? `Notes: ${inputs.designDescription}` : ''}
Create both top view and 45-degree angled view with professional product photography lighting.`;
}

function generateFallbackModelPrompt(inputs: ModelSceneInputs): string {
  return `Create a professional model-wearing scene showing the slipper design.
Design: ${inputs.slipperDesignSummary}
Models: ${inputs.nationality} ${inputs.familyCombination}
Setting: ${inputs.location}
Scenario: ${inputs.scenario}
Style: ${inputs.presentationStyle}
Show realistic, professional product photography.`;
}
