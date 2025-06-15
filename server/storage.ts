import { 
  users, teams, teamMembers, tasks, attendance, profiles, canvasserActivities, turfs,
  type User, type InsertUser, type Team, type InsertTeam, 
  type TeamMember, type Task, type InsertTask, 
  type Attendance, type InsertAttendance, type Profile, type InsertProfile,
  type CanvasserActivity, type InsertCanvasserActivity, type CanvasserRegistration,
  type Turf, type InsertTurf
} from "@shared/schema";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;

  // Profiles (Supabase)
  getProfile(id: string): Promise<Profile | undefined>;
  getProfileByEmail(email: string): Promise<Profile | undefined>;
  createProfile(profile: any): Promise<Profile>;
  updateProfile(id: string, profile: Partial<InsertProfile>): Promise<Profile | undefined>;
  getAllProfiles(): Promise<Profile[]>;
  getCanvassers(): Promise<Profile[]>;
  getFAEs(): Promise<Profile[]>; // Field Area Executives
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
  
  private userIdSeq = 1;
  private teamIdSeq = 1;
  private teamMemberIdSeq = 1;
  private taskIdSeq = 1;
  private attendanceIdSeq = 1;
  private turfIdSeq = 1;
  private productivityIdSeq = 1;

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

  async getFAEs(): Promise<Profile[]> {
    return Array.from(this.profiles.values()).filter(profile => profile.role === 'fae');
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
}

export const storage = new MemStorage();
