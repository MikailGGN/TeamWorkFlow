import { 
  users, teams, teamMembers, tasks, attendance, profiles, canvasserActivities,
  type User, type InsertUser, type Team, type InsertTeam, 
  type TeamMember, type Task, type InsertTask, 
  type Attendance, type InsertAttendance, type Profile, type InsertProfile,
  type CanvasserActivity, type InsertCanvasserActivity, type CanvasserRegistration
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

  // Teams
  getTeam(id: number): Promise<Team | undefined>;
  createTeam(team: InsertTeam): Promise<Team>;
  getAllTeams(): Promise<Team[]>;
  getUserTeams(userId: number): Promise<Team[]>;

  // Team Members
  addTeamMember(teamId: number, userId: number, role: string): Promise<TeamMember>;
  getTeamMembers(teamId: number): Promise<(TeamMember & { user: User })[]>;
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
  getAllAttendance(date?: Date): Promise<(Attendance & { user: User })[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private teams: Map<number, Team> = new Map();
  private teamMembers: Map<number, TeamMember> = new Map();
  private tasks: Map<number, Task> = new Map();
  private attendance: Map<number, Attendance> = new Map();
  
  private userIdSeq = 1;
  private teamIdSeq = 1;
  private teamMemberIdSeq = 1;
  private taskIdSeq = 1;
  private attendanceIdSeq = 1;

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
}

export const storage = new MemStorage();
