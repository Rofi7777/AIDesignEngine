import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateSlipperDesign, generateModelWearingScene } from "./gemini";
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
  app.post("/api/generate-design", upload.single("template"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: "No template file uploaded",
        });
      }

      const { theme, style, color, material, angles } = req.body;

      if (!theme || !style || !color || !material) {
        return res.status(400).json({
          error: "Missing required fields: theme, style, color, material",
        });
      }

      const anglesArray = JSON.parse(angles || '["top", "45degree"]');

      const results: { topView?: string; view45?: string } = {};

      // Generate both angles first
      if (anglesArray.includes("top")) {
        console.log("Generating top view design...");
        results.topView = await generateSlipperDesign(
          req.file.buffer,
          req.file.mimetype,
          theme,
          style,
          color,
          material,
          "top"
        );
      }

      if (anglesArray.includes("45degree")) {
        console.log("Generating 45-degree view design...");
        results.view45 = await generateSlipperDesign(
          req.file.buffer,
          req.file.mimetype,
          theme,
          style,
          color,
          material,
          "45degree"
        );
      }

      // Save both angles as a single design record
      await storage.saveCompleteDesign({
        topViewUrl: results.topView || null,
        view45Url: results.view45 || null,
        theme,
        style,
        color,
        material,
      });

      res.json(results);
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

      console.log("Generating model wearing scene...");
      const modelImage = await generateModelWearingScene(
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
