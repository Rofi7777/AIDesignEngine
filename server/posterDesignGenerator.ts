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

export interface PosterDesignOptions {
  // Module A: Campaign & Scene
  campaignType: string;
  customCampaign?: string;
  referenceLevel?: string;
  customReferenceLevel?: string;
  
  // Module B: Visual Style & Layout
  visualStyle: string;
  customVisualStyle?: string;
  backgroundScene: string;
  customBackgroundScene?: string;
  layout: string;
  customLayout?: string;
  aspectRatio: string;
  customWidth?: number;
  customHeight?: number;
  
  // Module C: Copy & Elements
  headlineStyle: string;
  customHeadline?: string;
  autoGenerateHeadline?: string;
  sellingPoints?: string[];
  autoGenerateSellingPoints?: string;
  priceStyle?: string;
  originalPrice?: string;
  currentPrice?: string;
  discountText?: string;
  customPriceStyle?: string;
  logoPosition?: string;
  brandTagline?: string;
}

export interface PosterAssets {
  productImages: Array<{
    buffer: Buffer;
    mimeType: string;
    name?: string;
  }>;
  referenceImage?: {
    buffer: Buffer;
    mimeType: string;
  };
  logoImage?: {
    buffer: Buffer;
    mimeType: string;
  };
}

export async function generatePosterDesign(
  assets: PosterAssets,
  options: PosterDesignOptions
): Promise<string> {
  console.log('[Poster Design] Starting generation...');
  console.log('[Poster Design] Campaign Type:', options.campaignType);
  console.log('[Poster Design] Visual Style:', options.visualStyle);
  console.log('[Poster Design] Product Images:', assets.productImages.length);
  console.log('[Poster Design] Has Reference:', !!assets.referenceImage);
  console.log('[Poster Design] Has Logo:', !!assets.logoImage);

  try {
    // Stage 1: Optimize prompt using text LLM
    const optimizedPrompt = await optimizePosterPrompt(assets, options);
    console.log('[Poster Design] Stage 1: Optimized prompt:', optimizedPrompt.substring(0, 200) + '...');

    // Add watermark removal instruction to optimized prompt
    const finalPrompt = `${optimizedPrompt}

🚫 WATERMARK REMOVAL (CRITICAL):
- COMPLETELY IGNORE and DO NOT reproduce any watermarks, text overlays, logos, QR codes, or platform branding from product or reference images.
- Generate a clean, professional poster FREE of any third-party markings.`;

    // Stage 2: Generate image using optimized prompt
    const generatedImageData = await generatePosterImage(assets, finalPrompt, options);
    console.log('[Poster Design] ✅ Generation successful');
    
    return generatedImageData;
  } catch (error: any) {
    console.error('[Poster Design] ❌ Generation failed:', error.message);
    throw new Error(`Poster design generation failed: ${error.message}`);
  }
}

async function optimizePosterPrompt(
  assets: PosterAssets,
  options: PosterDesignOptions
): Promise<string> {
  const promptOptimizerSystemPrompt = `You are a professional e-commerce marketing designer with 10+ years of experience in creating high-converting promotional posters for platforms like Taobao, Shopee, Amazon, and Instagram.

Your role is to transform structured campaign requirements into expertly-crafted, detailed image generation prompts that produce stunning, conversion-optimized marketing posters.

Key expertise areas:
- Visual hierarchy and composition for maximum impact
- Color psychology for different campaign types
- Typography choices that enhance readability and conversion
- Layout strategies for various aspect ratios
- Cultural sensitivity for global markets
- Brand consistency and professional polish`;

  const userRequest = buildPromptOptimizerRequest(assets, options);
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: [
        {
          role: "user",
          parts: [
            { text: promptOptimizerSystemPrompt },
            { text: "\n\nUser Requirements:\n" + userRequest },
            { text: "\n\n⚠️ CRITICAL INSTRUCTION: The user has uploaded specific product images that MUST be used exactly as shown. Create a detailed image generation prompt that:\n1. MANDATES using the uploaded product images without any modifications\n2. Emphasizes that products must appear exactly as shown (same colors, shape, details, logos)\n3. Clarifies that ONLY background, text, and decorative elements should be generated\n4. Makes product consistency the HIGHEST priority\n5. Includes all marketing elements and design specifications from the requirements\n\nThe prompt should produce a high-converting e-commerce poster while preserving 100% product fidelity." }
          ],
        },
      ],
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

    const optimizedPrompt = response.text || "";
    return optimizedPrompt;
  } catch (error: any) {
    console.error('[Poster Design] Prompt optimization failed, using fallback:', error.message);
    return buildFallbackPrompt(assets, options);
  }
}

