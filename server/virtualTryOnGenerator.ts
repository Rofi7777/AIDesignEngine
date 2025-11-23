import { GoogleGenAI, Modality, HarmCategory, HarmBlockThreshold } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

interface VirtualTryOnOptions {
  tryonMode: 'single' | 'multi';
  tryonType?: string;
  preservePose: string;
  style: string;
  aspectRatio: string;
  customWidth?: number;
  customHeight?: number;
}

interface ProductInput {
  imageBuffer: Buffer;
  imageMimeType: string;
  productType: string;
  productName?: string;
}

export async function generateVirtualTryOn(
  modelImageBuffer: Buffer,
  modelImageMimeType: string,
  products: ProductInput[],
  options: VirtualTryOnOptions
): Promise<string> {
  console.log('[Virtual Try-On] Starting generation...');
  console.log('[Virtual Try-On] Mode:', options.tryonMode);
  console.log('[Virtual Try-On] Products:', products.length);
  console.log('[Virtual Try-On] Style:', options.style);

  const prompt = buildVirtualTryOnPrompt(products, options);
  
  console.log('[Virtual Try-On] Prompt:', prompt.substring(0, 200) + '...');

  try {
    const parts: any[] = [
      { text: prompt },
      {
        inlineData: {
          mimeType: modelImageMimeType,
          data: modelImageBuffer.toString('base64'),
        },
      },
    ];

    for (const product of products) {
      parts.push({
        inlineData: {
          mimeType: product.imageMimeType,
          data: product.imageBuffer.toString('base64'),
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
      },
    });

    const candidate = response.candidates?.[0];
    const imagePart = candidate?.content?.parts?.find((part: any) => part.inlineData);

    if (!imagePart?.inlineData?.data) {
      throw new Error("No image data in response from Gemini");
    }

    const resultMimeType = imagePart.inlineData.mimeType || "image/png";
    console.log('[Virtual Try-On] ✅ Generation successful');
    return `data:${resultMimeType};base64,${imagePart.inlineData.data}`;
  } catch (error: any) {
    console.error('[Virtual Try-On] ❌ Generation failed:', error.message);
    throw new Error(`Virtual try-on generation failed: ${error.message}`);
  }
}

function buildVirtualTryOnPrompt(
  products: ProductInput[],
  options: VirtualTryOnOptions
): string {
  const isSingleMode = options.tryonMode === 'single';
  const preservePose = options.preservePose === 'yes';
  const isNaturalStyle = options.style === 'natural';

  let prompt = `You are an expert AI fashion designer specializing in virtual try-on technology. Generate a photorealistic image where the provided model is wearing the provided product(s).

🚫 WATERMARK REMOVAL (CRITICAL):
- COMPLETELY IGNORE and DO NOT reproduce any watermarks, text overlays, logos, QR codes, or platform branding from product or model images.
- Generate a clean, professional try-on image FREE of any third-party markings.

CRITICAL REQUIREMENTS:
`;

  if (isSingleMode && options.tryonType) {
    prompt += `
MODE: Single Product Precise Replacement
- Replace ONLY the ${options.tryonType} on the model with the provided product
- Keep ALL other clothing items EXACTLY as they are in the original model image
- Maintain the model's exact appearance (face, body, skin tone, age)
`;

    if (options.tryonType === 'accessory') {
      prompt += `- The accessory (bag, hat, jewelry, etc.) should be naturally integrated into the scene\n`;
    } else if (options.tryonType === 'top') {
      prompt += `- Replace only the upper body garment (shirt, blouse, jacket, etc.)\n`;
      prompt += `- Keep the bottom (pants, skirt) EXACTLY as is\n`;
    } else if (options.tryonType === 'bottom') {
      prompt += `- Replace only the lower body garment (pants, skirt, shorts, etc.)\n`;
      prompt += `- Keep the top EXACTLY as is\n`;
    } else if (options.tryonType === 'full') {
      prompt += `- Replace the entire outfit (top + bottom or full dress)\n`;
    }
  } else {
    prompt += `
MODE: Multi-Product Flexible Combination
- Dress the model in ALL ${products.length} provided products
- Create a cohesive, fashionable outfit from the products
- Ensure products work together harmoniously
`;

    products.forEach((product, index) => {
      prompt += `- Product ${index + 1}: ${product.productType}${product.productName ? ` (${product.productName})` : ''}\n`;
    });
  }

  if (preservePose) {
    prompt += `
POSE PRESERVATION:
- Maintain the EXACT pose, body position, and camera angle from the original model image
- Keep the same perspective, orientation, and body language
- Only change the clothing/products, not the pose
`;
  } else {
    prompt += `
POSE FLEXIBILITY:
- You may adjust the pose slightly to better showcase the product(s)
- Ensure the pose is natural and appropriate for the product type
`;
  }

  prompt += `
STYLE DIRECTION: ${isNaturalStyle ? 'Natural & Realistic' : 'Fashion Editorial'}
`;

  if (isNaturalStyle) {
    prompt += `- Create a realistic, everyday photography style
- Natural lighting and casual composition
- Focus on how the product looks in real-life scenarios
- Authentic skin tones and textures
`;
  } else {
    prompt += `- Create a high-fashion editorial photography style
- Dramatic lighting and professional composition
- Elevated, stylized presentation
- Fashion magazine quality
`;
  }

  prompt += `
TECHNICAL SPECIFICATIONS:
- Photo-realistic quality with professional lighting
- Proper fabric physics and draping
- Natural shadows and highlights on the products
- Seamless integration between model and products
- Maintain proper proportions and fit
- ${options.aspectRatio === 'custom' && options.customWidth && options.customHeight 
    ? `Image dimensions: exactly ${options.customWidth}×${options.customHeight} pixels` 
    : `Aspect ratio: ${options.aspectRatio}`}

INPUTS PROVIDED:
1. Model image (reference for body, face, and ${preservePose ? 'exact pose' : 'general pose'})
${products.map((p, i) => `${i + 2}. Product image ${i + 1}: ${p.productType}${p.productName ? ` - ${p.productName}` : ''}`).join('\n')}

Generate the final virtual try-on image showing the model wearing the specified product(s).`;

  return prompt;
}
