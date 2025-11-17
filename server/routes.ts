import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateProductDesignEnhanced, generateModelSceneEnhanced } from "./geminiEnhanced";
import { extractDesignSpecification, type DesignSpecification } from "./designSpecExtractor";
import { generateModelTryOn } from "./modelTryOnGenerator";
import { generateVirtualTryOn } from "./virtualTryOnGenerator";
import { generateEcommerceScene } from "./ecommerceSceneGenerator";
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
    // Legacy single template support
    { name: "template", maxCount: 1 },
    // Multi-angle template support (4 angles)
    { name: "template_top", maxCount: 1 },
    { name: "template_45degree", maxCount: 1 },
    { name: "template_side", maxCount: 1 },
    { name: "template_bottom", maxCount: 1 },
    { name: "template_front", maxCount: 1 },
    { name: "template_back", maxCount: 1 },
    { name: "template_detail", maxCount: 1 },
    { name: "template_view1", maxCount: 1 },
    { name: "template_view2", maxCount: 1 },
    { name: "template_view3", maxCount: 1 },
    { name: "template_view4", maxCount: 1 },
    // Enhancement images
    { name: "referenceImage", maxCount: 1 },
    { name: "brandLogo", maxCount: 1 },
  ]), async (req, res) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
      
      const referenceImageFile = files?.referenceImage?.[0];
      const brandLogoFile = files?.brandLogo?.[0];

      const { theme, style, color, material, angles, designDescription } = req.body;

      if (!theme || !style || !color || !material) {
        return res.status(400).json({
          error: "Missing required fields: theme, style, color, material",
        });
      }

      const anglesArray = JSON.parse(angles || '["top", "45degree"]');
      const productType = req.body.productType || 'slippers';
      const customProductType = req.body.customProductType;

      // Build angle-to-template mapping
      const angleTemplates: Record<string, Express.Multer.File> = {};
      let fallbackTemplate: Express.Multer.File | null = null;

      // Check for angle-specific templates first
      for (const angle of anglesArray) {
        const angleKey = `template_${angle}`;
        if (files?.[angleKey] && files[angleKey].length > 0) {
          angleTemplates[angle] = files[angleKey][0];
          if (!fallbackTemplate) fallbackTemplate = files[angleKey][0];
        }
      }

      // If no angle-specific templates, check for legacy single template
      if (Object.keys(angleTemplates).length === 0 && files?.template && files.template.length > 0) {
        fallbackTemplate = files.template[0];
        // Use it for all angles
        for (const angle of anglesArray) {
          angleTemplates[angle] = fallbackTemplate;
        }
      }

      // Validate at least one template exists
      if (!fallbackTemplate) {
        return res.status(400).json({
          error: "No template file uploaded. Please upload at least one template image.",
        });
      }

      console.log(`[Multi-Angle Generation] Product: ${productType}, Angles: ${anglesArray.join(', ')}`);
      console.log(`[Template Mapping] Uploaded templates for angles:`, Object.keys(angleTemplates).join(', '));

      const results: Record<string, string> = {};
      let canonicalImageBuffer: Buffer | undefined;
      let canonicalImageMimeType: string | undefined;

      // STEP 1: Generate first angle as canonical design (always generate this first)
      // Uses two-stage architecture: LLM generates optimized prompt → Gemini generates image
      const firstAngle = anglesArray[0];
      const firstTemplate = angleTemplates[firstAngle] || fallbackTemplate;
      
      console.log(`[Canonical Generation] Generating ${firstAngle} view as design reference...`);
      console.log(`[Template] Using ${angleTemplates[firstAngle] ? 'angle-specific' : 'fallback'} template for ${firstAngle}`);
      
      try {
        results[firstAngle] = await generateProductDesignEnhanced(
          productType,
          customProductType,
          firstTemplate.buffer,
          firstTemplate.mimetype,
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
        
        if (!results[firstAngle]) {
          throw new Error(`Failed to generate canonical angle: ${firstAngle}`);
        }
      } catch (error: any) {
        console.error(`[CRITICAL] Canonical angle ${firstAngle} generation failed:`, error.message);
        throw new Error(`Failed to generate canonical design (${firstAngle}). Please try again or use a different template.`);
      }

      // Extract canonical image for subsequent angles
      const canonicalBase64 = results[firstAngle].split(',')[1];
      if (!canonicalBase64) {
        throw new Error('Invalid canonical image format - cannot extract base64 data');
      }
      canonicalImageBuffer = Buffer.from(canonicalBase64, 'base64');
      canonicalImageMimeType = results[firstAngle].match(/data:([^;]+);/)?.[1] || 'image/png';

      // STEP 1.5: Extract design specification from canonical for maximum consistency
      console.log('[Design Spec Extraction] Analyzing canonical design to extract structured specification...');
      let designSpec: DesignSpecification | undefined;
      try {
        designSpec = await extractDesignSpecification(canonicalBase64, productType);
        
        // Check if extraction returned empty/useless spec
        const hasColors = designSpec.primaryColors.length > 0 || designSpec.secondaryColors.length > 0;
        const hasPatterns = designSpec.patterns.length > 0;
        const hasBranding = designSpec.brandingElements.length > 0;
        const hasAnyDetails = hasColors || hasPatterns || hasBranding;
        
        if (hasAnyDetails) {
          console.log('[Design Spec Extraction] ✅ SUCCESS - Rich specification extracted for consistency enforcement');
          console.log('[Design Spec] Primary Colors:', designSpec.primaryColors.slice(0, 3).join(', ') || '(none)');
          console.log('[Design Spec] Patterns:', designSpec.patterns.slice(0, 2).join(', ') || '(none)');
          console.log('[Design Spec] Branding:', designSpec.brandingElements.slice(0, 2).join(', ') || '(none)');
        } else {
          console.warn('[Design Spec Extraction] ⚠️  WARNING - Extraction returned empty specification');
          console.warn('[Design Spec] Falling back to visual-only consistency (canonical image reference)');
          designSpec = undefined; // Use visual reference only
        }
      } catch (error: any) {
        console.error('[Design Spec Extraction] ❌ FAILED:', error.message);
        console.log('[Design Spec] Falling back to visual-only consistency prompts');
        designSpec = undefined; // Will use visual reference only without structured spec
      }

      // STEP 2: Generate remaining angles using canonical as reference for STRICT consistency
      for (let i = 1; i < anglesArray.length; i++) {
        const angle = anglesArray[i];
        const angleTemplate = angleTemplates[angle] || fallbackTemplate;
        
        console.log(`[Consistency Generation] Generating ${angle} view using canonical ${firstAngle} as design reference...`);
        console.log(`[Template] Using ${angleTemplates[angle] ? 'angle-specific' : 'fallback'} template for ${angle}`);
        console.log(`[Consistency] STRICT requirement: maintain EXACT design from ${firstAngle}`);
        
        try {
          results[angle] = await generateProductDesignEnhanced(
            productType,
            customProductType,
            angleTemplate.buffer,
            angleTemplate.mimetype,
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
            canonicalImageMimeType,
            designSpec // Pass structured design specification for maximum consistency
          );
          
          if (!results[angle]) {
            throw new Error(`Failed to generate angle: ${angle}`);
          }
        } catch (error: any) {
          console.error(`[ERROR] Angle ${angle} generation failed:`, error.message);
          // Continue with partial results but log the failure
          console.log(`[WARNING] Proceeding with ${i} of ${anglesArray.length} angles successfully generated`);
          throw new Error(`Failed to generate angle ${i + 1}/${anglesArray.length} (${angle}): ${error.message}`);
        }
      }
      
      // Validate all expected angles were generated
      const missingAngles = anglesArray.filter((angle: string) => !results[angle]);
      if (missingAngles.length > 0) {
        throw new Error(`Generation incomplete: missing angles ${missingAngles.join(', ')}`);
      }
      
      console.log(`[SUCCESS] All ${anglesArray.length} angles generated successfully with strict consistency`);

      
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

      // Save all 4 angles as a single design record
      await storage.saveCompleteDesign({
        view1Url: results[anglesArray[0]] || null,
        view2Url: results[anglesArray[1]] || null,
        view3Url: results[anglesArray[2]] || null,
        view4Url: results[anglesArray[3]] || null,
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

  // Model Try-On API Route
  app.post("/api/generate-model-tryon", upload.array('productImages', 10), async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[] | undefined;
      const { modelOptions, productTypes, productTypesCustom } = req.body;

      console.log('[Model Try-On API] Request received');
      console.log('[Model Try-On API] Files:', files?.length || 0);

      if (!files || files.length === 0) {
        return res.status(400).json({
          error: "No product images uploaded. Please upload at least one product image.",
        });
      }

      if (!modelOptions) {
        return res.status(400).json({
          error: "Model options are required",
        });
      }

      // Parse model options
      const options = JSON.parse(modelOptions);
      const parsedProductTypes = JSON.parse(productTypes || '[]');
      const parsedProductTypesCustom = JSON.parse(productTypesCustom || '[]');

      if (!options.nationality || !options.hairstyle || !options.combination || 
          !options.scene || !options.pose || !options.aspectRatio) {
        return res.status(400).json({
          error: "Missing required model options",
        });
      }

      if (!options.cameraAngles || options.cameraAngles.length === 0) {
        return res.status(400).json({
          error: "At least one camera angle is required",
        });
      }

      // Save try-on session to database
      const tryOnId = await storage.createModelTryOn({
        nationality: options.nationality,
        nationalityCustom: options.nationalityCustom || null,
        hairstyle: options.hairstyle,
        hairstyleCustom: options.hairstyleCustom || null,
        combination: options.combination,
        combinationCustom: options.combinationCustom || null,
        scene: options.scene,
        sceneCustom: options.sceneCustom || null,
        pose: options.pose,
        poseCustom: options.poseCustom || null,
        aspectRatio: options.aspectRatio,
        cameraAngles: JSON.stringify(options.cameraAngles),
        cameraAngleCustom: options.cameraAngleCustom || null,
      });

      // Save product images
      const productInfos: Array<{
        id: number;
        productType: string;
        productTypeCustom?: string;
        imageBuffer: Buffer;
        imageMimeType: string;
      }> = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const productType = parsedProductTypes[i] || 'Accessories';
        const productTypeCustom = parsedProductTypesCustom[i] || null;
        
        // Convert image to base64 data URL for storage
        const base64Image = file.buffer.toString('base64');
        const dataUrl = `data:${file.mimetype};base64,${base64Image}`;

        const productId = await storage.createModelTryOnProduct({
          tryOnId,
          productImageUrl: dataUrl,
          productType,
          productTypeCustom,
        });

        productInfos.push({
          id: productId,
          productType,
          productTypeCustom: productTypeCustom || undefined,
          imageBuffer: file.buffer,
          imageMimeType: file.mimetype,
        });
      }

      console.log(`[Model Try-On API] Generating ${options.cameraAngles.length} angle(s) for ${productInfos.length} product(s)...`);

      // Generate images for each camera angle
      const results: Array<{
        cameraAngle: string;
        imageUrl: string;
        productId: number;
      }> = [];

      for (const cameraAngle of options.cameraAngles) {
        console.log(`[Model Try-On API] Generating ${cameraAngle} view...`);

        const imageUrl = await generateModelTryOn(
          productInfos.map(p => ({
            productType: p.productType,
            productTypeCustom: p.productTypeCustom,
            imageBuffer: p.imageBuffer,
            imageMimeType: p.imageMimeType,
          })),
          {
            ...options,
            cameraAngle,
          }
        );

        // Save each result for each product (for multi-product scenarios)
        // In practice, all products appear in the same generated image
        for (const productInfo of productInfos) {
          await storage.createModelTryOnResult({
            tryOnId,
            productId: productInfo.id,
            cameraAngle,
            imageUrl,
          });

          results.push({
            cameraAngle,
            imageUrl,
            productId: productInfo.id,
          });
        }

        console.log(`[Model Try-On API] ✅ ${cameraAngle} view generated successfully`);
      }

      console.log(`[Model Try-On API] ✅ All ${options.cameraAngles.length} angle(s) generated successfully`);

      res.json({
        tryOnId,
        results,
        message: `Successfully generated ${options.cameraAngles.length} angle(s)`,
      });

    } catch (error: any) {
      console.error("[Model Try-On API] ❌ Error:", error);
      
      const isClientError = 
        error.message?.includes("required") || 
        error.message?.includes("invalid") ||
        error.message?.includes("INVALID_ARGUMENT");
      
      res.status(isClientError ? 400 : 500).json({
        error: isClientError ? error.message : "Failed to generate model try-on images",
        message: error.message,
      });
    }
  });

  // Virtual Try-On API Route
  app.post("/api/generate-virtual-tryon", upload.fields([
    { name: "modelImage", maxCount: 1 },
    { name: "productImages", maxCount: 5 },
  ]), async (req, res) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
      const { tryonMode, tryonType, preservePose, style, aspectRatio, productTypes, productNames } = req.body;

      console.log('[Virtual Try-On API] Request received');
      console.log('[Virtual Try-On API] Mode:', tryonMode);

      const modelImageFile = files?.modelImage?.[0];
      const productImageFiles = files?.productImages || [];

      if (!modelImageFile) {
        return res.status(400).json({
          error: "Model image is required",
        });
      }

      if (productImageFiles.length === 0) {
        return res.status(400).json({
          error: "At least one product image is required",
        });
      }

      if (!tryonMode || !aspectRatio) {
        return res.status(400).json({
          error: "Missing required fields: tryonMode, aspectRatio",
        });
      }

      if (tryonMode === 'single' && !tryonType) {
        return res.status(400).json({
          error: "tryonType is required for single product mode",
        });
      }

      const parsedProductTypes = JSON.parse(productTypes || '[]');
      const parsedProductNames = JSON.parse(productNames || '[]');

      // Save to database
      const tryOnId = await storage.createVirtualTryOn({
        modelImageUrl: `data:${modelImageFile.mimetype};base64,${modelImageFile.buffer.toString('base64')}`,
        tryonMode,
        tryonType: tryonMode === 'single' ? tryonType : null,
        preservePose: preservePose || 'yes',
        style: style || 'natural',
      });

      // Save product images
      for (let i = 0; i < productImageFiles.length; i++) {
        const file = productImageFiles[i];
        const base64Image = file.buffer.toString('base64');
        const dataUrl = `data:${file.mimetype};base64,${base64Image}`;

        await storage.createVirtualTryOnProduct({
          tryOnId,
          productImageUrl: dataUrl,
          productType: parsedProductTypes[i] || 'clothing',
          productName: parsedProductNames[i] || null,
        });
      }

      // Generate virtual try-on image
      console.log('[Virtual Try-On API] Generating virtual try-on image...');
      
      const imageUrl = await generateVirtualTryOn(
        modelImageFile.buffer,
        modelImageFile.mimetype,
        productImageFiles.map((file, i) => ({
          imageBuffer: file.buffer,
          imageMimeType: file.mimetype,
          productType: parsedProductTypes[i] || 'clothing',
          productName: parsedProductNames[i] || undefined,
        })),
        {
          tryonMode,
          tryonType: tryonMode === 'single' ? tryonType : undefined,
          preservePose: preservePose || 'yes',
          style: style || 'natural',
          aspectRatio,
        }
      );

      // Update result
      await storage.updateVirtualTryOnResult(tryOnId, imageUrl);

      console.log('[Virtual Try-On API] ✅ Generation successful');

      res.json({
        tryOnId,
        imageUrl,
        message: "Virtual try-on generated successfully",
      });

    } catch (error: any) {
      console.error("[Virtual Try-On API] ❌ Error:", error);
      
      const isClientError = 
        error.message?.includes("required") || 
        error.message?.includes("invalid") ||
        error.message?.includes("INVALID_ARGUMENT");
      
      res.status(isClientError ? 400 : 500).json({
        error: isClientError ? error.message : "Failed to generate virtual try-on",
        message: error.message,
      });
    }
  });

  // E-commerce Scene API Route
  app.post("/api/generate-ecommerce-scene", upload.fields([
    { name: "modelImage", maxCount: 1 },
    { name: "assetImages", maxCount: 6 },
  ]), async (req, res) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
      const { sceneType, lighting, composition, aspectRatio, assetTypes, assetNames } = req.body;

      console.log('[E-commerce Scene API] Request received');
      console.log('[E-commerce Scene API] Scene Type:', sceneType);

      const modelImageFile = files?.modelImage?.[0];
      const assetImageFiles = files?.assetImages || [];

      if (!modelImageFile) {
        return res.status(400).json({
          error: "Model image is required",
        });
      }

      if (assetImageFiles.length === 0) {
        return res.status(400).json({
          error: "At least one asset (product or prop) is required",
        });
      }

      if (assetImageFiles.length > 6) {
        return res.status(400).json({
          error: "Maximum 6 assets allowed (model + 2-3 products + 1-2 props)",
        });
      }

      if (!sceneType || !lighting || !composition || !aspectRatio) {
        return res.status(400).json({
          error: "Missing required fields: sceneType, lighting, composition, aspectRatio",
        });
      }

      const parsedAssetTypes = JSON.parse(assetTypes || '[]');
      const parsedAssetNames = JSON.parse(assetNames || '[]');

      // Save to database
      const sceneId = await storage.createEcommerceScene({
        modelImageUrl: `data:${modelImageFile.mimetype};base64,${modelImageFile.buffer.toString('base64')}`,
        sceneType,
        lighting,
        composition,
        aspectRatio,
      });

      // Save asset images
      for (let i = 0; i < assetImageFiles.length; i++) {
        const file = assetImageFiles[i];
        const base64Image = file.buffer.toString('base64');
        const dataUrl = `data:${file.mimetype};base64,${base64Image}`;

        await storage.createEcommerceSceneAsset({
          sceneId,
          assetType: parsedAssetTypes[i] || 'product',
          assetImageUrl: dataUrl,
          assetName: parsedAssetNames[i] || null,
        });
      }

      // Generate e-commerce scene
      console.log('[E-commerce Scene API] Generating e-commerce scene...');
      
      const imageUrl = await generateEcommerceScene(
        modelImageFile.buffer,
        modelImageFile.mimetype,
        assetImageFiles.map((file, i) => ({
          assetType: parsedAssetTypes[i] || 'product',
          imageBuffer: file.buffer,
          imageMimeType: file.mimetype,
          assetName: parsedAssetNames[i] || undefined,
        })),
        {
          sceneType,
          lighting,
          composition,
          aspectRatio,
        }
      );

      // Update result
      await storage.updateEcommerceSceneResult(sceneId, imageUrl);

      console.log('[E-commerce Scene API] ✅ Generation successful');

      res.json({
        sceneId,
        imageUrl,
        message: "E-commerce scene generated successfully",
      });

    } catch (error: any) {
      console.error("[E-commerce Scene API] ❌ Error:", error);
      
      const isClientError = 
        error.message?.includes("required") || 
        error.message?.includes("invalid") ||
        error.message?.includes("INVALID_ARGUMENT");
      
      res.status(isClientError ? 400 : 500).json({
        error: isClientError ? error.message : "Failed to generate e-commerce scene",
        message: error.message,
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
