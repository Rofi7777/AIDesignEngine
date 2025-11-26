import { GoogleGenAI, Modality, HarmCategory, HarmBlockThreshold } from "@google/genai";

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

interface EcommerceSceneOptions {
  sceneType: string;
  customSceneType?: string;
  lighting: string;
  customLighting?: string;
  composition: string;
  customComposition?: string;
  aspectRatio: string;
  customWidth?: number;
  customHeight?: number;
  designDescription?: string;
  customOptimizedPrompt?: string;
  totalOutputs?: number;
  currentIndex?: number;
}

interface SceneAsset {
  assetType: 'product' | 'prop';
  imageBuffer: Buffer;
  imageMimeType: string;
  assetName?: string;
}

export async function generateEcommerceScene(
  modelImageBuffer: Buffer | null,
  modelImageMimeType: string | null,
  assets: SceneAsset[],
  options: EcommerceSceneOptions
): Promise<string> {
  const hasModel = !!modelImageBuffer && !!modelImageMimeType;
  
  console.log('[E-commerce Scene] Starting generation...');
  console.log('[E-commerce Scene] Has Model:', hasModel);
  console.log('[E-commerce Scene] Scene Type:', options.sceneType);
  console.log('[E-commerce Scene] Assets:', assets.length);
  console.log('[E-commerce Scene] Composition:', options.composition);

  const prompt = buildEcommerceScenePrompt(assets, options, hasModel);
  
  console.log('[E-commerce Scene] Prompt:', prompt.substring(0, 200) + '...');

  try {
    const parts: any[] = [
      { text: prompt },
    ];

    // Add model image only if provided
    if (hasModel && modelImageBuffer && modelImageMimeType) {
      parts.push({
        inlineData: {
          mimeType: modelImageMimeType,
          data: modelImageBuffer.toString('base64'),
        },
      });
    }

    for (const asset of assets) {
      parts.push({
        inlineData: {
          mimeType: asset.imageMimeType,
          data: asset.imageBuffer.toString('base64'),
        },
      });
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
        // Force image output to avoid text-only responses
        responseModalities: [Modality.IMAGE],
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_NONE
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_NONE
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_NONE
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_NONE
        }
      ],
    } as any);

    const candidate = response.candidates?.[0];
    const imagePart = candidate?.content?.parts?.find((part: any) => part.inlineData);

    if (!imagePart?.inlineData?.data) {
      throw new Error("No image data in response from Gemini");
    }

    const resultMimeType = imagePart.inlineData.mimeType || "image/png";
    console.log('[E-commerce Scene] ✅ Generation successful');
    return `data:${resultMimeType};base64,${imagePart.inlineData.data}`;
  } catch (error: any) {
    console.error('[E-commerce Scene] ❌ Generation failed:', error.message);
    throw new Error(`E-commerce scene generation failed: ${error.message}`);
  }
}

