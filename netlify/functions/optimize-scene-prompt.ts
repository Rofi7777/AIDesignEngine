import type { Handler } from "@netlify/functions";
import { generateOptimizedPrompts } from "../../server/promptOptimizer";

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };
  if (!event.body) return { statusCode: 400, body: "Missing body" };

  try {
    const { sceneType, customSceneType, lighting, customLighting, compositionStyle, customComposition, description } =
      JSON.parse(event.body);

    if (!sceneType || !lighting || !compositionStyle) {
      return { statusCode: 400, body: "Missing required fields for scene prompt optimization" };
    }

    const sceneName = sceneType === "custom" && customSceneType ? customSceneType : sceneType;
    const effectiveLighting = lighting === "custom" && customLighting ? customLighting : lighting;
    const effectiveComposition = compositionStyle === "custom" && customComposition ? customComposition : compositionStyle;

    const designInputs = {
      productType: "custom",
      customProductType: "product",
      theme: `E-commerce scene for ${sceneName}`,
      style: `Lighting: ${effectiveLighting}, Composition: ${effectiveComposition}`,
      color: "As shown in products",
      material: "As shown in products",
      designDescription: description || "",
      hasReferenceImage: false,
      hasBrandLogo: false,
    };

    const modelSceneInputs = {
      productDesignSummary: `Products arranged in ${sceneName} scene with ${effectiveLighting} lighting and ${effectiveComposition} composition.`,
      productType: "custom",
      nationality: "International",
      familyCombination: "Adult",
      scenario: sceneName,
      location: sceneName,
      presentationStyle: "E-commerce lifestyle",
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
    console.error("[Scene Prompt Optimizer API] ❌ Error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to optimize scene prompt",
        message: err.message,
      }),
    };
  }
};
