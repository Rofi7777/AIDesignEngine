import type { Handler } from "@netlify/functions";
import Busboy from "busboy";
import { generateProductDesignEnhanced } from "../../server/geminiEnhanced";
import { extractDesignSpecification } from "../../server/designSpecExtractor";
import type { DesignSpecification } from "../../server/designSpecExtractor";

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
    const angles = JSON.parse(fields.angles || '["top","45degree"]');
    const productType = fields.productType || "custom";
    const customProductType = fields.customProductType || undefined;
    const designDescription = fields.designDescription || undefined;
    const customOptimizedPrompt = fields.customOptimizedPrompt || undefined;

    // Map templates by angle or fallback
    const angleTemplates: Record<string, FileObj> = {};
    let fallbackTemplate: FileObj | null = null;
    for (const angle of angles) {
      const key = `template_${angle}`;
      if (files[key]) {
        angleTemplates[angle] = files[key];
        if (!fallbackTemplate) fallbackTemplate = files[key];
      }
    }
    if (!fallbackTemplate && files.template) {
      fallbackTemplate = files.template;
      angles.forEach((a) => (angleTemplates[a] = files.template));
    }
    if (!fallbackTemplate) {
      return { statusCode: 400, body: "No template file uploaded. Please upload at least one template image." };
    }

    const referenceImage = files.referenceImage;
    const brandLogo = files.brandLogo;

    const results: Record<string, string> = {};
    let canonicalImageBuffer: Buffer | undefined;
    let canonicalImageMime: string | undefined;
    let designSpec: DesignSpecification | undefined;

    // First angle (canonical)
    const firstAngle = angles[0];
    const firstTemplate = angleTemplates[firstAngle] || fallbackTemplate;
    const canonicalUrl = await generateProductDesignEnhanced(
      productType as any,
      customProductType,
      firstTemplate.data,
      firstTemplate.mime,
      fields.theme,
      fields.style,
      fields.color,
      fields.material,
      firstAngle,
      referenceImage?.data,
      referenceImage?.mime,
      brandLogo?.data,
      brandLogo?.mime,
      designDescription,
      undefined,
      undefined,
      undefined,
      customOptimizedPrompt
    );
    results[firstAngle] = canonicalUrl;
    const canonicalBase64 = canonicalUrl.split(",")[1];
    canonicalImageBuffer = Buffer.from(canonicalBase64, "base64");
    canonicalImageMime = canonicalUrl.match(/data:([^;]+);/)?.[1] || "image/png";

    try {
      designSpec = await extractDesignSpecification(canonicalBase64, productType as any);
    } catch (e) {
      designSpec = undefined;
    }

    // Remaining angles
    for (let i = 1; i < angles.length; i++) {
      const angle = angles[i];
      const tpl = angleTemplates[angle] || fallbackTemplate;
      const url = await generateProductDesignEnhanced(
        productType as any,
        customProductType,
        tpl.data,
        tpl.mime,
        fields.theme,
        fields.style,
        fields.color,
        fields.material,
        angle,
        referenceImage?.data,
        referenceImage?.mime,
        brandLogo?.data,
        brandLogo?.mime,
        designDescription,
        canonicalImageBuffer,
        canonicalImageMime,
        designSpec,
        customOptimizedPrompt
      );
      results[angle] = url;
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(results),
    };
  } catch (err: any) {
    console.error("[Generate Design] ❌ Error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Failed to generate design", message: err.message }) };
  }
};
