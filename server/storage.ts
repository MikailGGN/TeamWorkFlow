import { 
  users, teams, teamMembers, tasks, attendance, profiles, employees, canvasserActivities, turfs, simCollection, campaigns,
  type User, type InsertUser, type Team, type InsertTeam, 
  type TeamMember, type Task, type InsertTask, 
  type Attendance, type InsertAttendance, type Profile, type InsertProfile,
  type Employee, type InsertEmployee,
  type CanvasserActivity, type InsertCanvasserActivity, type CanvasserRegistration,
  type Turf, type InsertTurf, type CanvasserProductivity, type InsertCanvasserProductivity,
  type ActivityPlanner, type InsertActivityPlanner,
  type OkrTarget, type InsertOkrTarget,
  type OkrActual, type InsertOkrActual,
  type SalesMetric, type InsertSalesMetric,
  type SimCollection, type InsertSimCollection,
  type Campaign, type InsertCampaign
} from "@shared/schema";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { supabaseStorage } from "./supabase";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;

  // Employees (from public.employees)
  getEmployee(id: string): Promise<Employee | undefined>;
  getEmployeeByEmail(email: string): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: string, employee: Partial<InsertEmployee>): Promise<Employee | undefined>;
  getAllEmployees(): Promise<Employee[]>;
  getFAEs(): Promise<Employee[]>; // Field Area Executives from public.employees

  // Profiles (Supabase)
  getProfile(id: string): Promise<Profile | undefined>;
  getProfileByEmail(email: string): Promise<Profile | undefined>;
  createProfile(profile: any): Promise<Profile>;
  updateProfile(id: string, profile: Partial<InsertProfile>): Promise<Profile | undefined>;
  getAllProfiles(): Promise<Profile[]>;
  getCanvassers(): Promise<Profile[]>;
  approveCanvasser(id: string, approvedBy: string): Promise<Profile | undefined>;
  rejectCanvasser(id: string): Promise<Profile | undefined>;

  // Teams
  getTeam(id: number): Promise<Team | undefined>;
  createTeam(team: InsertTeam): Promise<Team>;
  getAllTeams(): Promise<Team[]>;
  getUserTeams(userId: number): Promise<Team[]>;

  // Team Members
  addTeamMember(teamId: number, userId: number, role: string, profileId?: string): Promise<TeamMember>;
  getTeamMembers(teamId: number): Promise<(TeamMember & { user: User, profile?: Profile })[]>;
  removeTeamMember(teamId: number, userId: number): Promise<boolean>;

  // Tasks
  getTask(id: number): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: Partial<InsertTask>): Promise<Task | undefined>;
  getAllTasks(): Promise<Task[]>;
  getTeamTasks(teamId: number): Promise<Task[]>;
  getUserTasks(userId: number): Promise<Task[]>;

  // Attendance
  createAttendance(attendance: InsertAttendance): Promise<Attendance>;
  getUserAttendance(userId: number, startDate: Date, endDate: Date): Promise<Attendance[]>;
  getAllAttendance(date?: Date): Promise<(Attendance & { user: User, profile?: Profile })[]>;

  // Canvasser Activities
  createCanvasserActivity(activity: InsertCanvasserActivity): Promise<CanvasserActivity>;
  getCanvasserActivities(canvasserId?: string): Promise<CanvasserActivity[]>;
  updateCanvasserActivity(id: number, activity: Partial<InsertCanvasserActivity>): Promise<CanvasserActivity | undefined>;

  // Turfs
  getTurf(id: number): Promise<Turf | undefined>;
  createTurf(turf: InsertTurf): Promise<Turf>;
  updateTurf(id: number, turf: Partial<InsertTurf>): Promise<Turf | undefined>;
  deleteTurf(id: number): Promise<boolean>;
  getAllTurfs(): Promise<Turf[]>;
  getTurfsByTeam(teamId: number): Promise<Turf[]>;
  getTurfsByCreator(createdBy: number): Promise<Turf[]>;

  // Canvasser Productivity
  getCanvasserProductivity(canvasserId: string, date: string): Promise<CanvasserProductivity | undefined>;
  createCanvasserProductivity(productivity: InsertCanvasserProductivity): Promise<CanvasserProductivity>;
  updateCanvasserProductivity(canvasserId: string, date: string, productivity: Partial<InsertCanvasserProductivity>): Promise<CanvasserProductivity | undefined>;
  getDailyProductivity(date: string): Promise<(CanvasserProductivity & { profile: Profile })[]>;

  // Activity Planner
  getActivityPlanner(): Promise<ActivityPlanner[]>;
  createActivityPlanner(activity: InsertActivityPlanner): Promise<ActivityPlanner>;

  // OKR Targets
  getOkrTarget(id: number): Promise<OkrTarget | undefined>;
  createOkrTarget(target: InsertOkrTarget): Promise<OkrTarget>;
  getAllOkrTargets(): Promise<OkrTarget[]>;

  // OKR Actuals
  createOkrActual(actual: InsertOkrActual): Promise<OkrActual>;
  getAllOkrActuals(): Promise<OkrActual[]>;

  // Sales Metrics
  createSalesMetric(metric: InsertSalesMetric): Promise<SalesMetric>;
  getAllSalesMetrics(): Promise<SalesMetric[]>;
  getSalesMetricsByPeriod(period: string): Promise<SalesMetric[]>;

  // SIM Collection
  createSimCollection(collection: InsertSimCollection): Promise<SimCollection>;
  getAllSimCollections(): Promise<SimCollection[]>;
  getSimCollectionsByUser(useremail: string): Promise<SimCollection[]>;

  // Campaigns
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  getAllCampaigns(): Promise<Campaign[]>;
  getCampaign(id: number): Promise<Campaign | undefined>;
  updateCampaign(id: number, campaign: Partial<InsertCampaign>): Promise<Campaign | undefined>;
  deleteCampaign(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private teams: Map<number, Team> = new Map();
  private teamMembers: Map<number, TeamMember> = new Map();
  private tasks: Map<number, Task> = new Map();
  private attendance: Map<number, Attendance> = new Map();
  private profiles: Map<string, Profile> = new Map();
  private turfs: Map<number, Turf> = new Map();
  private productivity: Map<string, CanvasserProductivity> = new Map();
  private activities: Map<number, ActivityPlanner> = new Map();
  private okrTargets: Map<number, OkrTarget> = new Map();
  private okrActuals: Map<number, OkrActual> = new Map();
  private salesMetrics: Map<number, SalesMetric> = new Map();
  private simCollections: Map<number, SimCollection> = new Map();
  private campaigns: Map<number, Campaign> = new Map();
  
  private userIdSeq = 1;
  private teamIdSeq = 1;
  private teamMemberIdSeq = 1;
  private taskIdSeq = 1;
  private attendanceIdSeq = 1;
  private turfIdSeq = 1;
  private productivityIdSeq = 1;
  private activityIdSeq = 1;
  private okrTargetIdSeq = 1;
  private okrActualIdSeq = 1;
  private salesMetricIdSeq = 1;
  private simCollectionIdSeq = 1;
  private campaignIdSeq = 1;

  constructor() {
    // Create default admin user
    this.createUser({
      email: "admin@example.com",
      password: "admin123",
      name: "Administrator",
      role: "admin"
    });
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdSeq++;
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: new Date() 
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, updateData: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updateData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Employees - delegate to Supabase storage for public.employees table
  async getEmployee(id: string): Promise<Employee | undefined> {
    return await supabaseStorage.getEmployee(id);
  }

  async getEmployeeByEmail(email: string): Promise<Employee | undefined> {
    return await supabaseStorage.getEmployeeByEmail(email);
  }

  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    return await supabaseStorage.createEmployee(employee);
  }

  async updateEmployee(id: string, employee: Partial<InsertEmployee>): Promise<Employee | undefined> {
    return await supabaseStorage.updateEmployee(id, employee);
  }

  async getAllEmployees(): Promise<Employee[]> {
    return await supabaseStorage.getAllEmployees();
  }

  async getFAEs(): Promise<Employee[]> {
    return await supabaseStorage.getFAEs();
  }

  // Teams
  async getTeam(id: number): Promise<Team | undefined> {
    return this.teams.get(id);
  }

  async createTeam(insertTeam: InsertTeam): Promise<Team> {
    const id = this.teamIdSeq++;
    const team: Team = { 
      ...insertTeam, 
      id, 
      createdAt: new Date() 
    };
    this.teams.set(id, team);
    return team;
  }

  async getAllTeams(): Promise<Team[]> {
    return Array.from(this.teams.values());
  }

  async getUserTeams(userId: number): Promise<Team[]> {
    const userTeamIds = Array.from(this.teamMembers.values())
      .filter(tm => tm.userId === userId)
      .map(tm => tm.teamId);
    
    return Array.from(this.teams.values())
      .filter(team => userTeamIds.includes(team.id!));
  }

  // Team Members
  async addTeamMember(teamId: number, userId: number, role: string): Promise<TeamMember> {
    const id = this.teamMemberIdSeq++;
    const teamMember: TeamMember = {
      id,
      teamId,
      userId,
      role,
      joinedAt: new Date()
    };
    this.teamMembers.set(id, teamMember);
    return teamMember;
  }

  async getTeamMembers(teamId: number): Promise<(TeamMember & { user: User })[]> {
    const members = Array.from(this.teamMembers.values())
      .filter(tm => tm.teamId === teamId);
    
    return members.map(member => ({
      ...member,
      user: this.users.get(member.userId!)!
    }));
  }

  async removeTeamMember(teamId: number, userId: number): Promise<boolean> {
    const member = Array.from(this.teamMembers.entries())
      .find(([_, tm]) => tm.teamId === teamId && tm.userId === userId);
    
    if (member) {
      this.teamMembers.delete(member[0]);
      return true;
    }
    return false;
  }

  // Tasks
  async getTask(id: number): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = this.taskIdSeq++;
    const task: Task = { 
      ...insertTask, 
      id, 
      createdAt: new Date(),
      completedAt: null
    };
    this.tasks.set(id, task);
    return task;
  }

  async updateTask(id: number, updateData: Partial<InsertTask>): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;
    
    const updatedTask = { 
      ...task, 
      ...updateData,
      completedAt: updateData.status === 'completed' ? new Date() : task.completedAt
    };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  async getAllTasks(): Promise<Task[]> {
    return Array.from(this.tasks.values());
  }

  async getTeamTasks(teamId: number): Promise<Task[]> {
    return Array.from(this.tasks.values())
      .filter(task => task.teamId === teamId);
  }

  async getUserTasks(userId: number): Promise<Task[]> {
    return Array.from(this.tasks.values())
      .filter(task => task.assignedTo === userId);
  }

  // Attendance
  async createAttendance(insertAttendance: InsertAttendance): Promise<Attendance> {
    const id = this.attendanceIdSeq++;
    const attendance: Attendance = { ...insertAttendance, id };
    this.attendance.set(id, attendance);
    return attendance;
  }

  async getUserAttendance(userId: number, startDate: Date, endDate: Date): Promise<Attendance[]> {
    return Array.from(this.attendance.values())
      .filter(att => 
        att.userId === userId && 
        att.date >= startDate && 
        att.date <= endDate
      );
  }

  async getAllAttendance(date?: Date): Promise<(Attendance & { user: User })[]> {
    let attendanceRecords = Array.from(this.attendance.values());
    
    if (date) {
      const dateStr = date.toDateString();
      attendanceRecords = attendanceRecords.filter(att => 
        att.date.toDateString() === dateStr
      );
    }
    
    return attendanceRecords.map(att => ({
      ...att,
      user: this.users.get(att.userId!)!
    }));
  }

  // Profile management methods
  async getProfile(id: string): Promise<Profile | undefined> {
    return this.profiles.get(id);
  }

  async getProfileByEmail(email: string): Promise<Profile | undefined> {
    return Array.from(this.profiles.values()).find(profile => profile.email === email);
  }

  async createProfile(profileData: any): Promise<Profile> {
    const profile: Profile = {
      id: profileData.id,
      email: profileData.email,
      fullName: profileData.fullName,
      avatarUrl: null,
      phone: profileData.phone,
      nin: profileData.nin,
      smartCashAccount: profileData.smartCashAccount,
      role: profileData.role || 'canvasser',
      status: profileData.status || 'pending',
      location: profileData.location,
      photo: profileData.photo,
      teamId: profileData.teamId,
      createdBy: profileData.createdBy,
      approvedBy: profileData.approvedBy,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.profiles.set(profile.id, profile);
    return profile;
  }

  async updateProfile(id: string, profileData: Partial<InsertProfile>): Promise<Profile | undefined> {
    const profile = this.profiles.get(id);
    if (!profile) return undefined;
    
    const updatedProfile = { ...profile, ...profileData, updatedAt: new Date() };
    this.profiles.set(id, updatedProfile);
    return updatedProfile;
  }

  async getAllProfiles(): Promise<Profile[]> {
    return Array.from(this.profiles.values());
  }

  async getCanvassers(): Promise<Profile[]> {
    return Array.from(this.profiles.values()).filter(profile => profile.role === 'canvasser');
  }

  async approveCanvasser(id: string, approvedBy: string): Promise<Profile | undefined> {
    const profile = this.profiles.get(id);
    if (!profile) return undefined;
    
    const updatedProfile = { 
      ...profile, 
      status: 'approved', 
      approvedBy, 
      updatedAt: new Date() 
    };
    this.profiles.set(id, updatedProfile);
    return updatedProfile;
  }

  async rejectCanvasser(id: string): Promise<Profile | undefined> {
    const profile = this.profiles.get(id);
    if (!profile) return undefined;
    
    const updatedProfile = { 
      ...profile, 
      status: 'rejected', 
      updatedAt: new Date() 
    };
    this.profiles.set(id, updatedProfile);
    return updatedProfile;
  }

  // Canvasser Activities (placeholder implementations)
  async createCanvasserActivity(activity: InsertCanvasserActivity): Promise<CanvasserActivity> {
    throw new Error("Method not implemented for MemStorage");
  }

  async getCanvasserActivities(canvasserId?: string): Promise<CanvasserActivity[]> {
    return [];
  }

  async updateCanvasserActivity(id: number, activity: Partial<InsertCanvasserActivity>): Promise<CanvasserActivity | undefined> {
    return undefined;
  }

  // Turf Management
  async getTurf(id: number): Promise<Turf | undefined> {
    return this.turfs.get(id);
  }

  async createTurf(insertTurf: InsertTurf): Promise<Turf> {
    const id = this.turfIdSeq++;
    const turf: Turf = { 
      ...insertTurf, 
      id,
      createdAt: new Date(),
      status: insertTurf.status || 'active',
      assignedDate: insertTurf.assignedDate || null,
      completedDate: insertTurf.completedDate || null,
      description: insertTurf.description || null,
      teamId: insertTurf.teamId || null
    };
    this.turfs.set(id, turf);
    return turf;
  }

  async updateTurf(id: number, updateData: Partial<InsertTurf>): Promise<Turf | undefined> {
    const existingTurf = this.turfs.get(id);
    if (!existingTurf) return undefined;

    const updatedTurf: Turf = { 
      ...existingTurf, 
      ...updateData,
      id: existingTurf.id,
      createdAt: existingTurf.createdAt
    };
    this.turfs.set(id, updatedTurf);
    return updatedTurf;
  }

  async deleteTurf(id: number): Promise<boolean> {
    return this.turfs.delete(id);
  }

  async getAllTurfs(): Promise<Turf[]> {
    return Array.from(this.turfs.values());
  }

  async getTurfsByTeam(teamId: number): Promise<Turf[]> {
    return Array.from(this.turfs.values()).filter(turf => turf.teamId === teamId);
  }

  async getTurfsByCreator(createdBy: number): Promise<Turf[]> {
    return Array.from(this.turfs.values()).filter(turf => turf.createdBy === createdBy);
  }

  // Canvasser Productivity methods
  async getCanvasserProductivity(canvasserId: string, date: string): Promise<CanvasserProductivity | undefined> {
    const key = `${canvasserId}-${date}`;
    return this.productivity.get(key);
  }

  async createCanvasserProductivity(productivity: InsertCanvasserProductivity): Promise<CanvasserProductivity> {
    const id = this.productivityIdSeq++;
    const newProductivity: CanvasserProductivity = {
      ...productivity,
      id,
      createdAt: new Date(),
      lastUpdated: new Date()
    };
    const key = `${productivity.canvasserId}-${productivity.date}`;
    this.productivity.set(key, newProductivity);
    return newProductivity;
  }

  async updateCanvasserProductivity(canvasserId: string, date: string, productivity: Partial<InsertCanvasserProductivity>): Promise<CanvasserProductivity | undefined> {
    const key = `${canvasserId}-${date}`;
    const existing = this.productivity.get(key);
    if (!existing) return undefined;

    const updated: CanvasserProductivity = {
      ...existing,
      ...productivity,
      lastUpdated: new Date()
    };
    this.productivity.set(key, updated);
    return updated;
  }

  async getDailyProductivity(date: string): Promise<(CanvasserProductivity & { profile: Profile })[]> {
    const productivityList = Array.from(this.productivity.values())
      .filter(p => p.date === date);
    
    return productivityList.map(p => ({
      ...p,
      profile: this.profiles.get(p.canvasserId) || {} as Profile
    }));
  }

  // Activity Planner methods
  async getActivityPlanner(): Promise<ActivityPlanner[]> {
    return Array.from(this.activities.values());
  }

  async createActivityPlanner(activity: InsertActivityPlanner): Promise<ActivityPlanner> {
    const id = this.activityIdSeq++;
    const newActivity: ActivityPlanner = {
      ...activity,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      location: activity.location || null,
      date: activity.date || null,
      description: activity.description || null,
      activityType: activity.activityType || null,
      kitId: activity.kitId || null,
      channels: activity.channels || null,
      teamId: activity.teamId || null,
      createdBy: activity.createdBy || null,
      faeId: activity.faeId || null
    };
    this.activities.set(id, newActivity);
    return newActivity;
  }

  // OKR Target methods
  async getOkrTarget(id: number): Promise<OkrTarget | undefined> {
    return this.okrTargets.get(id);
  }

  async createOkrTarget(target: InsertOkrTarget): Promise<OkrTarget> {
    const id = this.okrTargetIdSeq++;
    const newTarget: OkrTarget = {
      ...target,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.okrTargets.set(id, newTarget);
    return newTarget;
  }

  async getAllOkrTargets(): Promise<OkrTarget[]> {
    return Array.from(this.okrTargets.values());
  }

  // OKR Actual methods
  async createOkrActual(actual: InsertOkrActual): Promise<OkrActual> {
    const id = this.okrActualIdSeq++;
    const newActual: OkrActual = {
      ...actual,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      recordedAt: new Date()
    };
    this.okrActuals.set(id, newActual);
    return newActual;
  }

  async getAllOkrActuals(): Promise<OkrActual[]> {
    return Array.from(this.okrActuals.values());
  }

  // Sales Metrics methods
  async createSalesMetric(metric: InsertSalesMetric): Promise<SalesMetric> {
    const id = this.salesMetricIdSeq++;
    const newMetric: SalesMetric = {
      ...metric,
      id,
      createdAt: new Date()
    };
    this.salesMetrics.set(id, newMetric);
    return newMetric;
  }

  async getAllSalesMetrics(): Promise<SalesMetric[]> {
    return Array.from(this.salesMetrics.values());
  }

  async getSalesMetricsByPeriod(period: string): Promise<SalesMetric[]> {
    return Array.from(this.salesMetrics.values()).filter(metric => metric.period === period);
  }

  // SIM Collection methods
  async createSimCollection(collection: InsertSimCollection): Promise<SimCollection> {
    const id = this.simCollectionIdSeq++;
    const newCollection: SimCollection = {
      ...collection,
      id,
      createdAt: new Date(),
    };
    this.simCollections.set(id, newCollection);
    return newCollection;
  }

  async getAllSimCollections(): Promise<SimCollection[]> {
    return Array.from(this.simCollections.values());
  }

  async getSimCollectionsByUser(useremail: string): Promise<SimCollection[]> {
    return Array.from(this.simCollections.values()).filter(collection => collection.useremail === useremail);
  }

  // Campaigns
  async createCampaign(campaignData: InsertCampaign): Promise<Campaign> {
    const id = this.campaignIdSeq++;
    const campaign: Campaign = {
      id,
      ...campaignData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.campaigns.set(id, campaign);
    return campaign;
  }

  async getAllCampaigns(): Promise<Campaign[]> {
    return Array.from(this.campaigns.values());
  }

  async getCampaign(id: number): Promise<Campaign | undefined> {
    return this.campaigns.get(id);
  }

  async updateCampaign(id: number, campaignData: Partial<InsertCampaign>): Promise<Campaign | undefined> {
    const campaign = this.campaigns.get(id);
    if (!campaign) return undefined;
    
    const updatedCampaign: Campaign = {
      ...campaign,
      ...campaignData,
      updatedAt: new Date()
    };
    this.campaigns.set(id, updatedCampaign);
    return updatedCampaign;
  }

  async deleteCampaign(id: number): Promise<boolean> {
    return this.campaigns.delete(id);
  }
}

export const storage = new MemStorage();
