import { pgTable, text, serial, integer, boolean, timestamp, jsonb, uuid, date, decimal, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("member"), // admin, member, viewer
  createdAt: timestamp("created_at").defaultNow(),
});

// Employees table for FAE and admin authentication
export const employees = pgTable("employees", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull(), // 'FAE', 'ADMIN', 'SUPERVISOR'
  department: text("department"),
  phone: text("phone"),
  status: text("status").notNull().default("active"), // active, inactive
  supabaseUserId: uuid("supabase_user_id").unique(), // Link to Supabase auth.users
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Roles table for role-based access control
export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(), // 'FAE', 'ADMIN', 'CANVASSER', 'SUPERVISOR'
  description: text("description"),
  permissions: jsonb("permissions").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

// User roles junction table
export const userRoles = pgTable("user_roles", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").notNull(), // References Supabase auth.users.id
  roleId: integer("role_id").notNull().references(() => roles.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Profiles table to match Supabase public.profiles
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  email: text("email").unique(),
  fullName: text("full_name"),
  avatarUrl: text("avatar_url"),
  phone: text("phone"),
  nin: text("nin"), // National Identification Number
  smartCashAccount: text("smart_cash_account"),
  role: text("role").notNull().default("canvasser"), // fae, canvasser, admin
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  location: jsonb("location"), // { lat, lng, address }
  photo: text("photo"), // Base64 data URL converted to binary for storage optimization
  teamId: text("team_id"), // Associated team ID
  createdBy: uuid("created_by"),
  approvedBy: uuid("approved_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  teamId: text("team_id").unique(), // Generated ID: Date-Geolocation-TeamName
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  activityType: text("activity_type"), // MEGA, MIDI, MINI
  channels: text("channels"), // Comma-separated list of channels
  kitId: text("kit_id"), // Kit ID for daily canvasser use
  location: jsonb("location"), // { lat, lng, address }
  date: timestamp("date"),
  createdBy: integer("created_by").references(() => users.id),
  faeId: uuid("fae_id").references(() => profiles.id), // Field Area Executive
  createdAt: timestamp("created_at").defaultNow(),
});

export const teamMembers = pgTable("team_members", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").references(() => teams.id),
  userId: integer("user_id").references(() => users.id),
  profileId: uuid("profile_id").references(() => profiles.id),
  role: text("role").notNull().default("member"), // admin, member, viewer, canvasser
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  teamId: integer("team_id").references(() => teams.id),
  assignedTo: integer("assigned_to").references(() => users.id),
  assignedProfile: uuid("assigned_profile").references(() => profiles.id),
  status: text("status").notNull().default("pending"), // pending, in_progress, completed
  priority: text("priority").notNull().default("medium"), // low, medium, high
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  profileId: uuid("profile_id").references(() => profiles.id),
  date: timestamp("date").notNull(),
  checkIn: timestamp("check_in"),
  checkOut: timestamp("check_out"),
  location: jsonb("location"), // { lat, lng }
  status: text("status").notNull().default("present"), // present, absent, late
  notes: text("notes"),
});

// Canvasser activity tracking
export const canvasserActivities = pgTable("canvasser_activities", {
  id: serial("id").primaryKey(),
  canvasserId: uuid("canvasser_id").references(() => profiles.id),
  teamId: integer("team_id").references(() => teams.id),
  activityType: text("activity_type").notNull(), // MEGA, MIDI, MINI, Other
  channel: text("channel"),
  description: text("description"),
  location: jsonb("location"), // { lat, lng, address }
  photo: text("photo"),
  date: timestamp("date").notNull(),
  status: text("status").notNull().default("active"), // active, completed, cancelled
  createdAt: timestamp("created_at").defaultNow(),
});

export const turfs = pgTable("turfs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  geojson: jsonb("geojson").notNull(),
  color: text("color").notNull(),
  teamId: integer("team_id").references(() => teams.id),
  status: text("status").default("active"),
  assignedDate: timestamp("assigned_date"),
  completedDate: timestamp("completed_date"),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const canvasserProductivity = pgTable("canvasser_productivity", {
  id: serial("id").primaryKey(),
  canvasserId: uuid("canvasser_id").notNull().references(() => profiles.id),
  date: text("date").notNull(),
  dailyTarget: integer("daily_target").default(0),
  actualCount: integer("actual_count").default(0),
  gadsPoints: integer("gads_points").default(0),
  incentiveAmount: text("incentive_amount").default("0.00"),
  performanceRating: text("performance_rating").default("average"),
  notes: text("notes"),
  updatedBy: text("updated_by"),
  lastUpdated: timestamp("last_updated", { withTimezone: true }).defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const activityPlanner = pgTable("activity_planner", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  location: text("location").notNull(),
  activity: text("activity").notNull(),
  notes: text("notes"),
  userEmail: text("useremail").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const okrTargets = pgTable("okr_targets", {
  id: serial("id").primaryKey(),
  period: text("period").notNull(), // Q1 2024, Q2 2024, etc.
  teamId: integer("team_id").references(() => teams.id),
  faeId: text("fae_id").references(() => employees.id),
  region: text("region").notNull(),
  activityType: text("activity_type").notNull(),
  channel: text("channel").notNull(),
  expectedSales: decimal("expected_sales", { precision: 12, scale: 2 }).notNull(),
  targetUnits: integer("target_units").notNull(),
  targetRevenue: decimal("target_revenue", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const okrActuals = pgTable("okr_actuals", {
  id: serial("id").primaryKey(),
  okrTargetId: integer("okr_target_id").references(() => okrTargets.id).notNull(),
  period: text("period").notNull(),
  actualSales: decimal("actual_sales", { precision: 12, scale: 2 }).notNull(),
  actualUnits: integer("actual_units").notNull(),
  actualRevenue: decimal("actual_revenue", { precision: 12, scale: 2 }).notNull(),
  recordedAt: timestamp("recorded_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const salesMetrics = pgTable("sales_metrics", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").references(() => teams.id),
  faeId: text("fae_id").references(() => employees.id),
  region: text("region").notNull(),
  activityType: text("activity_type").notNull(),
  channel: text("channel").notNull(),
  period: text("period").notNull(),
  salesAmount: decimal("sales_amount", { precision: 12, scale: 2 }).notNull(),
  unitsWon: integer("units_won").notNull(),
  revenue: decimal("revenue", { precision: 12, scale: 2 }).notNull(),
  conversionRate: decimal("conversion_rate", { precision: 5, scale: 2 }),
  customerAcquisitionCost: decimal("customer_acquisition_cost", { precision: 10, scale: 2 }),
  recordedDate: timestamp("recorded_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// SIM Collection and Allocation tracking
export const simCollection = pgTable("sim_collection", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  quantity: integer("quantity").notNull(),
  source: text("source"), // For collection: Vendor, Customer, Red Shop, ASM, MD
  sourceDetails: text("source_details"), // Details about collection source
  allocationType: text("allocation_type"), // For allocation: Return to Vendor, Sold to Customer, Transfer to Others
  allocationDetails: text("allocation_details"), // Details about allocation
  useremail: text("useremail").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Campaign management
export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(),
  startDate: date("start_date"),
  endDate: date("end_date"),
  targetAudience: text("target_audience"),
  budget: decimal("budget", { precision: 10, scale: 2 }).default('0'),
  locations: jsonb("locations"), // Array of location objects with photos
  teams: jsonb("teams"), // Array of team IDs
  objectives: jsonb("objectives"), // Array of objective strings
  kpis: jsonb("kpis"), // Array of KPI strings
  status: text("status").notNull().default("draft"), // draft, active, paused, completed
  createdBy: uuid("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertEmployeeSchema = createInsertSchema(employees).omit({ id: true, createdAt: true, updatedAt: true });
export const insertRoleSchema = createInsertSchema(roles).omit({ id: true, createdAt: true });
export const insertUserRoleSchema = createInsertSchema(userRoles).omit({ id: true, createdAt: true });
export const insertProfileSchema = createInsertSchema(profiles).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTeamSchema = createInsertSchema(teams).omit({ id: true, createdAt: true });
export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true, createdAt: true, completedAt: true });
export const insertAttendanceSchema = createInsertSchema(attendance).omit({ id: true });
export const insertCanvasserActivitySchema = createInsertSchema(canvasserActivities).omit({ id: true, createdAt: true });
export const insertTurfSchema = createInsertSchema(turfs).omit({ id: true, createdAt: true });
export const insertCanvasserProductivitySchema = createInsertSchema(canvasserProductivity).omit({ id: true, createdAt: true, lastUpdated: true });
export const insertActivityPlannerSchema = createInsertSchema(activityPlanner).omit({ id: true, createdAt: true, updatedAt: true });
export const insertOkrTargetSchema = createInsertSchema(okrTargets).omit({ id: true, createdAt: true, updatedAt: true });
export const insertOkrActualSchema = createInsertSchema(okrActuals).omit({ id: true, createdAt: true, updatedAt: true, recordedAt: true });
export const insertSalesMetricSchema = createInsertSchema(salesMetrics).omit({ id: true, createdAt: true });
export const insertSimCollectionSchema = createInsertSchema(simCollection).omit({ id: true, createdAt: true });
export const insertCampaignSchema = createInsertSchema(campaigns).omit({ id: true, createdAt: true, updatedAt: true });

export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const canvasserRegistrationSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().min(10),
  nin: z.string().min(11),
  smartCashAccount: z.string().optional(),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
    address: z.string().optional(),
  }).optional(),
  photo: z.string().optional(),
  teamId: z.string().min(1, "Team selection is required")
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type Team = typeof teams.$inferSelect;
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type TeamMember = typeof teamMembers.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Attendance = typeof attendance.$inferSelect;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type CanvasserActivity = typeof canvasserActivities.$inferSelect;
export type InsertCanvasserActivity = z.infer<typeof insertCanvasserActivitySchema>;
export type Turf = typeof turfs.$inferSelect;
export type InsertTurf = z.infer<typeof insertTurfSchema>;
export type CanvasserProductivity = typeof canvasserProductivity.$inferSelect;
export type InsertCanvasserProductivity = z.infer<typeof insertCanvasserProductivitySchema>;
export type ActivityPlanner = typeof activityPlanner.$inferSelect;
export type InsertActivityPlanner = z.infer<typeof insertActivityPlannerSchema>;
export type OkrTarget = typeof okrTargets.$inferSelect;
export type InsertOkrTarget = z.infer<typeof insertOkrTargetSchema>;
export type OkrActual = typeof okrActuals.$inferSelect;
export type InsertOkrActual = z.infer<typeof insertOkrActualSchema>;
export type SalesMetric = typeof salesMetrics.$inferSelect;
export type InsertSalesMetric = z.infer<typeof insertSalesMetricSchema>;
export type SimCollection = typeof simCollection.$inferSelect;
export type InsertSimCollection = z.infer<typeof insertSimCollectionSchema>;
export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type SignIn = z.infer<typeof signInSchema>;
export type CanvasserRegistration = z.infer<typeof canvasserRegistrationSchema>;

// Role-based authentication types
export type InsertRole = typeof roles.$inferInsert;
export type Role = typeof roles.$inferSelect;
export type InsertUserRole = typeof userRoles.$inferInsert;
export type UserRole = typeof userRoles.$inferSelect;

// Enhanced user type with roles for Supabase auth
export interface UserWithRoles {
  id: string;
  email: string | null;
  roles: string[];
  employee?: Employee;
}
