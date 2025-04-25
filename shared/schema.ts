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
  preferredModel: text("preferred_model"), // "gemini" or "openai"
  formFields: text("form_fields"), // JSON string of form field definitions
  exampleImagePath: text("example_image_path"), // Path to the example image used for field detection
  status: text("status").default("draft"), // "draft", "field_detection", "field_editing", "complete"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const formFields = pgTable("form_fields", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id),
  name: text("name").notNull(),
  label: text("label").notNull(),
  fieldType: text("field_type").notNull(), // "text", "number", "date", "checkbox", "radio", etc.
  required: boolean("required").default(false),
  options: text("options"), // JSON string for options in select/radio/checkbox fields
  defaultValue: text("default_value"),
  placeholder: text("placeholder"),
  validationRules: text("validation_rules"), // JSON string of validation rules
  order: integer("order").notNull(),
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
  extractedData: text("extracted_data"), // JSON string of extracted field values
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
  formFields: true,
  exampleImagePath: true,
  status: true,
});

export const insertFormFieldSchema = createInsertSchema(formFields).pick({
  projectId: true,
  name: true,
  label: true,
  fieldType: true,
  required: true,
  options: true,
  defaultValue: true,
  placeholder: true,
  validationRules: true,
  order: true,
});

export const insertOcrResultSchema = createInsertSchema(ocrResults).pick({
  projectId: true,
  fileName: true,
  fileSize: true,
  originalImagePath: true,
  extractedData: true,
  status: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

export type InsertFormField = z.infer<typeof insertFormFieldSchema>;
export type FormField = typeof formFields.$inferSelect;

export type InsertOcrResult = z.infer<typeof insertOcrResultSchema>;
export type OcrResult = typeof ocrResults.$inferSelect;

// Validation schemas
export const projectBasicInfoSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  customPrompt: z.string().optional(),
});

export const formFieldSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "Field name is required"),
  label: z.string().nullable().transform(val => val || ""), // Allow null labels but transform to empty string
  fieldType: z.enum(["text", "number", "date", "email", "tel", "checkbox", "radio", "select", "textarea"]),
  required: z.boolean().default(false),
  options: z.union([z.string(), z.array(z.string()), z.null()]).optional().transform(val => 
    typeof val === 'string' ? val : Array.isArray(val) ? JSON.stringify(val) : null
  ),
  defaultValue: z.union([z.string(), z.number(), z.boolean(), z.null()]).optional().transform(val => 
    val === null ? "" : String(val)
  ),
  placeholder: z.union([z.string(), z.null()]).optional().transform(val => val || ""),
  validationRules: z.string().optional(),
  order: z.number(),
});

export const formFieldsSchema = z.array(formFieldSchema);

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
