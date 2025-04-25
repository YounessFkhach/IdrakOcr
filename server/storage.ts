import { users, type User, type InsertUser, projects, type Project, type InsertProject, ocrResults, type OcrResult, type InsertOcrResult } from "@shared/schema";
import session from "express-session";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

// modify the interface with any CRUD methods
// you might need
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Project methods
  getProjects(userId: number): Promise<Project[]>;
  getProject(id: number): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, data: Partial<Project>): Promise<Project | undefined>;
  deleteProject(id: number): Promise<boolean>;
  
  // OCR Result methods
  getOcrResults(projectId: number): Promise<OcrResult[]>;
  getOcrResult(id: number): Promise<OcrResult | undefined>;
  createOcrResult(result: InsertOcrResult): Promise<OcrResult>;
  updateOcrResult(id: number, data: Partial<OcrResult>): Promise<OcrResult | undefined>;
  
  sessionStore: any; // Using any for session store as the type is complex
}

export class DatabaseStorage implements IStorage {
  sessionStore: any; // Using any for session store type as it's complex

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  
  // Project methods
  async getProjects(userId: number): Promise<Project[]> {
    return await db.select().from(projects).where(eq(projects.userId, userId));
  }
  
  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }
  
  async createProject(insertProject: InsertProject): Promise<Project> {
    const [project] = await db.insert(projects).values(insertProject).returning();
    return project;
  }
  
  async updateProject(id: number, data: Partial<Project>): Promise<Project | undefined> {
    const [project] = await db
      .update(projects)
      .set(data)
      .where(eq(projects.id, id))
      .returning();
    
    return project;
  }
  
  async deleteProject(id: number): Promise<boolean> {
    const result = await db.delete(projects).where(eq(projects.id, id));
    return result.count > 0;
  }
  
  // OCR Result methods
  async getOcrResults(projectId: number): Promise<OcrResult[]> {
    return await db.select().from(ocrResults).where(eq(ocrResults.projectId, projectId));
  }
  
  async getOcrResult(id: number): Promise<OcrResult | undefined> {
    const [result] = await db.select().from(ocrResults).where(eq(ocrResults.id, id));
    return result;
  }
  
  async createOcrResult(insertResult: InsertOcrResult): Promise<OcrResult> {
    const [result] = await db
      .insert(ocrResults)
      .values({
        ...insertResult,
        geminiData: null,
        openaiData: null,
        geminiResult: null,
        openaiResult: null,
        selectedResult: null
      })
      .returning();
    
    return result;
  }
  
  async updateOcrResult(id: number, data: Partial<OcrResult>): Promise<OcrResult | undefined> {
    const [result] = await db
      .update(ocrResults)
      .set(data)
      .where(eq(ocrResults.id, id))
      .returning();
    
    return result;
  }
}

export const storage = new DatabaseStorage();
