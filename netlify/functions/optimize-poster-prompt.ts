import type { Handler } from "@netlify/functions";
import { generateOptimizedPrompts } from "../../server/promptOptimizer";

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };
  if (!event.body) return { statusCode: 400, body: "Missing body" };

  try {
    // Reuse prompt optimizer to get a strong text prompt; adapt fields as needed
    const { campaignType, visualStyle, backgroundScene, layout, aspectRatio, description } = JSON.parse(event.body);

    if (!campaignType || !visualStyle || !backgroundScene || !layout || !aspectRatio) {
      return { statusCode: 400, body: "Missing required fields for poster prompt optimization" };
    }

    const designInputs = {
      productType: "custom",
      customProductType: "poster",
      theme: campaignType,
      style: visualStyle,
      color: "As shown in products",
      material: "N/A",
      designDescription: description || "",
      hasReferenceImage: false,
      hasBrandLogo: false,
      templateDescription: `Background: ${backgroundScene}, Layout: ${layout}, Aspect: ${aspectRatio}`,
    };

    const modelSceneInputs = {
      productDesignSummary: `Poster campaign: ${campaignType}, style ${visualStyle}, background ${backgroundScene}, layout ${layout}, aspect ${aspectRatio}`,
      productType: "custom",
      nationality: "International",
      familyCombination: "N/A",
      scenario: "Poster design",
      location: "Studio",
      presentationStyle: "Poster design",
    };

    const optimizedPrompts = await generateOptimizedPrompts(designInputs as any, modelSceneInputs as any);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        optimizedPrompt: optimizedPrompts.product_design_prompt,
        debugNotes: optimizedPrompts.debug_notes,
      }),
    };
  } catch (err: any) {
    console.error("[Poster Prompt Optimizer API] ❌ Error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to optimize poster prompt",
        message: err.message,
      }),
    };
  }
};
