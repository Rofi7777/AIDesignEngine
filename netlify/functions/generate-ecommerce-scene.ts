import type { Handler } from "@netlify/functions";
import Busboy from "busboy";
import { generateEcommerceScene } from "../../server/ecommerceSceneGenerator";

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

    const modelImage = files.modelImage || null;
    const assetImages = Object.keys(files)
      .filter((k) => k.startsWith("assetImages"))
      .map((k) => files[k]);

    if (assetImages.length === 0) return { statusCode: 400, body: "At least one asset (product or prop) is required" };
    if (assetImages.length > 6) return { statusCode: 400, body: "Maximum 6 assets allowed" };

    const parsedAssetTypes = JSON.parse(fields.assetTypes || "[]");
    const parsedAssetNames = JSON.parse(fields.assetNames || "[]");
    const quantity = parseInt(fields.outputQuantity || "1", 10);
    const customSceneType = fields.customSceneType || undefined;
    const customLighting = fields.customLighting || undefined;
    const customComposition = fields.customComposition || undefined;
    const description = fields.description || undefined;
    const aspectRatio = fields.aspectRatio || "1:1";
    const customWidth = fields.customWidth ? parseInt(fields.customWidth, 10) : undefined;
    const customHeight = fields.customHeight ? parseInt(fields.customHeight, 10) : undefined;

    const images: string[] = [];
    for (let i = 0; i < quantity; i++) {
      const imageUrl = await generateEcommerceScene(
        modelImage ? modelImage.data : null,
        modelImage ? modelImage.mime : null,
        assetImages.map((f, idx) => ({
          assetType: parsedAssetTypes[idx] || "product",
          imageBuffer: f.data,
          imageMimeType: f.mime,
          assetName: parsedAssetNames[idx] || undefined,
        })),
        {
          sceneType: fields.sceneType,
          customSceneType,
          lighting: fields.lighting,
          customLighting,
          composition: fields.composition,
          customComposition,
          aspectRatio,
          customWidth,
          customHeight,
          designDescription: description,
          customOptimizedPrompt: fields.customOptimizedPrompt || undefined,
          totalOutputs: quantity,
          currentIndex: i + 1,
        }
      );
      images.push(imageUrl);
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrls: images, imageUrl: images[0] }),
    };
  } catch (err: any) {
    console.error("[E-commerce Scene API] ❌ Error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to generate e-commerce scene",
        message: err.message,
      }),
    };
  }
};