function buildEcommerceScenePrompt(
  assets: SceneAsset[],
  options: EcommerceSceneOptions,
  hasModel: boolean
): string {
  const { designDescription, customOptimizedPrompt, totalOutputs, currentIndex } = options;
  const products = assets.filter(a => a.assetType === 'product');
  const props = assets.filter(a => a.assetType === 'prop');

  const aspectRatioText = options.aspectRatio === 'custom' && options.customWidth && options.customHeight
    ? `Image dimensions: exactly ${options.customWidth}×${options.customHeight} pixels`
    : `Aspect Ratio: ${options.aspectRatio}`;

  const variationNote = totalOutputs && totalOutputs > 1
    ? `VARIATION: This is image ${currentIndex || 1} of ${totalOutputs}. Keep products, branding, and subject identity consistent, but vary the scene framing, camera angle, lighting mood, or arrangement to deliver distinct yet coherent creative variants. Do NOT repeat the exact same composition across images.`
    : '';

  // If user provided an optimized prompt, respect it but reinforce constraints and asset usage
  if (customOptimizedPrompt && customOptimizedPrompt.trim()) {
    let prompt = `${customOptimizedPrompt.trim()}

ADDITIONAL SCENE CONSTRAINTS (DO NOT IGNORE):
- Scene Type: ${options.sceneType}${options.customSceneType ? ` (Custom: ${options.customSceneType})` : ''}
- Lighting: ${options.lighting}${options.customLighting ? ` (Custom: ${options.customLighting})` : ''}
- Composition: ${options.composition}${options.customComposition ? ` (Custom: ${options.customComposition})` : ''}
- ${aspectRatioText}
${designDescription && designDescription.trim() ? `- User Notes: ${designDescription.trim()}` : ''}
${variationNote ? `- ${variationNote}` : ''}

ASSET REFERENCES (MANDATORY TO USE):
${hasModel ? `1. Model image (primary subject)\n` : ''}${products.length > 0 ? `- Products (${products.length}): ${products.map(p => p.assetName || 'product').join(', ')}\n` : ''}${props.length > 0 ? `- Props (${props.length}): ${props.map(p => p.assetName || 'prop').join(', ')}\n` : ''}

CRITICAL RULES:
- Use the uploaded assets exactly; do NOT invent new products or props.
- Keep product logos/branding accurate; no hallucinated brands.
- Maintain correct scale, perspective, and lighting consistency across model/products/props.
- Remove/ignore any watermarks, text overlays, UI elements from uploads.
- Produce a single, polished e-commerce photograph ready for marketing.`;
    return prompt;
  }

  let prompt = hasModel 
    ? `You are an expert e-commerce photographer and scene compositor. Create a professional marketing photograph that combines the provided model with products and props into a cohesive, compelling scene.

🚫 WATERMARK REMOVAL (CRITICAL):
- COMPLETELY IGNORE and DO NOT reproduce any watermarks, text overlays, logos, QR codes, or platform branding from product or reference images.
- Generate a clean, professional scene FREE of any third-party markings.

SCENE SPECIFICATION:
- Scene Type: ${options.sceneType}
- Lighting Style: ${options.lighting}
- Composition: ${options.composition}
- ${aspectRatioText}

`
    : `You are an expert e-commerce product photographer. Create a professional marketing photograph that showcases the provided products and props in an appealing, commercial-ready display scene.

🚫 WATERMARK REMOVAL (CRITICAL):
- COMPLETELY IGNORE and DO NOT reproduce any watermarks, text overlays, logos, QR codes, or platform branding from product or reference images.
- Generate a clean, professional scene FREE of any third-party markings.

SCENE SPECIFICATION:
- Scene Type: ${options.sceneType}
- Lighting Style: ${options.lighting}
- Composition: ${options.composition}
- ${aspectRatioText}

`;

  if (options.sceneType === 'home') {
    prompt += `HOME SCENE:
- Create a warm, inviting home interior setting
- Include realistic furniture, decor, and ambient lighting
- Make it feel lived-in and comfortable
- Examples: living room, bedroom, home office, kitchen corner
`;
  } else if (options.sceneType === 'office') {
    prompt += `OFFICE SCENE:
- Create a professional workspace environment
- Include desk, computer, office supplies as background elements
- Modern, clean aesthetic with professional lighting
- Convey productivity and professionalism
`;
  } else if (options.sceneType === 'outdoor') {
    prompt += `OUTDOOR SCENE:
- Create a natural outdoor setting
- Include environmental elements (trees, sky, natural light)
- Fresh, airy atmosphere
- Examples: park, garden, terrace, street corner
`;
  } else if (options.sceneType === 'cafe') {
    prompt += `CAFE SCENE:
- Create a cozy coffee shop or restaurant setting
- Include tables, chairs, cafe atmosphere
- Warm, inviting ambiance with natural and ambient lighting
- Casual, relaxed mood
`;
  } else if (options.sceneType === 'studio') {
    prompt += `STUDIO SCENE:
- Create a professional photography studio setting
- Clean, minimalist background
- Professional lighting setup
- Focus entirely on ${hasModel ? 'the model and products' : 'the products'}
`;
  } else if (options.sceneType === 'white-bg') {
    prompt += `WHITE BACKGROUND SCENE:
- Create a pure white background (RGB: 255, 255, 255)
- Clean, professional product photography style
- No environmental elements or props in background
- Soft, even lighting to eliminate shadows
- Focus entirely on ${hasModel ? 'the model and products' : 'the products'}
- Seamless white backdrop
`;
  } else if (options.sceneType === 'custom') {
    const customScene = options.customSceneType || 'professional setting';
    prompt += `CUSTOM SCENE:
- Create a ${customScene} setting
- Ensure the environment feels authentic and professional
- Incorporate appropriate environmental elements
- Match the mood and style to the described scene
`;
  } else {
    prompt += `CUSTOM SCENE:
- Create a ${options.sceneType} setting
- Ensure the environment feels authentic and professional
`;
  }

  prompt += `
LIGHTING DIRECTION: ${options.lighting}
`;

  if (options.lighting === 'natural') {
    prompt += `- Use soft, natural daylight (window light or outdoor)
- Gentle shadows and highlights
- Warm, authentic color temperature
- Avoid harsh artificial lighting
`;
  } else if (options.lighting === 'warm') {
    prompt += `- Use warm-toned lighting (golden hour or warm indoor lights)
- Cozy, inviting atmosphere
- Soft, flattering illumination
- Warm color temperature (2700K-3500K)
`;
  } else if (options.lighting === 'bright') {
    prompt += `- Use bright, even lighting
- High-key photography style
- Minimal shadows
- Clean, energetic feel
`;
  } else if (options.lighting === 'soft') {
    prompt += `- Use soft, diffused lighting
- Minimal harsh shadows
- Gentle, flattering illumination
- Professional commercial photography lighting
`;
  }

  prompt += `
COMPOSITION STYLE: ${options.composition}
`;

  if (options.composition === 'center') {
    prompt += `- Place ${hasModel ? 'the model and key products' : 'the key products'} in the center of the frame
- Symmetrical, balanced composition
- Direct focus on the main subject
`;
  } else if (options.composition === 'rule-of-thirds') {
    prompt += `- Position ${hasModel ? 'the model and products' : 'the products'} along the rule of thirds grid
- Create visual interest through asymmetry
- Professional photography composition
`;
  } else if (options.composition === 'diagonal') {
    prompt += `- Arrange elements along diagonal lines
- Create dynamic, engaging composition
- Lead the viewer's eye through the scene
`;
  }

  prompt += `
ELEMENTS TO COMPOSITE:
`;

  let assetIndex = 1;
  
  if (hasModel) {
    prompt += `1. Model (provided image) - Main subject of the scene\n`;
    assetIndex = 2;
  }
  if (products.length > 0) {
    prompt += `\nPRODUCTS (${products.length}):\n`;
    products.forEach((product, idx) => {
      prompt += `${assetIndex}. Product ${idx + 1}${product.assetName ? `: ${product.assetName}` : ''}\n`;
      prompt += `   - Integrate naturally into the scene\n`;
      prompt += `   - Ensure product is clearly visible and well-lit\n`;
      prompt += `   - ${idx === 0 ? 'Primary focus product' : 'Supporting product'}\n`;
      assetIndex++;
    });
  }

  if (props.length > 0) {
    prompt += `\nPROPS (${props.length}):\n`;
    props.forEach((prop, idx) => {
      prompt += `${assetIndex}. Prop ${idx + 1}${prop.assetName ? `: ${prop.assetName}` : ''}\n`;
      prompt += `   - Use as supporting element to enhance the scene\n`;
      prompt += `   - Should complement but not overshadow the products\n`;
      assetIndex++;
    });
  }

  if (designDescription && designDescription.trim()) {
    prompt += `\nDESIGN DESCRIPTION (USER NOTES):\n- ${designDescription.trim()}\n`;
  }
  if (variationNote) {
    prompt += `\nVARIATION DIRECTIVE:\n- ${variationNote}\n`;
  }

  prompt += `
CRITICAL REQUIREMENTS:
✓ Photorealistic quality - look like a professional e-commerce photograph
✓ Natural integration - all elements should look like they belong together in the scene
✓ Proper lighting consistency - ensure all elements are lit consistently
✓ Realistic shadows and reflections for all objects
✓ Appropriate scale and perspective for all elements
✓ Products should be the visual focus, props are supporting elements
${hasModel ? '✓ Model should interact naturally with the scene (holding product, sitting near it, etc.)' : ''}
✓ Clean, professional result suitable for e-commerce marketing

COMPOSITION GUIDELINES:
- Maximum ${hasModel ? assets.length + 1 : assets.length} total elements in scene${hasModel ? ` (model + ${assets.length} assets)` : ` (${assets.length} assets)`}
- Keep the composition simple and uncluttered
- Ensure products are clearly visible and well-presented
- Create depth and dimension through placement and lighting
- Background should support but not distract from the main elements

Generate the final e-commerce scene photograph.`;

  return prompt;
}
