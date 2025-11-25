import type { Handler } from "@netlify/functions";
import Busboy from "busboy";
import { generatePosterDesign } from "../../server/posterDesignGenerator";

type FileObj = { data: Buffer; mime: string; filename: string };

function parseMultipart(event: any): Promise<{ files: Record<string, FileObj>; fields: Record<string, string> }> {
  return new Promise((resolve, reject) => {
    const files: Record<string, FileObj> = {};
    const fields: Record<string, string> = {};
    const busboy = Busboy({ headers: event.headers });

    busboy.on("file", (name, file, info) => {
      const chunks: Buffer[] = [];
      file.on("data", (d) => chunks.push(d));
      file.on("end", () => {
        files[name] = { data: Buffer.concat(chunks), mime: info.mimeType, filename: info.filename };
      });
    });
    busboy.on("field", (name, val) => {
      fields[name] = val;
    });
    busboy.on("error", reject);
    busboy.on("finish", () => resolve({ files, fields }));
    busboy.end(Buffer.from(event.body || "", event.isBase64Encoded ? "base64" : "utf8"));
  });
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };
  if (!event.headers["content-type"]?.includes("multipart/form-data")) {
    return { statusCode: 400, body: "Content-Type must be multipart/form-data" };
  }

  try {
    const { files, fields } = await parseMultipart(event);

    const productImages = Object.keys(files)
      .filter((k) => k.startsWith("productImages"))
      .map((k) => files[k]);
    const referenceImage = files.referenceImage || undefined;
    const logoImage = files.logoImage || undefined;

    if (productImages.length === 0) return { statusCode: 400, body: "At least one product image is required" };

    const assets = {
      productImages: productImages.map((f) => ({ buffer: f.data, mimeType: f.mime, name: f.filename })),
      referenceImage: referenceImage ? { buffer: referenceImage.data, mimeType: referenceImage.mime } : undefined,
      logoImage: logoImage ? { buffer: logoImage.data, mimeType: logoImage.mime } : undefined,
    };

    const options = {
      campaignType: fields.campaignType,
      customCampaign: fields.customCampaign,
      referenceLevel: fields.referenceLevel,
      customReferenceLevel: fields.customReferenceLevel,
      visualStyle: fields.visualStyle,
      customVisualStyle: fields.customVisualStyle,
      backgroundScene: fields.backgroundScene,
      customBackgroundScene: fields.customBackgroundScene,
      layout: fields.layout,
      customLayout: fields.customLayout,
      aspectRatio: fields.aspectRatio,
      customWidth: fields.customWidth ? parseInt(fields.customWidth, 10) : undefined,
      customHeight: fields.customHeight ? parseInt(fields.customHeight, 10) : undefined,
      headlineStyle: fields.headlineStyle,
      customHeadline: fields.customHeadline,
      autoGenerateHeadline: fields.autoGenerateHeadline,
      sellingPoints: fields.sellingPoints ? JSON.parse(fields.sellingPoints) : [],
      autoGenerateSellingPoints: fields.autoGenerateSellingPoints,
      priceStyle: fields.priceStyle,
      originalPrice: fields.originalPrice,
      currentPrice: fields.currentPrice,
      discountText: fields.discountText,
      customPriceStyle: fields.customPriceStyle,
      logoPosition: fields.logoPosition,
      brandTagline: fields.brandTagline,
      customOptimizedPrompt: fields.customOptimizedPrompt || undefined,
    };

    const imageUrl = await generatePosterDesign(assets, options as any);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl }),
    };
  } catch (err: any) {
    console.error("[Poster Design API] ❌ Error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to generate poster",
        message: err.message,
      }),
    };
  }
};
