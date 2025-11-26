import type { Handler } from "@netlify/functions";
import Busboy from "busboy";
import { generateModelTryOn } from "../../server/modelTryOnGenerator";

type FileObj = { data: Buffer; mime: string; filename: string };

function parseMultipart(event: any): Promise<{ files: FileObj[]; fields: Record<string, string> }> {
  return new Promise((resolve, reject) => {
    const files: FileObj[] = [];
    const fields: Record<string, string> = {};
    const busboy = Busboy({ headers: event.headers });

    busboy.on("file", (_name, file, info) => {
      const chunks: Buffer[] = [];
      file.on("data", (d) => chunks.push(d));
      file.on("end", () => {
        files.push({ data: Buffer.concat(chunks), mime: info.mimeType, filename: info.filename });
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
    if (!fields.modelOptions) return { statusCode: 400, body: "Model options are required" };
    if (files.length === 0) return { statusCode: 400, body: "No product images uploaded. Please upload at least one product image." };

    const options = JSON.parse(fields.modelOptions);
    const parsedProductTypes: string[] = JSON.parse(fields.productTypes || "[]");
    const parsedProductTypesCustom: string[] = JSON.parse(fields.productTypesCustom || "[]");

    if (!options.nationality || !options.hairstyle || !options.combination || !options.scene || !options.pose || !options.aspectRatio) {
      return { statusCode: 400, body: "Missing required model options" };
    }
    if (!options.cameraAngles || options.cameraAngles.length === 0) {
      return { statusCode: 400, body: "At least one camera angle is required" };
    }

    const products = files.map((file, idx) => ({
      imageBuffer: file.data,
      imageMimeType: file.mime,
      productType: parsedProductTypes[idx] || "Accessories",
      productTypeCustom: parsedProductTypesCustom[idx] || undefined,
    }));

    const results: Array<{ cameraAngle: string; imageUrl: string }> = [];
    for (const angle of options.cameraAngles) {
      const imageUrl = await generateModelTryOn(products, {
        nationality: options.nationality === "Custom" ? options.nationalityCustom || "" : options.nationality,
        scenario: options.scenario === "Custom" ? options.scenarioCustom || "" : options.scenario,
        location: options.location === "Custom" ? options.locationCustom || "" : options.location,
        presentationStyle:
          options.presentationStyle === "Custom" ? options.presentationStyleCustom || "" : options.presentationStyle,
        hairstyle: options.hairstyle === "Custom" ? options.hairstyleCustom || "" : options.hairstyle,
        combination: options.combination === "Custom" ? options.combinationCustom || "" : options.combination,
        scene: options.scene === "Custom" ? options.sceneCustom || "" : options.scene,
        pose: options.pose === "Custom" ? options.poseCustom || "" : options.pose,
        aspectRatio: options.aspectRatio,
        cameraAngle: angle === "Custom" ? options.cameraAngleCustom || "" : angle,
        customWidth: options.customWidth ? parseInt(options.customWidth, 10) : undefined,
        customHeight: options.customHeight ? parseInt(options.customHeight, 10) : undefined,
        cameraAngleCustom: options.cameraAngleCustom || undefined,
        customNationality: options.nationalityCustom || undefined,
        customScenario: options.scenarioCustom || undefined,
        customLocation: options.locationCustom || undefined,
        customPresentationStyle: options.presentationStyleCustom || undefined,
        customHairstyle: options.hairstyleCustom || undefined,
        customCombination: options.combinationCustom || undefined,
        customScene: options.sceneCustom || undefined,
        customPose: options.poseCustom || undefined,
      });
      results.push({ cameraAngle: angle, imageUrl });
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        results,
        message: `Model try-on generated for ${results.length} angle(s)`,
      }),
    };
  } catch (err: any) {
    console.error("[Model Try-On API] ❌ Error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to generate model try-on",
        message: err.message,
      }),
    };
  }
};
