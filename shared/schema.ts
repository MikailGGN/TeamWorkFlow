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
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertEmployeeSchema = createInsertSchema(employees).omit({ id: true, createdAt: true, updatedAt: true });
export const insertProfileSchema = createInsertSchema(profiles).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTeamSchema = createInsertSchema(teams).omit({ id: true, createdAt: true });
export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true, createdAt: true, completedAt: true });
export const insertAttendanceSchema = createInsertSchema(attendance).omit({ id: true });
export const insertCanvasserActivitySchema = createInsertSchema(canvasserActivities).omit({ id: true, createdAt: true });
export const insertTurfSchema = createInsertSchema(turfs).omit({ id: true, createdAt: true });
export const insertCanvasserProductivitySchema = createInsertSchema(canvasserProductivity).omit({ id: true, createdAt: true, lastUpdated: true });

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
export type SignIn = z.infer<typeof signInSchema>;
export type CanvasserRegistration = z.infer<typeof canvasserRegistrationSchema>;
