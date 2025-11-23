import { GoogleGenAI, Modality } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

interface ModelTryOnOptions {
  nationality: string;
  nationalityCustom?: string;
  scenario?: string;
  scenarioCustom?: string;
  location?: string;
  locationCustom?: string;
  presentationStyle?: string;
  presentationStyleCustom?: string;
  hairstyle: string;
  hairstyleCustom?: string;
  combination: string;
  combinationCustom?: string;
  scene: string;
  sceneCustom?: string;
  pose: string;
  poseCustom?: string;
  aspectRatio: string;
  cameraAngle: string;
  cameraAngleCustom?: string;
  customWidth?: number;
  customHeight?: number;
}

interface ProductInfo {
  productType: string;
  productTypeCustom?: string;
  imageBuffer: Buffer;
  imageMimeType: string;
}

export async function generateModelTryOn(
  products: ProductInfo[],
  options: ModelTryOnOptions
): Promise<string> {
  console.log('[Model Try-On] Starting generation...');
  console.log('[Model Try-On] Products:', products.length);
  console.log('[Model Try-On] Camera Angle:', options.cameraAngle);
  console.log('[Model Try-On] Aspect Ratio:', options.aspectRatio);

  // Build prompt based on user specifications
  const prompt = buildModelTryOnPrompt(products, options);
  
  console.log('[Model Try-On] Prompt:', prompt.substring(0, 200) + '...');

  try {
    // Build parts array - order matters for prompt clarity
    const parts: any[] = [{ text: prompt }];

    // Add product images
    for (const product of products) {
      parts.push({
        inlineData: {
          mimeType: product.imageMimeType,
          data: product.imageBuffer.toString('base64'),
        },
      });
    }

    // Generate image with Gemini API
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-image-preview",
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
    console.log('[Model Try-On] ✅ Generation successful');
    return `data:${resultMimeType};base64,${imagePart.inlineData.data}`;
  } catch (error: any) {
    console.error('[Model Try-On] ❌ Generation failed:', error.message);
    throw new Error(`Model try-on generation failed: ${error.message}`);
  }
}

function buildModelTryOnPrompt(
  products: ProductInfo[],
  options: ModelTryOnOptions
): string {
  // Resolve custom values
  const nationality = options.nationality === 'Custom' 
    ? options.nationalityCustom || 'Asian' 
    : options.nationality;
    
  const scenario = options.scenario === 'Custom'
    ? options.scenarioCustom || ''
    : (options.scenario || '');
    
  const location = options.location === 'Custom'
    ? options.locationCustom || ''
    : (options.location || '');
    
  const presentationStyle = options.presentationStyle === 'Custom'
    ? options.presentationStyleCustom || ''
    : (options.presentationStyle || '');
    
  const hairstyle = options.hairstyle === 'Custom'
    ? options.hairstyleCustom || 'medium length hair'
    : options.hairstyle;
    
  const combination = options.combination === 'Custom'
    ? options.combinationCustom || 'Single female model'
    : options.combination;
    
  const scene = options.scene === 'Custom'
    ? options.sceneCustom || 'studio background'
    : options.scene;
    
  const pose = options.pose === 'Custom'
    ? options.poseCustom || 'standing relaxed'
    : options.pose;
    
  const cameraAngle = options.cameraAngle === 'Custom'
    ? options.cameraAngleCustom || 'front view'
    : options.cameraAngle;

  // Build product description
  const productDescriptions = products.map((product, index) => {
    const productType = product.productType === 'Custom' 
      ? product.productTypeCustom || 'accessory' 
      : product.productType;
    
    let placement = '';
    switch (productType) {
      case 'Hat':
        placement = 'worn on the head';
        break;
      case 'Top / Shirt / Jacket':
        placement = 'worn on the upper body';
        break;
      case 'Bottom / Pants / Skirt':
        placement = 'worn on the lower body';
        break;
      case 'Shoes / Slippers':
        placement = 'worn on the feet';
        break;
      case 'Accessories':
        placement = 'carried or worn in a realistic position (bag on shoulder, watch on wrist, jewelry worn appropriately)';
        break;
      default:
        placement = 'placed in a natural and logical position according to its function';
    }
    
    return `Product ${index + 1}: ${productType} (${placement})`;
  }).join('\n  - ');

  // Build scene description with all available context
  let sceneDescription = `  - Location / scene: ${scene}`;
  if (location) {
    sceneDescription += `\n  - Specific location: ${location}`;
  }
  if (scenario) {
    sceneDescription += `\n  - Scenario / activity: ${scenario}`;
  }
  sceneDescription += `\n  - Pose: ${pose}`;
  sceneDescription += `\n  - Camera angle: ${cameraAngle}`;
  if (presentationStyle) {
    sceneDescription += `\n  - Presentation style: ${presentationStyle}`;
  }
  sceneDescription += `\n  - Make sure the product(s) is clearly visible and visually emphasized in the frame`;

  const prompt = `Create a high-quality image of real people wearing or using the uploaded product(s).

Product(s):
  - ${productDescriptions}
  - Use the uploaded product image(s) as the reference
  - Keep the product shape and key visual details consistent with the image(s)
  - Place the product(s) naturally on the model(s)

Models:
  - Nationality / appearance: ${nationality}
  - Model combination: ${combination}
  - Hairstyle: ${hairstyle}
  - Clothing style: choose outfits that match and highlight the product design

Scene & composition:
${sceneDescription}

Aspect ratio:
  - ${options.aspectRatio === 'custom' && options.customWidth && options.customHeight 
      ? `Generate the image at exactly ${options.customWidth}×${options.customHeight} pixels` 
      : `Generate the image in a ${options.aspectRatio} aspect ratio`}

Rendering style:
  - Use realistic human proportions and natural poses
  - Use lighting that matches the scene (indoor / outdoor / studio)
  - Skin tones, fabric textures, and product materials should look realistic
  - The overall image should be clean, visually appealing, and suitable for product presentation and marketing use

Output:
  - A high-quality PNG image of the model(s) naturally wearing or using the product(s) in the specified scene`;

  return prompt;
}
