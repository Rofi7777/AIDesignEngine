import type { Handler } from "@netlify/functions";
import { generateOptimizedPrompts } from "../../server/promptOptimizer";

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }
  if (!event.body) {
    return { statusCode: 400, body: "Missing body" };
  }

  try {
    const { tryonType, customTryonType, tryonMode, description } = JSON.parse(event.body);

    if (!tryonType || !tryonMode) {
      return { statusCode: 400, body: "Missing required fields for virtual try-on prompt optimization" };
    }

    const productName = tryonType === "custom" && customTryonType ? customTryonType : tryonType;

    const designInputs = {
      productType: tryonType,
      customProductType: customTryonType,
      theme: `Virtual try-on for ${productName}`,
      style: `${tryonMode} mode`,
      color: "Natural product colors",
      material: "Natural materials",
      designDescription: description || "",
      hasReferenceImage: false,
      hasBrandLogo: false,
    };

    const modelSceneInputs = {
      productDesignSummary: `Virtual try-on visualization for ${productName} in ${tryonMode} mode`,
      productType: tryonType,
      nationality: "International",
      familyCombination: "Adult",
      scenario: "Virtual try-on",
      location: "Studio",
      presentationStyle: "Professional fashion photography",
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
    console.error("[Virtual Try-on Prompt Optimizer API] ❌ Error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to optimize virtual try-on prompt",
        message: err.message,
      }),
    };
  }
};
