import type { Handler } from "@netlify/functions";
import { generateOptimizedPrompts } from "../../server/promptOptimizer";

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };
  if (!event.body) return { statusCode: 400, body: "Missing body" };

  try {
    const { productType, customProductType, nationality, familyCombination, scenario, location, presentationStyle } =
      JSON.parse(event.body);

    if (!productType || !nationality || !familyCombination || !scenario || !location || !presentationStyle) {
      return { statusCode: 400, body: "Missing required fields for model prompt optimization" };
    }

    const designInputs = {
      productType,
      customProductType,
      theme: "Model wearing scene",
      style: "Model wearing scene",
      color: "As shown in design",
      material: "As shown in design",
      designDescription: "",
      hasReferenceImage: false,
      hasBrandLogo: false,
    };

    const modelSceneInputs = {
      productDesignSummary: `Model wearing ${customProductType || productType}`,
      productType,
      nationality,
      familyCombination,
      scenario,
      location,
      presentationStyle,
    };

    const optimizedPrompts = await generateOptimizedPrompts(designInputs as any, modelSceneInputs as any);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        optimizedPrompt: optimizedPrompts.model_scene_prompt,
        debugNotes: optimizedPrompts.debug_notes,
      }),
    };
  } catch (err: any) {
    console.error("[Model Prompt Optimizer API] ❌ Error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to optimize model prompt",
        message: err.message,
      }),
    };
  }
};
