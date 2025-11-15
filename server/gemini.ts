// Based on javascript_gemini_ai_integrations blueprint
import { GoogleGenAI, Modality } from "@google/genai";

// This is using Replit's AI Integrations service, which provides Gemini-compatible API access
// without requiring your own Gemini API key. Charges are billed to your Replit credits.
const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

export async function generateSlipperDesign(
  templateBuffer: Buffer,
  mimeType: string,
  theme: string,
  style: string,
  color: string,
  material: string,
  angle: "top" | "45degree",
  referenceImageBuffer?: Buffer,
  referenceImageMimeType?: string,
  brandLogoBuffer?: Buffer,
  brandLogoMimeType?: string,
  designDescription?: string
): Promise<string> {
  if (templateBuffer.length < 100) {
    throw new Error("Image file is too small or invalid. Please upload a valid slipper template image.");
  }

  const angleDescription = angle === "top" 
    ? "top-down view showing the upper surface of the slipper" 
    : "45-degree angled view showing both the top and side profile of the slipper";

  // Build enhanced prompt with optional fields
  let prompt = `Create a professional slipper design concept based on this template.

DESIGN SPECIFICATIONS:
- Seasonal Theme: ${theme}
- Design Style: ${style}
- Color Palette: ${color}
- Material: ${material}
- View Angle: ${angleDescription}`;

  // Add design description if provided
  if (designDescription && designDescription.trim()) {
    prompt += `\n\nADDITIONAL DESIGN REQUIREMENTS:
${designDescription}`;
  }

  // Add reference image instructions if provided
  if (referenceImageBuffer) {
    prompt += `\n\nSTYLE REFERENCE:
A reference image is provided showing the desired design aesthetic, patterns, colors, or style inspiration. Please incorporate elements from this reference image into the slipper design while maintaining the template's basic structure.`;
  }

  // Add brand logo instructions if provided
  if (brandLogoBuffer) {
    prompt += `\n\nBRAND IDENTITY:
A brand logo is provided. Please tastefully incorporate this logo into the slipper design in an appropriate location (such as the side, heel area, or top surface). The logo should be clearly visible but integrated naturally into the overall design.`;
  }

  prompt += `\n\nREQUIREMENTS:
1. Apply the specified theme, style, colors, and materials to the slipper template
2. Maintain the basic shape and structure from the template
3. Create a photorealistic, high-quality product visualization
4. The design should look professional and production-ready
5. Show clear details of textures, patterns, and material characteristics
6. Ensure the ${angle === "top" ? "top surface" : "side and top surfaces"} are clearly visible
7. Use professional product photography lighting and presentation
8. Make the design visually appealing for seasonal footwear collections

Create a stunning, market-ready slipper design that a footwear designer would be proud to present.`;

  try {
    // Build parts array with template and optional images
    const parts: any[] = [
      { text: prompt },
      {
        inlineData: {
          mimeType,
          data: templateBuffer.toString("base64"),
        },
      },
    ];

    // Add reference image if provided
    if (referenceImageBuffer && referenceImageMimeType) {
      parts.push({
        inlineData: {
          mimeType: referenceImageMimeType,
          data: referenceImageBuffer.toString("base64"),
        },
      });
    }

    // Add brand logo if provided
    if (brandLogoBuffer && brandLogoMimeType) {
      parts.push({
        inlineData: {
          mimeType: brandLogoMimeType,
          data: brandLogoBuffer.toString("base64"),
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
    return `data:${resultMimeType};base64,${imagePart.inlineData.data}`;
  } catch (error: any) {
    if (error.message?.includes("INVALID_ARGUMENT") || error.message?.includes("not valid")) {
      throw new Error("The uploaded image is not valid or supported. Please upload a clear, high-quality slipper template image (PNG or JPG).");
    }
    throw error;
  }
}

export async function generateModelWearingScene(
  slipperImageBuffer: Buffer,
  mimeType: string,
  nationality: string,
  familyCombination: string,
  scenario: string,
  location: string,
  presentationStyle: string
): Promise<string> {
  if (slipperImageBuffer.length < 100) {
    throw new Error("Slipper image is too small or invalid. Please use a valid generated slipper design.");
  }

  const prompt = `Create a professional model-wearing scene showing this slipper design being worn in a realistic setting.

SCENE SPECIFICATIONS:
- Nationality/Ethnicity: ${nationality}
- Family Combination: ${familyCombination}
- Scenario: ${scenario}
- Location: ${location}
- Presentation Style: ${presentationStyle}

REQUIREMENTS:
1. Show the model(s) naturally wearing the exact slipper design from the provided image
2. The slipper should be clearly visible and prominent in the scene
3. Create a realistic, professional photograph that looks authentic
4. Match the specified family combination (show the appropriate people)
5. Capture the atmosphere of the specified scenario and location
6. Use natural, flattering lighting appropriate for ${presentationStyle.toLowerCase()}
7. Show proper foot positioning and natural wearing posture
8. Ensure skin tones, clothing, and setting match the ${nationality} context
9. Make it look like a professional product photography shoot
10. The slipper design must match exactly what was provided

Create a stunning, photorealistic image that demonstrates how beautiful these slippers look when worn in real life.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType,
                data: slipperImageBuffer.toString("base64"),
              },
            },
          ],
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
    return `data:${resultMimeType};base64,${imagePart.inlineData.data}`;
  } catch (error: any) {
    if (error.message?.includes("INVALID_ARGUMENT") || error.message?.includes("not valid")) {
      throw new Error("The slipper image is not valid or supported. Please use a generated slipper design image.");
    }
    throw error;
  }
}
