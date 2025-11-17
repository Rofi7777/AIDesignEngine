import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateProductDesignEnhanced, generateModelSceneEnhanced } from "./geminiEnhanced";
import multer from "multer";
import { readFileSync } from "fs";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.match(/image\/(png|jpeg|jpg)/)) {
      cb(null, true);
    } else {
      cb(new Error("Only PNG and JPG images are allowed"));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/generate-design", upload.fields([
    { name: "template", maxCount: 1 },
    { name: "referenceImage", maxCount: 1 },
    { name: "brandLogo", maxCount: 1 },
  ]), async (req, res) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
      
      if (!files || !files.template || files.template.length === 0) {
        return res.status(400).json({
          error: "No template file uploaded",
        });
      }

      const templateFile = files.template[0];
      const referenceImageFile = files.referenceImage?.[0];
      const brandLogoFile = files.brandLogo?.[0];

      const { theme, style, color, material, angles, designDescription } = req.body;

      if (!theme || !style || !color || !material) {
        return res.status(400).json({
          error: "Missing required fields: theme, style, color, material",
        });
      }

      const anglesArray = JSON.parse(angles || '["top", "45degree"]');
      const productType = req.body.productType || 'slippers';
      const customProductType = req.body.customProductType;

      const results: Record<string, string> = {};
      let canonicalImageBuffer: Buffer | undefined;
      let canonicalImageMimeType: string | undefined;

      // STEP 1: Generate first angle as canonical design (always generate this first)
      // Uses two-stage architecture: LLM generates optimized prompt → Gemini generates image
      const firstAngle = anglesArray[0];
      console.log(`Generating canonical design (${firstAngle} view) with professional designer prompts...`);
      results[firstAngle] = await generateProductDesignEnhanced(
        productType,
        customProductType,
        templateFile.buffer,
        templateFile.mimetype,
        theme,
        style,
        color,
        material,
        firstAngle,
        referenceImageFile?.buffer,
        referenceImageFile?.mimetype,
        brandLogoFile?.buffer,
        brandLogoFile?.mimetype,
        designDescription
      );

      // Extract canonical image for subsequent angles
      const canonicalBase64 = results[firstAngle].split(',')[1];
      canonicalImageBuffer = Buffer.from(canonicalBase64, 'base64');
      canonicalImageMimeType = results[firstAngle].match(/data:([^;]+);/)?.[1] || 'image/png';

      // STEP 2: Generate remaining angles using canonical as reference for consistency
      for (let i = 1; i < anglesArray.length; i++) {
        const angle = anglesArray[i];
        console.log(`Generating ${angle} view with design consistency enforcement...`);
        
        results[angle] = await generateProductDesignEnhanced(
          productType,
          customProductType,
          templateFile.buffer,
          templateFile.mimetype,
          theme,
          style,
          color,
          material,
          angle,
          referenceImageFile?.buffer,
          referenceImageFile?.mimetype,
          brandLogoFile?.buffer,
          brandLogoFile?.mimetype,
          designDescription,
          canonicalImageBuffer,
          canonicalImageMimeType
        );
      }
      
      // Map to legacy field names for backward compatibility
      const legacyResults: any = { ...results };
      if (results['top']) legacyResults.topView = results['top'];
      if (results['45degree']) legacyResults.view45 = results['45degree'];
      if (results['front']) legacyResults.frontView = results['front'];
      if (results['back']) legacyResults.backView = results['back'];
      if (results['side']) legacyResults.sideView = results['side'];
      if (results['view1']) legacyResults.view1 = results['view1'];
      if (results['view2']) legacyResults.view2 = results['view2'];

      // Convert optional images to data URLs for storage
      let referenceImageUrl: string | null = null;
      if (referenceImageFile) {
        referenceImageUrl = `data:${referenceImageFile.mimetype};base64,${referenceImageFile.buffer.toString('base64')}`;
      }

      let brandLogoUrl: string | null = null;
      if (brandLogoFile) {
        brandLogoUrl = `data:${brandLogoFile.mimetype};base64,${brandLogoFile.buffer.toString('base64')}`;
      }

      // Save both angles as a single design record
      await storage.saveCompleteDesign({
        view1Url: results[anglesArray[0]] || null,
        view2Url: results[anglesArray[1]] || null,
        productType,
        customProductType,
        theme,
        style,
        color,
        material,
        designDescription: designDescription || null,
        referenceImageUrl,
        brandLogoUrl,
      });

      res.json(legacyResults);
    } catch (error: any) {
      console.error("Error generating design:", error);
      
      const isClientError = 
        error.message?.includes("not valid") || 
        error.message?.includes("too small") ||
        error.message?.includes("INVALID_ARGUMENT");
      
      res.status(isClientError ? 400 : 500).json({
        error: isClientError ? error.message : "Failed to generate slipper design",
        message: error.message,
      });
    }
  });

  app.post("/api/generate-model", upload.single("slipperImage"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: "No slipper design image uploaded",
        });
      }

      const {
        nationality,
        familyCombination,
        scenario,
        location,
        presentationStyle,
      } = req.body;

      if (!nationality || !familyCombination || !scenario || !location || !presentationStyle) {
        return res.status(400).json({
          error: "Missing required fields",
        });
      }

      console.log("Generating model wearing scene with professional designer prompts...");
      const modelImage = await generateModelSceneEnhanced(
        req.body.productType || 'slippers',
        req.body.customProductType,
        req.file.buffer,
        req.file.mimetype,
        nationality,
        familyCombination,
        scenario,
        location,
        presentationStyle
      );

      await storage.saveGeneratedImage({
        type: "model_wearing",
        imageUrl: modelImage,
        metadata: {
          nationality,
          familyCombination,
          scenario,
          location,
          presentationStyle,
        },
      });

      res.json({ modelImage });
    } catch (error: any) {
      console.error("Error generating model scene:", error);
      
      const isClientError = 
        error.message?.includes("not valid") || 
        error.message?.includes("too small") ||
        error.message?.includes("INVALID_ARGUMENT");
      
      res.status(isClientError ? 400 : 500).json({
        error: isClientError ? error.message : "Failed to generate model wearing scene",
        message: error.message,
      });
    }
  });

  app.get("/api/generated-images", async (req, res) => {
    try {
      const images = await storage.getGeneratedImages();
      res.json(images);
    } catch (error: any) {
      console.error("Error fetching generated images:", error);
      res.status(500).json({
        error: "Failed to fetch generated images",
        message: error.message,
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
