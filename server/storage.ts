import { users, type User, type InsertUser, projects, type Project, type InsertProject, ocrResults, type OcrResult, type InsertOcrResult } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

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
  
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private projects: Map<number, Project>;
  private ocrResults: Map<number, OcrResult>;
  private userCurrentId: number;
  private projectCurrentId: number;
  private ocrResultCurrentId: number;
  
  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.projects = new Map();
    this.ocrResults = new Map();
    this.userCurrentId = 1;
    this.projectCurrentId = 1;
    this.ocrResultCurrentId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const createdAt = new Date();
    const user: User = { ...insertUser, id, createdAt };
    this.users.set(id, user);
    return user;
  }
  
  // Project methods
  async getProjects(userId: number): Promise<Project[]> {
    return Array.from(this.projects.values()).filter(
      (project) => project.userId === userId,
    );
  }
  
  async getProject(id: number): Promise<Project | undefined> {
    return this.projects.get(id);
  }
  
  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = this.projectCurrentId++;
    const createdAt = new Date();
    const project: Project = { ...insertProject, id, createdAt };
    this.projects.set(id, project);
    return project;
  }
  
  async updateProject(id: number, data: Partial<Project>): Promise<Project | undefined> {
    const project = this.projects.get(id);
    if (!project) return undefined;
    
    const updatedProject: Project = { ...project, ...data };
    this.projects.set(id, updatedProject);
    return updatedProject;
  }
  
  async deleteProject(id: number): Promise<boolean> {
    return this.projects.delete(id);
  }
  
  // OCR Result methods
  async getOcrResults(projectId: number): Promise<OcrResult[]> {
    return Array.from(this.ocrResults.values()).filter(
      (result) => result.projectId === projectId,
    );
  }
  
  async getOcrResult(id: number): Promise<OcrResult | undefined> {
    return this.ocrResults.get(id);
  }
  
  async createOcrResult(insertResult: InsertOcrResult): Promise<OcrResult> {
    const id = this.ocrResultCurrentId++;
    const createdAt = new Date();
    const ocrResult: OcrResult = { 
      ...insertResult, 
      id, 
      createdAt, 
      geminiData: null, 
      openaiData: null, 
      geminiResult: null, 
      openaiResult: null, 
      selectedResult: null 
    };
    this.ocrResults.set(id, ocrResult);
    return ocrResult;
  }
  
  async updateOcrResult(id: number, data: Partial<OcrResult>): Promise<OcrResult | undefined> {
    const result = this.ocrResults.get(id);
    if (!result) return undefined;
    
    const updatedResult: OcrResult = { ...result, ...data };
    this.ocrResults.set(id, updatedResult);
    return updatedResult;
  }
}

export const storage = new MemStorage();