function buildPromptOptimizerRequest(assets: PosterAssets, options: PosterDesignOptions): string {
  let request = `# E-Commerce Poster Design Requirements\n\n`;
  
  // Module A: Campaign & Scene
  request += `## Campaign Configuration\n`;
  request += `- Campaign Type: ${options.campaignType}${options.customCampaign ? ` (${options.customCampaign})` : ''}\n`;
  if (assets.referenceImage) {
    request += `- Reference Image: Provided (use as ${options.referenceLevel || 'layout'} reference${options.customReferenceLevel ? `: ${options.customReferenceLevel}` : ''})\n`;
  }
  request += `\n`;
  
  // Module B: Visual Style & Layout
  request += `## Visual Style & Layout\n`;
  request += `- Visual Style: ${options.visualStyle}${options.customVisualStyle ? ` (${options.customVisualStyle})` : ''}\n`;
  request += `- Background Scene: ${options.backgroundScene}${options.customBackgroundScene ? ` (${options.customBackgroundScene})` : ''}\n`;
  request += `- Layout: ${options.layout}${options.customLayout ? ` (${options.customLayout})` : ''}\n`;
  if (options.aspectRatio === 'custom' && options.customWidth && options.customHeight) {
    request += `- Dimensions: ${options.customWidth}×${options.customHeight} pixels (custom size)\n`;
  } else {
    request += `- Aspect Ratio: ${options.aspectRatio}\n`;
  }
  request += `\n`;
  
  // Module C: Copy & Elements
  request += `## Copy & Marketing Elements\n`;
  
  // Headline
  if (options.autoGenerateHeadline === 'yes') {
    request += `- Headline: Auto-generate ${options.headlineStyle} headline\n`;
  } else if (options.customHeadline) {
    request += `- Headline: "${options.customHeadline}" (${options.headlineStyle} style)\n`;
  } else {
    request += `- Headline Style: ${options.headlineStyle}\n`;
  }
  
  // Selling Points
  if (options.autoGenerateSellingPoints === 'yes') {
    request += `- Selling Points: Auto-generate based on products\n`;
  } else if (options.sellingPoints && options.sellingPoints.length > 0) {
    request += `- Selling Points:\n`;
    options.sellingPoints.forEach((point, i) => {
      request += `  ${i + 1}. ${point}\n`;
    });
  }
  
  // Price Information
  if (options.priceStyle && options.priceStyle !== 'no-price') {
    request += `- Price Style: ${options.priceStyle}${options.customPriceStyle ? ` (${options.customPriceStyle})` : ''}\n`;
    if (options.originalPrice) request += `  - Original: ${options.originalPrice}\n`;
    if (options.currentPrice) request += `  - Current: ${options.currentPrice}\n`;
    if (options.discountText) request += `  - Discount: ${options.discountText}\n`;
  }
  
  // Branding
  if (assets.logoImage) {
    request += `- Logo: Provided (position: ${options.logoPosition || 'top-left'})\n`;
  }
  if (options.brandTagline) {
    request += `- Brand Tagline: "${options.brandTagline}"\n`;
  }
  
  request += `\n## Product Information (CRITICAL - HIGHEST PRIORITY)\n`;
  request += `⚠️ MANDATORY REQUIREMENT: The uploaded product images MUST be used exactly as provided\n`;
  request += `⚠️ DO NOT create new products, alter product appearance, or substitute with similar items\n`;
  request += `⚠️ PRESERVE all product details: exact shape, colors, textures, logos, patterns, and features\n`;
  request += `⚠️ The products in the uploaded images are the SOURCE OF TRUTH - they must appear exactly as shown\n`;
  request += `- Number of Products: ${assets.productImages.length}\n`;
  if (assets.productImages.some(p => p.name)) {
    request += `- Product Names: ${assets.productImages.map(p => p.name).filter(Boolean).join(', ')}\n`;
  }
  request += `- The poster design should enhance these specific products with marketing elements, NOT create new ones\n`;
  request += `- Only the background, text, and decorative elements should be generated - the products must remain unchanged\n`;
  
  return request;
}

