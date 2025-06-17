import { createClient } from "@supabase/supabase-js";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import { 
  employees, profiles, canvasserActivities, roles, userRoles,
  type Employee, type InsertEmployee,
  type Profile, type InsertProfile,
  type CanvasserActivity, type InsertCanvasserActivity,
  type Role, type InsertRole,
  type UserRole, type InsertUserRole,
  type UserWithRoles
} from "@shared/schema";

// Initialize Supabase client with URL and anon key (optional)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Only create Supabase client if both URL and key are available
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Skip DATABASE_URL connection if it's pointing to an invalid server
// Use Supabase client directly for all database operations
let db: any = null;

if (supabase) {
  console.log('Using Supabase client for database operations');
} else {
  console.warn('No Supabase client available - check SUPABASE_URL and SUPABASE_ANON_KEY');
}

export { db };

export class SupabaseStorage {
  // Employees (FAEs/Admins) - Using Supabase client directly
  async getEmployee(id: string): Promise<Employee | undefined> {
    try {
      if (db) {
        const result = await db.select().from(employees).where(eq(employees.id, id)).limit(1);
        return result[0];
      } else if (supabase) {
        const { data, error } = await supabase
          .from('employees')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) throw error;
        return data;
      }
      return undefined;
    } catch (error) {
      console.error('Error fetching employee:', error);
      return undefined;
    }
  }

  async getEmployeeByEmail(email: string): Promise<Employee | undefined> {
    try {
      if (db) {
        const result = await db.select().from(employees).where(eq(employees.email, email)).limit(1);
        return result[0];
      } else if (supabase) {
        const { data, error } = await supabase
          .from('employees')
          .select('*')
          .eq('email', email)
          .single();
        
        if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
        return data;
      }
      return undefined;
    } catch (error) {
      console.error('Error fetching employee by email:', error);
      return undefined;
    }
  }

  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { data, error } = await supabase
      .from('employees')
      .insert({
        email: employee.email,
        fullnames: employee.fullName,
        role: employee.role,
        department: employee.department,
        mobile_number: employee.phone,
        status: employee.status || 'active'
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create employee: ${error.message}`);
    }

    return {
      id: data.id,
      email: data.email,
      fullName: data.fullnames,
      role: data.role,
      department: data.department,
      phone: data.mobile_number,
      status: data.status,
      supabaseUserId: data.supabase_user_id,
      createdAt: data.created_at ? new Date(data.created_at) : null,
      updatedAt: data.updated_at ? new Date(data.updated_at) : null
    };
  }

  async updateEmployee(id: string, employee: Partial<InsertEmployee>): Promise<Employee | undefined> {
    const result = await db.update(employees)
      .set({ ...employee, updatedAt: new Date() })
      .where(eq(employees.id, id))
      .returning();
    return result[0];
  }

  async getAllEmployees(): Promise<Employee[]> {
    try {
      const result = await db.select().from(employees);
      return result;
    } catch (error) {
      console.error('Error fetching all employees:', error);
      return [];
    }
  }

  async getFAEs(): Promise<Employee[]> {
    try {
      const result = await db.select().from(employees).where(eq(employees.role, 'FAE'));
      return result;
    } catch (error) {
      console.error('Error fetching FAEs:', error);
      return [];
    }
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
      id: Math.floor(Math.random() * 1000000),
      createdAt: new Date()
    }).returning();
    return result[0];
  }

  async getCanvasserActivities(canvasserId?: string): Promise<CanvasserActivity[]> {
    if (canvasserId) {
      return await db.select().from(canvasserActivities).where(eq(canvasserActivities.profileId, canvasserId));
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

  // Role Management
  async createRole(role: InsertRole): Promise<Role> {
    if (db) {
      const result = await db.insert(roles).values({
        ...role,
        createdAt: new Date()
      }).returning();
      return result[0];
    } else if (supabase) {
      const { data, error } = await supabase
        .from('roles')
        .insert({
          ...role,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }
    throw new Error('No database connection available');
  }

  async getAllRoles(): Promise<Role[]> {
    if (db) {
      return await db.select().from(roles);
    } else if (supabase) {
      const { data, error } = await supabase
        .from('roles')
        .select('*');
      
      if (error) throw error;
      return data || [];
    }
    return [];
  }

  async getRoleByName(name: string): Promise<Role | undefined> {
    if (db) {
      const result = await db.select().from(roles).where(eq(roles.name, name)).limit(1);
      return result[0];
    } else if (supabase) {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .eq('name', name)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }
    return undefined;
  }

  // User Role Management
  async assignUserRole(userId: string, roleName: string): Promise<UserRole | undefined> {
    try {
      const role = await this.getRoleByName(roleName);
      if (!role) {
        console.error(`Role ${roleName} not found`);
        return undefined;
      }

      if (db) {
        const result = await db.insert(userRoles).values({
          userId,
          roleId: role.id,
          createdAt: new Date()
        }).returning();
        return result[0];
      } else if (supabase) {
        const { data, error } = await supabase
          .from('user_roles')
          .insert({
            user_id: userId,
            role_id: role.id,
            created_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
      return undefined;
    } catch (error) {
      console.error('Error assigning user role:', error);
      return undefined;
    }
  }

  async getUserRoles(userId: string): Promise<string[]> {
    try {
      if (db) {
        const result = await db
          .select({ roleName: roles.name })
          .from(userRoles)
          .innerJoin(roles, eq(userRoles.roleId, roles.id))
          .where(eq(userRoles.userId, userId));
        
        return result.map((row: any) => row.roleName);
      } else if (supabase) {
        const { data, error } = await supabase
          .from('user_roles')
          .select(`
            roles (
              name
            )
          `)
          .eq('user_id', userId);
        
        if (error) throw error;
        return data?.map((item: any) => item.roles.name) || [];
      }
      return [];
    } catch (error) {
      console.error('Error fetching user roles:', error);
      return [];
    }
  }

  async getUserWithRoles(userId: string): Promise<UserWithRoles | null> {
    try {
      if (!supabase) return null;

      // Get user from Supabase auth
      const { data: { user }, error } = await supabase.auth.admin.getUserById(userId);
      if (error || !user) return null;

      // Get user roles
      const roles = await this.getUserRoles(userId);

      // Get employee data if user has FAE/ADMIN role
      let employee = null;
      if (roles.includes('FAE') || roles.includes('ADMIN')) {
        employee = await this.getEmployeeBySupabaseUserId(userId);
      }

      return {
        id: userId,
        email: user.email || null,
        roles,
        employee
      };
    } catch (error) {
      console.error('Error getting user with roles:', error);
      return null;
    }
  }

  async getEmployeeBySupabaseUserId(supabaseUserId: string): Promise<Employee | undefined> {
    try {
      const result = await db.select().from(employees).where(eq(employees.supabaseUserId, supabaseUserId)).limit(1);
      return result[0];
    } catch (error) {
      console.error('Error fetching employee by Supabase user ID:', error);
      return undefined;
    }
  }

  // Initialize default roles
  async initializeRoles(): Promise<void> {
    try {
      const defaultRoles = [
        { name: 'FAE', description: 'Field Area Engineer', permissions: ['create_teams', 'manage_canvassers', 'view_reports'] },
        { name: 'ADMIN', description: 'Administrator', permissions: ['full_access'] },
        { name: 'CANVASSER', description: 'Canvasser', permissions: ['update_profile', 'submit_activities'] },
        { name: 'SUPERVISOR', description: 'Supervisor', permissions: ['view_teams', 'view_reports'] }
      ];

      for (const roleData of defaultRoles) {
        const existingRole = await this.getRoleByName(roleData.name);
        if (!existingRole) {
          await this.createRole(roleData);
          console.log(`Created role: ${roleData.name}`);
        }
      }
    } catch (error) {
      console.error('Error initializing roles:', error);
    }
  }
}

export const supabaseStorage = new SupabaseStorage();