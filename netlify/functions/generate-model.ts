import type { Handler } from "@netlify/functions";
import Busboy from "busboy";
import { generateModelSceneEnhanced } from "../../server/geminiEnhanced";

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

    const productImage = files.productImage;
    if (!productImage) return { statusCode: 400, body: "Product image is required" };

    const viewAngles: string[] = fields.viewAngles ? JSON.parse(fields.viewAngles) : ["Front View"];
    const productType = fields.productType || "custom";
    const customProductType = fields.customProductType || undefined;

    const images: string[] = [];
    for (let i = 0; i < viewAngles.length; i++) {
      const angle = viewAngles[i];
      const url = await generateModelSceneEnhanced(
        productType as any,
        customProductType,
        productImage.data,
        productImage.mime,
        fields.nationality || "International",
        fields.familyCombination || "Adult",
        fields.scenario || "Casual",
        fields.location || "Studio",
        fields.presentationStyle || "Product mockup",
        angle
      );
      images.push(url);
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ modelImages: images.map((img, idx) => ({ viewAngle: viewAngles[idx], imageUrl: img })) }),
    };
  } catch (err: any) {
    console.error("[Model Try-On API] ❌ Error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to generate model scene",
        message: err.message,
      }),
    };
  }
};