function buildFallbackPrompt(assets: PosterAssets, options: PosterDesignOptions): string {
  let prompt = `Create a professional e-commerce promotional poster with the following specifications:

🚫 WATERMARK REMOVAL (CRITICAL):
- COMPLETELY IGNORE and DO NOT reproduce any watermarks, text overlays, logos, QR codes, or platform branding from product or reference images.
- Generate a clean, professional poster FREE of any third-party markings.

`;
  
  // Campaign context
  prompt += `CAMPAIGN TYPE: ${options.campaignType}${options.customCampaign ? ` - ${options.customCampaign}` : ''}\n\n`;
  
  // Visual style
  prompt += `VISUAL STYLE: ${options.visualStyle}${options.customVisualStyle ? ` (${options.customVisualStyle})` : ''}\n`;
  prompt += `- Background: ${options.backgroundScene}${options.customBackgroundScene ? ` - ${options.customBackgroundScene}` : ''}\n`;
  prompt += `- Layout: ${options.layout}${options.customLayout ? ` - ${options.customLayout}` : ''}\n`;
  if (options.aspectRatio === 'custom' && options.customWidth && options.customHeight) {
    prompt += `- Dimensions: ${options.customWidth}×${options.customHeight} pixels (custom size)\n\n`;
  } else {
    prompt += `- Aspect Ratio: ${options.aspectRatio}\n\n`;
  }
  
  // Product placement - CRITICAL: Product consistency
  prompt += `PRODUCT DISPLAY (CRITICAL - HIGHEST PRIORITY):\n`;
  prompt += `⚠️ MANDATORY: You MUST use the exact products shown in the uploaded product images\n`;
  prompt += `⚠️ DO NOT create new products or modify the product appearance\n`;
  prompt += `⚠️ PRESERVE all product details: shape, colors, textures, logos, and features\n`;
  if (assets.productImages.length === 1) {
    prompt += `- Display the single uploaded product image as the main hero element\n`;
    prompt += `- The product must be the focal point and clearly recognizable\n`;
  } else {
    prompt += `- Display all ${assets.productImages.length} uploaded product images in ${options.layout} layout\n`;
    prompt += `- Each product must remain exactly as shown in its uploaded image\n`;
  }
  prompt += `- Products should be prominently displayed and clearly visible\n`;
  prompt += `- Only add marketing elements (text, background, decorations) around the products\n`;
  prompt += `- The uploaded product images are the SOURCE OF TRUTH - use them exactly\n\n`;
  
  // Marketing copy
  prompt += `MARKETING ELEMENTS:\n`;
  
  if (options.customHeadline) {
    prompt += `- Main Headline: "${options.customHeadline}"\n`;
  } else if (options.autoGenerateHeadline === 'yes') {
    prompt += `- Create compelling ${options.headlineStyle} headline\n`;
  }
  
  if (options.sellingPoints && options.sellingPoints.length > 0) {
    prompt += `- Key Selling Points:\n`;
    options.sellingPoints.forEach(point => {
      prompt += `  • ${point}\n`;
    });
  }
  
  if (options.priceStyle && options.priceStyle !== 'no-price') {
    prompt += `- Price Display (${options.priceStyle}):\n`;
    if (options.originalPrice) prompt += `  Original: ${options.originalPrice}\n`;
    if (options.currentPrice) prompt += `  Sale: ${options.currentPrice}\n`;
    if (options.discountText) prompt += `  ${options.discountText}\n`;
  }
  
  if (options.brandTagline) {
    prompt += `- Brand Tagline: "${options.brandTagline}"\n`;
  }
  
  // Reference image instruction
  if (assets.referenceImage) {
    const refLevel = options.referenceLevel || 'layout-only';
    prompt += `\nREFERENCE IMAGE: Use the provided reference image as inspiration for ${refLevel}${options.customReferenceLevel ? ` (${options.customReferenceLevel})` : ''}.\n`;
  }
  
  // Logo instruction
  if (assets.logoImage) {
    prompt += `\nLOGO: Place the provided brand logo at ${options.logoPosition || 'top-left'} position.\n`;
  }
  
  prompt += `\nEnsure the poster is visually striking, professionally designed, and optimized for e-commerce conversion. Use appropriate typography, color harmony, and visual hierarchy.`;
  
  return prompt;
}

