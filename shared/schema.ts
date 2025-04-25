import { pgTable, text, serial, integer, boolean, jsonb, varchar, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  name: text("name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  userId: integer("user_id").notNull().references(() => users.id),
  customPrompt: text("custom_prompt"),
  preferredModel: text("preferred_model"), // "gemini" or "chatgpt"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const ocrResults = pgTable("ocr_results", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id),
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size"),
  originalImagePath: text("original_image_path"),
  geminiData: text("gemini_data"),
  openaiData: text("openai_data"),
  geminiResult: text("gemini_result"),
  openaiResult: text("openai_result"),
  selectedResult: text("selected_result"), // "gemini" or "openai"
  status: text("status").notNull(), // "processing", "complete", "failed"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  name: true,
});

export const insertProjectSchema = createInsertSchema(projects).pick({
  name: true,
  description: true,
  userId: true,
  customPrompt: true,
  preferredModel: true,
});

export const insertOcrResultSchema = createInsertSchema(ocrResults).pick({
  projectId: true,
  fileName: true,
  fileSize: true,
  originalImagePath: true,
  status: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

export type InsertOcrResult = z.infer<typeof insertOcrResultSchema>;
export type OcrResult = typeof ocrResults.$inferSelect;

// Validation schemas
export const projectFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  customPrompt: z.string().optional(),
});

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  email: z.string().email("Invalid email address"),
  name: z.string().optional(),
});
