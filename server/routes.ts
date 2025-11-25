import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage.ts";
import { generateProductDesignEnhanced, generateModelSceneEnhanced } from "./geminiEnhanced.ts";
import { extractDesignSpecification, type DesignSpecification } from "./designSpecExtractor.ts";
import { generateModelTryOn } from "./modelTryOnGenerator.ts";
import { generateVirtualTryOn } from "./virtualTryOnGenerator.ts";
import { generateEcommerceScene } from "./ecommerceSceneGenerator.ts";
import { generatePosterDesign } from "./posterDesignGenerator.ts";
import multer from "multer";
import { readFileSync } from "fs";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit - support larger high-quality images
  },
  fileFilter: (req, file, cb) => {
    console.log('[Multer FileFilter] Checking file:', file.originalname);
    console.log('[Multer FileFilter] MIME type:', file.mimetype);
    
    // Accept wide range of image formats
    // Support: PNG, JPG/JPEG, WebP, GIF, BMP, SVG, TIFF, ICO, HEIC/HEIF, AVIF
    const isValidMimeType = 
      file.mimetype.startsWith('image/') || 
      file.mimetype === 'application/octet-stream'; // Some browsers send generic MIME for images
    
    const hasValidExtension = /\.(png|jpe?g|webp|gif|bmp|svg|tiff?|ico|heic|heif|avif)$/i.test(file.originalname);
    
    // Accept if either MIME type or extension is valid (more permissive)
    if (isValidMimeType || hasValidExtension) {
      console.log('[Multer FileFilter] ✅ File accepted');
      cb(null, true);
    } else {
      console.log('[Multer FileFilter] ❌ File rejected - invalid type');
      console.log('[Multer FileFilter] Hint: Supported formats - PNG, JPG, WebP, GIF, BMP, SVG, TIFF, HEIC, AVIF');
      cb(null, false); // Reject silently instead of throwing error
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║          REGISTERING API ROUTES - SERVER STARTUP           ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  
  // DEBUG: Test page route - MUST be under /api to bypass Vite middleware
  app.get("/api/test-page", (req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API Test Page</title>
    <style>
        body { font-family: system-ui, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
        button { padding: 10px 20px; font-size: 16px; cursor: pointer; background: #8b5cf6; color: white; border: none; border-radius: 6px; margin: 10px 5px; }
        #result { margin-top: 20px; padding: 15px; background: #f3f4f6; border-radius: 6px; white-space: pre-wrap; font-family: monospace; }
        .success { background: #d1fae5; color: #065f46; }
        .error { background: #fee2e2; color: #991b1b; }
    </style>
</head>
<body>
    <h1>🧪 API Test Page</h1>
    <p>This page tests POST requests to verify backend connectivity.</p>
    <button onclick="testPost()">Test POST Request</button>
    <div id="result">Click button to test...</div>
    <script>
        async function testPost() {
            const result = document.getElementById('result');
            result.textContent = 'Sending POST request...';
            result.className = '';
            try {
                const response = await fetch('/api/test-post', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ test: 'data', timestamp: new Date().toISOString() })
                });
                const data = await response.json();
                result.className = 'success';
                result.textContent = \`✅ SUCCESS!\\n\\nStatus: \${response.status}\\nResponse: \${JSON.stringify(data, null, 2)}\`;
            } catch (error) {
                result.className = 'error';
                result.textContent = \`❌ ERROR!\\n\\n\${error.message}\`;
            }
        }
    </script>
</body>
</html>`);
  });
  
  // DEBUG: Simple test route to verify POST requests work
  app.post("/api/test-post", (req, res) => {
    console.log('╔══════════════════════════════════════════════╗');
    console.log('║      TEST POST ROUTE - REQUEST RECEIVED       ║');
    console.log('╚══════════════════════════════════════════════╝');
    res.json({ message: "POST request received successfully!" });
  });
  
  console.log('[Route Registration] ✅ Registered GET /api/test-page');
  console.log('[Route Registration] ✅ Registered POST /api/test-post');

  // Prompt optimization endpoint for Product Design
  app.post("/api/optimize-design-prompt", async (req, res) => {
    try {
      const { 
        productType, 
        customProductType, 
        theme, 
        style, 
        color, 
        material, 
        designDescription 
      } = req.body;

      if (!productType || !theme || !style || !color || !material) {
        return res.status(400).json({
          error: "Missing required fields for prompt optimization",
        });
      }

      console.log('[Prompt Optimizer API] Optimizing design prompt...');
      
      const { generateOptimizedPrompts } = await import("./promptOptimizer.ts");
      const { getProductConfig } = await import("../shared/productConfig.ts");
      
      const config = getProductConfig(productType);
      const productName = productType === 'custom' && customProductType 
        ? customProductType 
        : config.displayName.en;
      
      const designInputs = {
        productType,
        customProductType,
        theme,
        style,
        color,
        material,
        designDescription,
        hasReferenceImage: false,
        hasBrandLogo: false,
      };
      
      const modelSceneInputs = {
        productDesignSummary: `${style} style ${theme} themed ${productName.toLowerCase()} in ${color} colors with ${material} materials`,
        productType,
        nationality: "International",
        familyCombination: "Adult",
        scenario: "Product showcase",
        location: "Studio",
        presentationStyle: "Professional product photography",
      };
      
      const optimizedPrompts = await generateOptimizedPrompts(designInputs, modelSceneInputs);
      
      console.log('[Prompt Optimizer API] ✅ Optimization successful');
      
      res.json({
        optimizedPrompt: optimizedPrompts.product_design_prompt,
        debugNotes: optimizedPrompts.debug_notes,
      });
      
    } catch (error: any) {
      console.error('[Prompt Optimizer API] ❌ Error:', error);
      res.status(500).json({
        error: "Failed to optimize prompt",
        message: error.message,
      });
    }
  });

  app.post("/api/optimize-model-prompt", async (req, res) => {
    try {
      const { 
        productType, 
        customProductType, 
        nationality,
        familyCombination,
        scenario,
        location,
        presentationStyle,
        description
      } = req.body;

      if (!nationality || !familyCombination || !scenario || !location || !presentationStyle) {
        return res.status(400).json({
          error: "Missing required fields for model prompt optimization",
        });
      }

      console.log('[Model Prompt Optimizer API] Optimizing model try-on prompt...');
      
      const { generateOptimizedPrompts } = await import("./promptOptimizer.ts");
      const { getProductConfig } = await import("../shared/productConfig.ts");
      
      const config = getProductConfig(productType || 'slippers');
      const productName = productType === 'custom' && customProductType 
        ? customProductType 
        : config.displayName.en;
      
      const designInputs = {
        productType: productType || 'slippers',
        customProductType,
        theme: "Product showcase",
        style: presentationStyle,
        color: "Product colors",
        material: "Product materials",
        designDescription: description || '',
        hasReferenceImage: false,
        hasBrandLogo: false,
      };
      
      const modelSceneInputs = {
        productDesignSummary: `${productName} product photography`,
        productType: productType || 'slippers',
        nationality,
        familyCombination,
        scenario,
        location,
        presentationStyle,
      };
      
      const optimizedPrompts = await generateOptimizedPrompts(designInputs, modelSceneInputs);
      
      console.log('[Model Prompt Optimizer API] ✅ Optimization successful');
      
      res.json({
        optimizedPrompt: optimizedPrompts.model_scene_prompt,
        debugNotes: optimizedPrompts.debug_notes,
      });
      
    } catch (error: any) {
      console.error('[Model Prompt Optimizer API] ❌ Error:', error);
      res.status(500).json({
        error: "Failed to optimize model prompt",
        message: error.message,
      });
    }
  });

  app.post("/api/optimize-virtual-tryon-prompt", async (req, res) => {
    try {
      const { 
        tryonType,
        customTryonType,
        tryonMode,
        description
      } = req.body;

      if (!tryonType || !tryonMode) {
        return res.status(400).json({
          error: "Missing required fields for virtual try-on prompt optimization",
        });
      }

      console.log('[Virtual Try-on Prompt Optimizer API] Optimizing virtual try-on prompt...');
      
      const { generateOptimizedPrompts } = await import("./promptOptimizer.ts");
      
      const productName = tryonType === 'custom' && customTryonType 
        ? customTryonType 
        : tryonType;
      
      const designInputs = {
        productType: tryonType,
        customProductType: customTryonType,
        theme: `Virtual try-on for ${productName}`,
        style: `${tryonMode} mode`,
        color: "Natural product colors",
        material: "Natural materials",
        designDescription: description || '',
        hasReferenceImage: false,
        hasBrandLogo: false,
      };
      
      const modelSceneInputs = {
        productDesignSummary: `Virtual try-on visualization for ${productName} in ${tryonMode} mode`,
        productType: tryonType,
        nationality: "International",
        familyCombination: "Adult",
        scenario: "Virtual try-on",
        location: "Studio",
        presentationStyle: "Professional fashion photography",
      };
      
      const optimizedPrompts = await generateOptimizedPrompts(designInputs, modelSceneInputs);
      
      console.log('[Virtual Try-on Prompt Optimizer API] ✅ Optimization successful');
      
      res.json({
        optimizedPrompt: optimizedPrompts.model_scene_prompt,
        debugNotes: optimizedPrompts.debug_notes,
      });
      
    } catch (error: any) {
      console.error('[Virtual Try-on Prompt Optimizer API] ❌ Error:', error);
      res.status(500).json({
        error: "Failed to optimize virtual try-on prompt",
        message: error.message,
      });
    }
  });

  app.post("/api/optimize-scene-prompt", async (req, res) => {
    try {
      const { 
        sceneType,
        customSceneType,
        lighting,
        customLighting,
        compositionStyle,
        customComposition,
        description
      } = req.body;

      if (!sceneType || !lighting || !compositionStyle) {
        return res.status(400).json({
          error: "Missing required fields for scene prompt optimization",
        });
      }

      console.log('[Scene Prompt Optimizer API] Optimizing e-commerce scene prompt...');
      
      const { generateOptimizedPrompts } = await import("./promptOptimizer.ts");
      
      const sceneName = sceneType === 'custom' && customSceneType 
        ? customSceneType 
        : sceneType;
      
      const effectiveLighting = lighting === 'custom' && customLighting 
        ? customLighting 
        : lighting;
      
      const effectiveComposition = compositionStyle === 'custom' && customComposition 
        ? customComposition 
        : compositionStyle;
      
      const designInputs = {
        productType: 'custom' as const,
        customProductType: 'product',
        theme: `E-commerce scene in ${sceneName}`,
        style: effectiveComposition,
        color: "Natural scene colors",
        material: "Natural materials",
        designDescription: description || '',
        hasReferenceImage: false,
        hasBrandLogo: false,
      };
      
      const modelSceneInputs = {
        productDesignSummary: `E-commerce photography scene in ${sceneName} with ${effectiveLighting} lighting`,
        productType: 'custom' as const,
        nationality: "International",
        familyCombination: "Adult",
        scenario: sceneName,
        location: sceneName,
        presentationStyle: `${compositionStyle} composition`,
      };
      
      const optimizedPrompts = await generateOptimizedPrompts(designInputs, modelSceneInputs);
      
      console.log('[Scene Prompt Optimizer API] ✅ Optimization successful');
      
      res.json({
        optimizedPrompt: optimizedPrompts.model_scene_prompt,
        debugNotes: optimizedPrompts.debug_notes,
      });
      
    } catch (error: any) {
      console.error('[Scene Prompt Optimizer API] ❌ Error:', error);
      res.status(500).json({
        error: "Failed to optimize scene prompt",
        message: error.message,
      });
    }
  });

  app.post("/api/optimize-poster-prompt", async (req, res) => {
    try {
      const { 
        campaignType,
        customCampaignType,
        visualStyle,
        layoutType,
        description
      } = req.body;

      if (!campaignType || !visualStyle || !layoutType) {
        return res.status(400).json({
          error: "Missing required fields for poster prompt optimization",
        });
      }

      console.log('[Poster Prompt Optimizer API] Optimizing e-commerce poster prompt...');
      
      const { generateOptimizedPrompts } = await import("./promptOptimizer.ts");
      
      const campaignName = campaignType === 'custom' && customCampaignType 
        ? customCampaignType 
        : campaignType;
      
      const designInputs = {
        productType: 'custom' as const,
        customProductType: 'poster',
        theme: `${campaignName} campaign`,
        style: visualStyle,
        color: "Brand colors",
        material: "Digital marketing",
        designDescription: description || '',
        hasReferenceImage: false,
        hasBrandLogo: false,
      };
      
      const modelSceneInputs = {
        productDesignSummary: `Marketing poster for ${campaignName} campaign in ${visualStyle} style`,
        productType: 'custom' as const,
        nationality: "International",
        familyCombination: "All",
        scenario: campaignName,
        location: "Marketing scene",
        presentationStyle: `${layoutType} layout`,
      };
      
      const optimizedPrompts = await generateOptimizedPrompts(designInputs, modelSceneInputs);
      
      console.log('[Poster Prompt Optimizer API] ✅ Optimization successful');
      
      res.json({
        optimizedPrompt: optimizedPrompts.model_scene_prompt,
        debugNotes: optimizedPrompts.debug_notes,
      });
      
    } catch (error: any) {
      console.error('[Poster Prompt Optimizer API] ❌ Error:', error);
      res.status(500).json({
        error: "Failed to optimize poster prompt",
        message: error.message,
      });
    }
  });

  app.post(
    "/api/generate-design",
    // Pre-Multer logger
    (req: Request, res: Response, next) => {
      console.log('╔═══════════════════════════════════════════════════════════╗');
      console.log('║   PRE-MULTER: POST /api/generate-design REQUEST RECEIVED  ║');
      console.log('╚═══════════════════════════════════════════════════════════╝');
      console.log('[Pre-Multer] Content-Type:', req.get('content-type'));
      console.log('[Pre-Multer] Method:', req.method);
      console.log('[Pre-Multer] Path:', req.path);
      next();
    },
    // Multer file upload middleware
    upload.fields([
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
    ]),
    // Main route handler
    async (req, res) => {
      console.log('[API] ========================================');
      console.log('[API] POST /api/generate-design received');
      console.log('[API] ========================================');
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
      
      const referenceImageFile = files?.referenceImage?.[0];
      const brandLogoFile = files?.brandLogo?.[0];

      const { 
        theme, 
        style, 
        color, 
        material, 
        angles, 
        designDescription, 
        customOptimizedPrompt,
        customTheme,
        customStyle,
        customColor,
        customMaterial
      } = req.body;

      if (!theme || !style || !color || !material) {
        return res.status(400).json({
          error: "Missing required fields: theme, style, color, material",
        });
      }

      // Use custom values if "Custom" is selected
      const actualTheme = theme === "Custom" && customTheme ? customTheme : theme;
      const actualStyle = style === "Custom" && customStyle ? customStyle : style;
      const actualColor = color === "Custom" && customColor ? customColor : color;
      const actualMaterial = material === "Custom" && customMaterial ? customMaterial : material;

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
          actualTheme,
          actualStyle,
          actualColor,
          actualMaterial,
          firstAngle,
          referenceImageFile?.buffer,
          referenceImageFile?.mimetype,
          brandLogoFile?.buffer,
          brandLogoFile?.mimetype,
          designDescription,
          undefined, // canonicalDesignBuffer
          undefined, // canonicalDesignMimeType
          undefined, // designSpecification
          customOptimizedPrompt // Pass custom optimized prompt for first angle
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
            actualTheme,
            actualStyle,
            actualColor,
            actualMaterial,
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
        theme: actualTheme,
        style: actualStyle,
        color: actualColor,
        material: actualMaterial,
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
        error: isClientError ? error.message : "Failed to generate product design",
        message: error.message,
      });
    }
  });

  app.post("/api/generate-model", upload.single("productImage"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: "No product design image uploaded",
        });
      }

      const {
        nationality,
        familyCombination,
        scenario,
        location,
        presentationStyle,
        viewAngles,
      } = req.body;

      if (!nationality || !familyCombination || !scenario || !location || !presentationStyle) {
        return res.status(400).json({
          error: "Missing required fields",
        });
      }

      // Parse viewAngles from JSON string
      let parsedViewAngles: string[] = [];
      try {
        parsedViewAngles = viewAngles ? JSON.parse(viewAngles) : ["Front View"];
      } catch (e) {
        parsedViewAngles = ["Front View"];
      }

      if (parsedViewAngles.length === 0) {
        parsedViewAngles = ["Front View"];
      }

      console.log(`Generating model wearing scene with ${parsedViewAngles.length} view angle(s): ${parsedViewAngles.join(', ')}`);

      // Generate images for each view angle
      const modelImages: Array<{ viewAngle: string; imageUrl: string }> = [];
      
      for (const viewAngle of parsedViewAngles) {
        console.log(`Generating ${viewAngle}...`);
        const modelImage = await generateModelSceneEnhanced(
          req.body.productType || 'slippers',
          req.body.customProductType,
          req.file.buffer,
          req.file.mimetype,
          nationality,
          familyCombination,
          scenario,
          location,
          presentationStyle,
          viewAngle
        );

        modelImages.push({
          viewAngle,
          imageUrl: modelImage,
        });

        // Save each generated image
        await storage.saveGeneratedImage({
          type: "model_wearing",
          imageUrl: modelImage,
          metadata: {
            nationality,
            familyCombination,
            scenario,
            location,
            presentationStyle,
            viewAngle,
          },
        });
      }

      console.log(`✅ Successfully generated ${modelImages.length} model scene(s)`);
      res.json({ modelImages });
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
  app.post("/api/generate-model-tryon", (req, res, next) => {
    console.log('[Model Try-On API] ===== RAW REQUEST RECEIVED =====');
    console.log('[Model Try-On API] Request method:', req.method);
    console.log('[Model Try-On API] Request path:', req.path);
    console.log('[Model Try-On API] Content-Type:', req.get('content-type'));
    next();
  }, upload.array('productImages', 10), async (req, res) => {
    console.log('[Model Try-On API] ===== AFTER MULTER =====');
    try {
      const files = req.files as Express.Multer.File[] | undefined;
      const { modelOptions, productTypes, productTypesCustom } = req.body;

      console.log('[Model Try-On API] Request received');
      console.log('[Model Try-On API] Files:', files?.length || 0);
      console.log('[Model Try-On API] Model Options:', modelOptions ? 'Present' : 'Missing');

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

      // Validate custom dimensions if aspectRatio is 'custom'
      let customWidth: number | null = null;
      let customHeight: number | null = null;
      
      if (options.aspectRatio === 'custom') {
        const width = parseInt(options.customWidth || '');
        const height = parseInt(options.customHeight || '');
        
        if (isNaN(width) || isNaN(height)) {
          return res.status(400).json({
            error: "Custom dimensions are required when using custom aspect ratio",
          });
        }
        
        if (width < 100 || width > 4096 || height < 100 || height > 4096) {
          return res.status(400).json({
            error: "Custom dimensions must be between 100 and 4096 pixels",
          });
        }
        
        customWidth = width;
        customHeight = height;
      }

      // Save try-on session to database
      const tryOnId = await storage.createModelTryOn({
        nationality: options.nationality,
        nationalityCustom: options.nationalityCustom || null,
        scenario: options.scenario || null,
        scenarioCustom: options.scenarioCustom || null,
        location: options.location || null,
        locationCustom: options.locationCustom || null,
        presentationStyle: options.presentationStyle || null,
        presentationStyleCustom: options.presentationStyleCustom || null,
        hairstyle: options.hairstyle,
        hairstyleCustom: options.hairstyleCustom || null,
        combination: options.combination,
        combinationCustom: options.combinationCustom || null,
        scene: options.scene,
        sceneCustom: options.sceneCustom || null,
        pose: options.pose,
        poseCustom: options.poseCustom || null,
        aspectRatio: options.aspectRatio,
        customWidth,
        customHeight,
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
            customWidth,
            customHeight,
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
      const { tryonMode, tryonType, customTryonType, preservePose, style, customStyle, aspectRatio, productTypes, productNames } = req.body;

      console.log('[Virtual Try-On API] Request received');
      console.log('[Virtual Try-On API] Mode:', tryonMode);
      if (customTryonType) {
        console.log('[Virtual Try-On API] Custom Type:', customTryonType);
      }
      if (customStyle) {
        console.log('[Virtual Try-On API] Custom Style:', customStyle);
      }

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

      // Validate custom dimensions if aspectRatio is 'custom'
      let customWidth: number | null = null;
      let customHeight: number | null = null;
      const { customWidth: reqCustomWidth, customHeight: reqCustomHeight } = req.body;
      
      if (aspectRatio === 'custom') {
        const width = parseInt(reqCustomWidth || '');
        const height = parseInt(reqCustomHeight || '');
        
        if (isNaN(width) || isNaN(height)) {
          return res.status(400).json({
            error: "Custom dimensions are required when using custom aspect ratio",
          });
        }
        
        if (width < 100 || width > 4096 || height < 100 || height > 4096) {
          return res.status(400).json({
            error: "Custom dimensions must be between 100 and 4096 pixels",
          });
        }
        
        customWidth = width;
        customHeight = height;
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
        aspectRatio,
        customWidth,
        customHeight,
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
      
      // Use customTryonType if tryonType is 'custom', otherwise use tryonType
      const effectiveTryonType = tryonType === 'custom' && customTryonType 
        ? customTryonType 
        : tryonType;
      
      // Use customStyle if style is 'custom', otherwise use style
      const effectiveStyle = style === 'custom' && customStyle 
        ? customStyle 
        : (style || 'natural');
      
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
          tryonType: tryonMode === 'single' ? effectiveTryonType : undefined,
          preservePose: preservePose || 'yes',
          style: effectiveStyle,
          aspectRatio,
          customWidth: customWidth ?? undefined,
          customHeight: customHeight ?? undefined,
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
      const { sceneType, customSceneType, lighting, customLighting, composition, customComposition, aspectRatio, outputQuantity, assetTypes, assetNames, description, customOptimizedPrompt } = req.body;

      console.log('[E-commerce Scene API] Request received');
      console.log('[E-commerce Scene API] Scene Type:', sceneType);
      if (customSceneType) {
        console.log('[E-commerce Scene API] Custom Scene Type:', customSceneType);
      }
      if (customLighting) {
        console.log('[E-commerce Scene API] Custom Lighting:', customLighting);
      }
      if (customComposition) {
        console.log('[E-commerce Scene API] Custom Composition:', customComposition);
      }
      
      const quantity = parseInt(outputQuantity || '1', 10);
      
      // Validate output quantity
      if (isNaN(quantity) || quantity < 1 || quantity > 8) {
        return res.status(400).json({
          error: "Output quantity must be a number between 1 and 8",
        });
      }
      
      console.log('[E-commerce Scene API] Output Quantity:', quantity);

      const modelImageFile = files?.modelImage?.[0];
      const assetImageFiles = files?.assetImages || [];

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

      // Validate custom dimensions if aspectRatio is 'custom'
      let customWidth: number | null = null;
      let customHeight: number | null = null;
      const { customWidth: reqCustomWidth, customHeight: reqCustomHeight } = req.body;
      
      if (aspectRatio === 'custom') {
        const width = parseInt(reqCustomWidth || '');
        const height = parseInt(reqCustomHeight || '');
        
        if (isNaN(width) || isNaN(height)) {
          return res.status(400).json({
            error: "Custom dimensions are required when using custom aspect ratio",
          });
        }
        
        if (width < 100 || width > 4096 || height < 100 || height > 4096) {
          return res.status(400).json({
            error: "Custom dimensions must be between 100 and 4096 pixels",
          });
        }
        
        customWidth = width;
        customHeight = height;
      }

      const parsedAssetTypes = JSON.parse(assetTypes || '[]');
      const parsedAssetNames = JSON.parse(assetNames || '[]');

      // Save to database
      const sceneId = await storage.createEcommerceScene({
        modelImageUrl: modelImageFile 
          ? `data:${modelImageFile.mimetype};base64,${modelImageFile.buffer.toString('base64')}` 
          : null,
        sceneType,
        lighting,
        composition,
        aspectRatio,
        customWidth,
        customHeight,
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

      // Use custom values if selected, otherwise use defaults
      const effectiveLighting = lighting === 'custom' && customLighting 
        ? customLighting 
        : lighting;
      
      const effectiveComposition = composition === 'custom' && customComposition 
        ? customComposition 
        : composition;
      
      // Generate e-commerce scenes (multiple if outputQuantity > 1)
      console.log('[E-commerce Scene API] Generating e-commerce scene(s)...');
      console.log('[E-commerce Scene API] Has model image:', !!modelImageFile);
      
      const imageUrls: string[] = [];
      
      for (let i = 0; i < quantity; i++) {
        console.log(`[E-commerce Scene API] Generating image ${i + 1}/${quantity}...`);
        
        const imageUrl = await generateEcommerceScene(
          modelImageFile ? modelImageFile.buffer : null,
          modelImageFile ? modelImageFile.mimetype : null,
          assetImageFiles.map((file, idx) => ({
            assetType: parsedAssetTypes[idx] || 'product',
            imageBuffer: file.buffer,
            imageMimeType: file.mimetype,
            assetName: parsedAssetNames[idx] || undefined,
          })),
          {
            sceneType,
            customSceneType,
            lighting: effectiveLighting,
            customLighting: customLighting || undefined,
            composition: effectiveComposition,
            customComposition: customComposition || undefined,
            aspectRatio,
            customWidth: customWidth ?? undefined,
            customHeight: customHeight ?? undefined,
            designDescription: description,
            customOptimizedPrompt: customOptimizedPrompt,
            totalOutputs: quantity,
            currentIndex: i + 1,
          }
        );
        
        imageUrls.push(imageUrl);
      }

      // Update result (save first image as primary)
      await storage.updateEcommerceSceneResult(sceneId, imageUrls[0]);

      console.log(`[E-commerce Scene API] ✅ Successfully generated ${quantity} image(s)`);

      res.json({
        sceneId,
        imageUrl: imageUrls[0], // For backward compatibility
        imageUrls, // All generated images
        message: `E-commerce scene generated successfully (${quantity} image${quantity > 1 ? 's' : ''})`,
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

  // Generate Poster Design
  app.post("/api/generate-poster", upload.fields([
    { name: "productImages", maxCount: 6 },
    { name: "referenceImage", maxCount: 1 },
    { name: "logoImage", maxCount: 1 },
  ]), async (req, res) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
      const {
        campaignType,
        customCampaign,
        referenceLevel,
        customReferenceLevel,
        visualStyle,
        customVisualStyle,
        backgroundScene,
        customBackgroundScene,
        layout,
        customLayout,
        aspectRatio,
        customWidth,
        customHeight,
        outputQuantity,
        headlineStyle,
        customHeadline,
        autoGenerateHeadline,
        sellingPoints,
        autoGenerateSellingPoints,
        priceStyle,
        originalPrice,
        currentPrice,
        discountText,
        customPriceStyle,
        logoPosition,
        brandTagline,
      } = req.body;

      console.log('[Poster Design API] Request received');
      console.log('[Poster Design API] Campaign Type:', campaignType);
      console.log('[Poster Design API] Visual Style:', visualStyle);
      
      const quantity = parseInt(outputQuantity || '1', 10);
      
      // Validate output quantity
      if (isNaN(quantity) || quantity < 1 || quantity > 8) {
        return res.status(400).json({
          error: "Output quantity must be a number between 1 and 8",
        });
      }
      
      console.log('[Poster Design API] Output Quantity:', quantity);

      const productImageFiles = files?.productImages || [];
      const referenceImageFile = files?.referenceImage?.[0];
      const logoImageFile = files?.logoImage?.[0];

      // Validate required fields
      if (productImageFiles.length === 0) {
        return res.status(400).json({
          error: "At least one product image is required",
        });
      }

      if (productImageFiles.length > 6) {
        return res.status(400).json({
          error: "Maximum 6 product images allowed",
        });
      }

      if (!campaignType || !visualStyle || !backgroundScene || !layout || !aspectRatio || !headlineStyle) {
        return res.status(400).json({
          error: "Missing required fields: campaignType, visualStyle, backgroundScene, layout, aspectRatio, headlineStyle",
        });
      }

      // Validate custom dimensions if aspect ratio is custom
      if (aspectRatio === 'custom') {
        if (!customWidth || !customHeight) {
          return res.status(400).json({
            error: "Custom width and height are required when using custom aspect ratio",
          });
        }
        const width = parseInt(customWidth, 10);
        const height = parseInt(customHeight, 10);
        if (isNaN(width) || isNaN(height) || width < 100 || height < 100 || width > 4096 || height > 4096) {
          return res.status(400).json({
            error: "Custom dimensions must be between 100 and 4096 pixels",
          });
        }
      }

      // Parse selling points if provided as JSON string
      let parsedSellingPoints: string[] = [];
      if (sellingPoints) {
        try {
          parsedSellingPoints = JSON.parse(sellingPoints);
        } catch (error) {
          return res.status(400).json({
            error: "Invalid selling points format",
          });
        }
      }

      // Validate price fields if price display is enabled
      if (priceStyle && priceStyle !== 'no-price') {
        if (priceStyle === 'original-plus-sale' && (!originalPrice || !currentPrice)) {
          return res.status(400).json({
            error: "Both original price and current price are required for 'original + sale' display",
          });
        }
        if (priceStyle === 'percentage-off' && (!originalPrice || !currentPrice)) {
          return res.status(400).json({
            error: "Both original price and current price are required for percentage off calculation",
          });
        }
        if (priceStyle === 'final-price-only' && !currentPrice) {
          return res.status(400).json({
            error: "Current price is required for 'final price only' display",
          });
        }
      }

      // Prepare assets for generator
      const assets = {
        productImages: productImageFiles.map(file => ({
          buffer: file.buffer,
          mimeType: file.mimetype,
          name: file.originalname,
        })),
        referenceImage: referenceImageFile ? {
          buffer: referenceImageFile.buffer,
          mimeType: referenceImageFile.mimetype,
        } : undefined,
        logoImage: logoImageFile ? {
          buffer: logoImageFile.buffer,
          mimeType: logoImageFile.mimetype,
        } : undefined,
      };

      // Prepare options for generator
      const options = {
        campaignType,
        customCampaign,
        referenceLevel,
        customReferenceLevel,
        visualStyle,
        customVisualStyle,
        backgroundScene,
        customBackgroundScene,
        layout,
        customLayout,
        aspectRatio,
        customWidth: customWidth ? parseInt(customWidth, 10) : undefined,
        customHeight: customHeight ? parseInt(customHeight, 10) : undefined,
        headlineStyle,
        customHeadline,
        autoGenerateHeadline,
        sellingPoints: parsedSellingPoints,
        autoGenerateSellingPoints,
        priceStyle,
        originalPrice,
        currentPrice,
        discountText,
        customPriceStyle,
        logoPosition,
        brandTagline,
      };

      // Generate poster(s) first (don't save to DB until generation succeeds)
      console.log('[Poster Design API] Generating poster(s)...');
      
      const posterUrls: string[] = [];
      
      for (let i = 0; i < quantity; i++) {
        console.log(`[Poster Design API] Generating poster ${i + 1}/${quantity}...`);
        const posterUrl = await generatePosterDesign(assets, options);
        posterUrls.push(posterUrl);
      }

      // Only save to database after successful generation
      const posterId = await storage.createPosterRequest({
        campaignType,
        visualStyle,
        backgroundScene,
        layout,
        aspectRatio,
        customWidth: customWidth ? parseInt(customWidth, 10) : null,
        customHeight: customHeight ? parseInt(customHeight, 10) : null,
        headlineStyle,
        priceStyle: priceStyle || null,
        logoPosition: logoPosition || null,
        brandTagline: brandTagline || null,
      });

      // Update with generated result (save first poster as primary)
      await storage.updatePosterResult(posterId, posterUrls[0]);

      console.log(`[Poster Design API] ✅ Successfully generated ${quantity} poster(s)`);

      res.json({
        posterId,
        imageUrl: posterUrls[0],  // For backward compatibility
        imageUrls: posterUrls, // All generated posters
        message: `Poster generated successfully (${quantity} poster${quantity > 1 ? 's' : ''})`,
      });

    } catch (error: any) {
      console.error("[Poster Design API] ❌ Error:", error);
      
      const isClientError = 
        error.message?.includes("required") || 
        error.message?.includes("invalid") ||
        error.message?.includes("INVALID_ARGUMENT");
      
      res.status(isClientError ? 400 : 500).json({
        error: isClientError ? error.message : "Failed to generate poster",
        message: error.message,
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