async function generatePosterImage(
  assets: PosterAssets,
  prompt: string,
  options: PosterDesignOptions
): Promise<string> {
  const parts: any[] = [{ text: prompt }];
  
  // Add reference image first if provided (for layout/style guidance)
  if (assets.referenceImage) {
    parts.push({
      inlineData: {
        mimeType: assets.referenceImage.mimeType,
        data: assets.referenceImage.buffer.toString('base64'),
      },
    });
  }
  
  // Add product images
  for (const product of assets.productImages) {
    parts.push({
      inlineData: {
        mimeType: product.mimeType,
        data: product.buffer.toString('base64'),
      },
    });
  }
  
  // Add logo image last if provided
  if (assets.logoImage) {
    parts.push({
      inlineData: {
        mimeType: assets.logoImage.mimeType,
        data: assets.logoImage.buffer.toString('base64'),
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
      responseModalities: [Modality.TEXT, Modality.IMAGE],
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

  console.log('[Poster Generation] Full response:', JSON.stringify({
    candidatesCount: response.candidates?.length,
    firstCandidate: response.candidates?.[0] ? {
      finishReason: response.candidates[0].finishReason,
      safetyRatings: response.candidates[0].safetyRatings,
      partsCount: response.candidates[0].content?.parts?.length,
      parts: response.candidates[0].content?.parts?.map((p: any) => ({
        hasText: !!p.text,
        hasInlineData: !!p.inlineData,
        inlineDataMimeType: p.inlineData?.mimeType,
        inlineDataSize: p.inlineData?.data?.length
      }))
    } : null,
    promptFeedback: response.promptFeedback
  }, null, 2));

  const candidate = response.candidates?.[0];
  
  if (!candidate) {
    console.error('[Poster Generation] No candidates in response');
    throw new Error(`No response from Gemini. Prompt feedback: ${JSON.stringify(response.promptFeedback)}`);
  }

  if (candidate.finishReason && candidate.finishReason !== 'STOP') {
    console.error('[Poster Generation] Unusual finish reason:', candidate.finishReason);
    throw new Error(`Generation stopped: ${candidate.finishReason}. Safety ratings: ${JSON.stringify(candidate.safetyRatings)}`);
  }

  const imagePart = candidate.content?.parts?.find((part: any) => part.inlineData);

  if (!imagePart?.inlineData?.data) {
    console.error('[Poster Generation] No image data found in response parts');
    throw new Error("No image data in response from Gemini");
  }

  const resultMimeType = imagePart.inlineData.mimeType || "image/png";
  console.log('[Poster Generation] ✅ Image generated successfully');
  return `data:${resultMimeType};base64,${imagePart.inlineData.data}`;
}
