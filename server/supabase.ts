import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, and } from "drizzle-orm";
import { 
  employees, profiles, canvasserActivities,
  type Employee, type InsertEmployee,
  type Profile, type InsertProfile,
  type CanvasserActivity, type InsertCanvasserActivity
} from "@shared/schema";

// Initialize Supabase connection
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const client = postgres(connectionString);
export const db = drizzle(client);

export class SupabaseStorage {
  // Employees (FAEs/Admins)
  async getEmployee(id: string): Promise<Employee | undefined> {
    const result = await db.select().from(employees).where(eq(employees.id, id)).limit(1);
    return result[0];
  }

  async getEmployeeByEmail(email: string): Promise<Employee | undefined> {
    const result = await db.select().from(employees).where(eq(employees.email, email)).limit(1);
    return result[0];
  }

  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    const result = await db.insert(employees).values({
      ...employee,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return result[0];
  }

  async updateEmployee(id: string, employee: Partial<InsertEmployee>): Promise<Employee | undefined> {
    const result = await db.update(employees)
      .set({ ...employee, updatedAt: new Date() })
      .where(eq(employees.id, id))
      .returning();
    return result[0];
  }

  async getAllEmployees(): Promise<Employee[]> {
    return await db.select().from(employees);
  }

  async getFAEs(): Promise<Employee[]> {
    return await db.select().from(employees).where(eq(employees.role, 'FAE'));
  }

  // Profiles (Canvassers/FAEs)
  async getProfile(id: string): Promise<Profile | undefined> {
    const result = await db.select().from(profiles).where(eq(profiles.id, id)).limit(1);
    return result[0];
  }

  async getProfileByEmail(email: string): Promise<Profile | undefined> {
    const result = await db.select().from(profiles).where(eq(profiles.email, email)).limit(1);
    return result[0];
  }

  async createProfile(profile: InsertProfile): Promise<Profile> {
    const result = await db.insert(profiles).values({
      ...profile,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return result[0];
  }

  async updateProfile(id: string, profile: Partial<InsertProfile>): Promise<Profile | undefined> {
    const result = await db.update(profiles)
      .set({ ...profile, updatedAt: new Date() })
      .where(eq(profiles.id, id))
      .returning();
    return result[0];
  }

  async getAllProfiles(): Promise<Profile[]> {
    return await db.select().from(profiles);
  }

  async getCanvassers(): Promise<Profile[]> {
    return await db.select().from(profiles).where(eq(profiles.role, 'canvasser'));
  }

  async getFAEs(): Promise<Profile[]> {
    return await db.select().from(profiles).where(eq(profiles.role, 'fae'));
  }

  async approveCanvasser(id: string, approvedBy: string): Promise<Profile | undefined> {
    const result = await db.update(profiles)
      .set({ 
        status: 'approved', 
        approvedBy,
        updatedAt: new Date() 
      })
      .where(eq(profiles.id, id))
      .returning();
    return result[0];
  }

  async rejectCanvasser(id: string): Promise<Profile | undefined> {
    const result = await db.update(profiles)
      .set({ 
        status: 'rejected',
        updatedAt: new Date() 
      })
      .where(eq(profiles.id, id))
      .returning();
    return result[0];
  }

  // Canvasser Activities
  async createCanvasserActivity(activity: InsertCanvasserActivity): Promise<CanvasserActivity> {
    const result = await db.insert(canvasserActivities).values({
      ...activity,
      createdAt: new Date()
    }).returning();
    return result[0];
  }

  async getCanvasserActivities(canvasserId?: string): Promise<CanvasserActivity[]> {
    if (canvasserId) {
      return await db.select().from(canvasserActivities)
        .where(eq(canvasserActivities.canvasserId, canvasserId));
    }
    return await db.select().from(canvasserActivities);
  }

  async updateCanvasserActivity(id: number, activity: Partial<InsertCanvasserActivity>): Promise<CanvasserActivity | undefined> {
    const result = await db.update(canvasserActivities)
      .set(activity)
      .where(eq(canvasserActivities.id, id))
      .returning();
    return result[0];
  }
}

export const supabaseStorage = new SupabaseStorage();