import type { Handler } from "@netlify/functions";
import { generateOptimizedPrompts } from "../../server/promptOptimizer";
import { getProductConfig } from "../../shared/productConfig";

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };
  if (!event.body) return { statusCode: 400, body: "Missing body" };

  try {
    const { productType, customProductType, theme, style, color, material, designDescription } = JSON.parse(event.body);

    if (!productType || !theme || !style || !color || !material) {
      return { statusCode: 400, body: "Missing required fields for prompt optimization" };
    }

    const config = (() => {
      try {
        return getProductConfig(productType as any);
      } catch {
        return {
          displayName: { en: customProductType || productType || "product" },
          designerExpertise: "fashion design",
        } as any;
      }
    })();
    const productName =
      productType === "custom" && customProductType ? customProductType : config.displayName?.en || "product";

    const designInputs = {
      productType,
      customProductType,
      theme,
      style,
      color,
      material,
      designDescription,
      hasReferenceImage: false,
      hasBrandLogo: false,
    };

    const modelSceneInputs = {
      productDesignSummary: `${style} style ${theme} themed ${productName} in ${color} colors with ${material} materials`,
      productType,
      nationality: "International",
      familyCombination: "Adult",
      scenario: "Casual wear",
      location: "Studio",
      presentationStyle: "Product mockup",
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
    console.error("[Prompt Optimizer API] ❌ Error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to optimize design prompt",
        message: err.message,
      }),
    };
  }
};
