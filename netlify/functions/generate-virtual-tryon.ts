import type { Handler } from "@netlify/functions";
import Busboy from "busboy";
import { generateVirtualTryOn } from "../../server/virtualTryOnGenerator";

function parseMultipart(event: any): Promise<{ files: Record<string, { data: Buffer; mime: string; filename: string }>; fields: Record<string, string> }> {
  return new Promise((resolve, reject) => {
    const files: Record<string, { data: Buffer; mime: string; filename: string }> = {};
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

    const modelImage = files.modelImage;
    const productImages = Object.keys(files)
      .filter((k) => k.startsWith("productImages"))
      .map((k) => files[k]);

    if (!modelImage) return { statusCode: 400, body: "Model image is required" };
    if (productImages.length === 0) return { statusCode: 400, body: "At least one product image is required" };

    const productTypes = JSON.parse(fields.productTypes || "[]");
    const productNames = JSON.parse(fields.productNames || "[]");

    const imageUrl = await generateVirtualTryOn(
      modelImage.data,
      modelImage.mime,
      productImages.map((p, i) => ({
        imageBuffer: p.data,
        imageMimeType: p.mime,
        productType: productTypes[i] || "clothing",
        productName: productNames[i] || undefined,
      })),
      {
        tryonMode: fields.tryonMode || "single",
        tryonType: fields.tryonType || undefined,
        preservePose: fields.preservePose || "yes",
        style: fields.style || "natural",
        aspectRatio: fields.aspectRatio || "1:1",
        customWidth: fields.customWidth ? parseInt(fields.customWidth, 10) : undefined,
        customHeight: fields.customHeight ? parseInt(fields.customHeight, 10) : undefined,
      }
    );

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl }),
    };
  } catch (err: any) {
    console.error("[Virtual Try-On API] ❌ Error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to generate virtual try-on",
        message: err.message,
      }),
    };
  }
};
