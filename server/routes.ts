import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { extractTextWithGemini, compareAndMergeResults as geminiCompare } from "./gemini";
import { extractTextWithOpenAI, compareAndMergeResults as openaiCompare } from "./openai";
import { z } from "zod";
import { insertProjectSchema, insertOcrResultSchema, projectFormSchema } from "@shared/schema";

const upload = multer({
  storage: multer.diskStorage({
    destination: async function (req, file, cb) {
      const uploadDir = path.join(process.cwd(), "uploads");
      try {
        await fs.mkdir(uploadDir, { recursive: true });
        cb(null, uploadDir);
      } catch (error) {
        cb(error, uploadDir);
      }
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + "-" + file.originalname);
    }
  }),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Authentication middleware
function isAuthenticated(req: Request, res: Response, next: Function) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).send("Unauthorized");
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Sets up /api/register, /api/login, /api/logout, /api/user
  setupAuth(app);

  // Project routes
  app.get("/api/projects", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const projects = await storage.getProjects(userId);
      res.json(projects);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/projects", isAuthenticated, async (req, res) => {
    try {
      const validation = projectFormSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors });
      }

      const userId = req.user!.id;
      const project = await storage.createProject({
        ...req.body,
        userId,
      });
      res.status(201).json(project);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/projects/:id", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      if (isNaN(projectId)) {
        return res.status(400).json({ error: "Invalid project ID" });
      }

      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      if (project.userId !== req.user!.id) {
        return res.status(403).json({ error: "Forbidden" });
      }

      res.json(project);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/projects/:id", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      if (isNaN(projectId)) {
        return res.status(400).json({ error: "Invalid project ID" });
      }

      const validation = projectFormSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors });
      }

      const existingProject = await storage.getProject(projectId);
      if (!existingProject) {
        return res.status(404).json({ error: "Project not found" });
      }

      if (existingProject.userId !== req.user!.id) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const updatedProject = await storage.updateProject(projectId, req.body);
      res.json(updatedProject);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/projects/:id", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      if (isNaN(projectId)) {
        return res.status(400).json({ error: "Invalid project ID" });
      }

      const existingProject = await storage.getProject(projectId);
      if (!existingProject) {
        return res.status(404).json({ error: "Project not found" });
      }

      if (existingProject.userId !== req.user!.id) {
        return res.status(403).json({ error: "Forbidden" });
      }

      await storage.deleteProject(projectId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/projects/:id/results", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      if (isNaN(projectId)) {
        return res.status(400).json({ error: "Invalid project ID" });
      }

      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      if (project.userId !== req.user!.id) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const results = await storage.getOcrResults(projectId);
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // OCR processing routes
  app.post("/api/projects/:id/process", isAuthenticated, upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image uploaded" });
      }

      const projectId = parseInt(req.params.id);
      if (isNaN(projectId)) {
        return res.status(400).json({ error: "Invalid project ID" });
      }

      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      if (project.userId !== req.user!.id) {
        return res.status(403).json({ error: "Forbidden" });
      }

      // Create initial OCR result entry
      const ocrResult = await storage.createOcrResult({
        projectId,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        originalImagePath: req.file.path,
        status: "processing",
      });

      // Read image as base64
      const imageBuffer = await fs.readFile(req.file.path);
      const base64Image = imageBuffer.toString("base64");

      // Process with both AI models
      try {
        // Extract text with both models
        const [geminiData, openaiData] = await Promise.all([
          extractTextWithGemini(base64Image),
          extractTextWithOpenAI(base64Image)
        ]);

        // Get correction from both models
        const [geminiResult, openaiResult] = await Promise.all([
          geminiCompare(geminiData, openaiData, project.customPrompt),
          openaiCompare(geminiData, openaiData, project.customPrompt)
        ]);

        // Update the OCR result with the processed data
        const updatedResult = await storage.updateOcrResult(ocrResult.id, {
          geminiData,
          openaiData,
          geminiResult,
          openaiResult,
          status: "complete"
        });

        res.json(updatedResult);
      } catch (error) {
        await storage.updateOcrResult(ocrResult.id, {
          status: "failed",
        });
        throw error;
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/projects/:id/results/:resultId/select", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const resultId = parseInt(req.params.resultId);
      
      if (isNaN(projectId) || isNaN(resultId)) {
        return res.status(400).json({ error: "Invalid ID parameters" });
      }

      const selectedModel = req.body.model;
      if (!selectedModel || !["gemini", "openai"].includes(selectedModel)) {
        return res.status(400).json({ error: "Invalid model selection" });
      }

      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      if (project.userId !== req.user!.id) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const result = await storage.getOcrResult(resultId);
      if (!result) {
        return res.status(404).json({ error: "Result not found" });
      }

      if (result.projectId !== projectId) {
        return res.status(400).json({ error: "Result does not belong to the specified project" });
      }

      const updatedResult = await storage.updateOcrResult(resultId, {
        selectedResult: selectedModel
      });

      // Also update the project's preferred model
      await storage.updateProject(projectId, {
        preferredModel: selectedModel
      });

      res.json(updatedResult);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/projects/:id/deploy", isAuthenticated, upload.array("images", 10), async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      if (isNaN(projectId)) {
        return res.status(400).json({ error: "Invalid project ID" });
      }

      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No images uploaded" });
      }

      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      if (project.userId !== req.user!.id) {
        return res.status(403).json({ error: "Forbidden" });
      }

      // Check if project has a preferred model
      if (!project.preferredModel) {
        return res.status(400).json({ 
          error: "No preferred model set for this project. Please test and select a model first." 
        });
      }

      // Create placeholder results for all uploaded files
      const results = await Promise.all(files.map(file => 
        storage.createOcrResult({
          projectId,
          fileName: file.originalname,
          fileSize: file.size,
          originalImagePath: file.path,
          status: "processing",
        })
      ));

      // Process each file in parallel
      const processPromises = files.map(async (file, index) => {
        try {
          const resultId = results[index].id;
          const imageBuffer = await fs.readFile(file.path);
          const base64Image = imageBuffer.toString("base64");

          let geminiData, openaiData, finalResult;

          // Extract text with both models
          [geminiData, openaiData] = await Promise.all([
            extractTextWithGemini(base64Image),
            extractTextWithOpenAI(base64Image)
          ]);

          // Process with preferred model only
          if (project.preferredModel === "gemini") {
            finalResult = await geminiCompare(geminiData, openaiData, project.customPrompt);
          } else {
            finalResult = await openaiCompare(geminiData, openaiData, project.customPrompt);
          }

          // Update the OCR result
          return storage.updateOcrResult(resultId, {
            geminiData,
            openaiData,
            geminiResult: project.preferredModel === "gemini" ? finalResult : null,
            openaiResult: project.preferredModel === "openai" ? finalResult : null,
            selectedResult: project.preferredModel,
            status: "complete"
          });
        } catch (error) {
          console.error(`Error processing file ${index}:`, error);
          return storage.updateOcrResult(results[index].id, {
            status: "failed",
          });
        }
      });

      // Send initial response with result IDs
      res.status(202).json({
        message: "Processing started",
        resultIds: results.map(r => r.id)
      });

      // Continue processing in the background
      processPromises.catch(err => {
        console.error("Error in batch processing:", err);
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  const httpServer = createServer(app);

  return httpServer;
}
