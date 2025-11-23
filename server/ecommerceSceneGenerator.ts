import { GoogleGenAI, Modality } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

interface EcommerceSceneOptions {
  sceneType: string;
  customSceneType?: string;
  lighting: string;
  composition: string;
  aspectRatio: string;
  customWidth?: number;
  customHeight?: number;
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
  const products = assets.filter(a => a.assetType === 'product');
  const props = assets.filter(a => a.assetType === 'prop');

  const aspectRatioText = options.aspectRatio === 'custom' && options.customWidth && options.customHeight
    ? `Image dimensions: exactly ${options.customWidth}×${options.customHeight} pixels`
    : `Aspect Ratio: ${options.aspectRatio}`;

  let prompt = hasModel 
    ? `You are an expert e-commerce photographer and scene compositor. Create a professional marketing photograph that combines the provided model with products and props into a cohesive, compelling scene.

SCENE SPECIFICATION:
- Scene Type: ${options.sceneType}
- Lighting Style: ${options.lighting}
- Composition: ${options.composition}
- ${aspectRatioText}

`
    : `You are an expert e-commerce product photographer. Create a professional marketing photograph that showcases the provided products and props in an appealing, commercial-ready display scene.

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
