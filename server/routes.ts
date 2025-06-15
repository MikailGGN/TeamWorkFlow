import type { Express } from "express";
import { createServer, type Server } from "http";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import { supabaseStorage } from "./supabase";
import { signInSchema, insertUserSchema, insertTeamSchema, insertTaskSchema, insertAttendanceSchema } from "@shared/schema";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

interface AuthRequest extends Express.Request {
  user?: { id: number; email: string; role: string };
}

// Middleware to verify JWT token
const authenticateToken = async (req: AuthRequest, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await storage.getUser(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    req.user = { id: user.id, email: user.email, role: user.role };
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/signin", async (req, res) => {
    try {
      const { email, password } = signInSchema.parse(req.body);
      
      // First check if user is an employee in Supabase public.employees table
      const employee = await supabaseStorage.getEmployeeByEmail(email);
      if (employee && employee.status === 'active') {
        // For employees, we don't store passwords in our system
        // This is a simplified auth - in production you'd integrate with Supabase Auth
        const token = jwt.sign(
          { id: employee.id, email: employee.email, role: employee.role, type: 'employee' },
          JWT_SECRET,
          { expiresIn: '24h' }
        );

        return res.json({
          token,
          user: {
            id: employee.id,
            email: employee.email,
            name: employee.fullName,
            role: employee.role,
            type: 'employee'
          },
          redirectTo: employee.role === 'FAE' ? '/create-team' : '/dashboard'
        });
      }

      // Fallback to regular user authentication for admin users
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role, type: 'user' },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          type: 'user'
        },
        redirectTo: '/dashboard'
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(409).json({ message: "User already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword
      });

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(201).json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  // Protected routes
  app.get("/api/user/profile", authenticateToken, async (req: AuthRequest, res) => {
    const user = await storage.getUser(req.user!.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });

  // Dashboard metrics
  app.get("/api/dashboard/metrics", authenticateToken, async (req: AuthRequest, res) => {
    const users = await storage.getAllUsers();
    const teams = await storage.getAllTeams();
    const tasks = await storage.getAllTasks();
    const completedTasks = tasks.filter(t => t.status === 'completed');
    
    // Calculate attendance rate (mock calculation)
    const attendanceRate = 94.5;
    const productivityScore = 87.2;

    res.json({
      totalUsers: users.length,
      totalTeams: teams.length,
      completedTasks: completedTasks.length,
      totalTasks: tasks.length,
      avgAttendance: attendanceRate,
      productivity: productivityScore
    });
  });

  // Teams
  app.get("/api/teams", authenticateToken, async (req: AuthRequest, res) => {
    const teams = await storage.getAllTeams();
    const teamsWithStats = await Promise.all(
      teams.map(async (team) => {
        const members = await storage.getTeamMembers(team.id);
        const tasks = await storage.getTeamTasks(team.id);
        const completedTasks = tasks.filter(t => t.status === 'completed');
        
        return {
          ...team,
          memberCount: members.length,
          taskCount: tasks.length,
          progress: tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0
        };
      })
    );
    
    res.json(teamsWithStats);
  });

  app.post("/api/teams", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const teamData = insertTeamSchema.parse({
        ...req.body,
        createdBy: req.user!.id
      });
      
      const team = await storage.createTeam(teamData);
      
      // Add creator as team admin
      await storage.addTeamMember(team.id, req.user!.id, 'admin');
      
      res.status(201).json(team);
    } catch (error) {
      res.status(400).json({ message: "Invalid team data" });
    }
  });

  app.get("/api/teams/:id/members", authenticateToken, async (req: AuthRequest, res) => {
    const teamId = parseInt(req.params.id);
    const members = await storage.getTeamMembers(teamId);
    res.json(members);
  });

  // Tasks
  app.get("/api/tasks", authenticateToken, async (req: AuthRequest, res) => {
    const tasks = await storage.getAllTasks();
    res.json(tasks);
  });

  app.post("/api/tasks", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const taskData = insertTaskSchema.parse(req.body);
      const task = await storage.createTask(taskData);
      res.status(201).json(task);
    } catch (error) {
      res.status(400).json({ message: "Invalid task data" });
    }
  });

  app.put("/api/tasks/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const updateData = req.body;
      const task = await storage.updateTask(taskId, updateData);
      
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      res.json(task);
    } catch (error) {
      res.status(400).json({ message: "Invalid task data" });
    }
  });

  // Users
  app.get("/api/users", authenticateToken, async (req: AuthRequest, res) => {
    const users = await storage.getAllUsers();
    const usersWithoutPasswords = users.map(({ password, ...user }) => user);
    res.json(usersWithoutPasswords);
  });

  // Attendance
  app.get("/api/attendance", authenticateToken, async (req: AuthRequest, res) => {
    const date = req.query.date ? new Date(req.query.date as string) : undefined;
    const attendance = await storage.getAllAttendance(date);
    res.json(attendance);
  });

  app.post("/api/attendance", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const attendanceData = insertAttendanceSchema.parse(req.body);
      const attendance = await storage.createAttendance(attendanceData);
      res.status(201).json(attendance);
    } catch (error) {
      res.status(400).json({ message: "Invalid attendance data" });
    }
  });

  // Seed employees endpoint (for testing)
  app.post("/api/seed/employees", async (req, res) => {
    try {
      // Create sample FAE and admin employees
      const sampleEmployees = [
        {
          email: "fae@company.com",
          fullName: "John Doe - Field Area Executive",
          role: "FAE",
          department: "Field Operations",
          phone: "+234-800-123-4567",
          status: "active"
        },
        {
          email: "admin@company.com", 
          fullName: "Jane Smith - Administrator",
          role: "ADMIN",
          department: "Administration",
          phone: "+234-800-987-6543",
          status: "active"
        },
        {
          email: "supervisor@company.com",
          fullName: "Mike Johnson - Supervisor",
          role: "SUPERVISOR", 
          department: "Operations",
          phone: "+234-800-555-0123",
          status: "active"
        }
      ];

      const createdEmployees = [];
      for (const emp of sampleEmployees) {
        // Check if employee already exists
        const existing = await supabaseStorage.getEmployeeByEmail(emp.email);
        if (!existing) {
          const created = await supabaseStorage.createEmployee(emp);
          createdEmployees.push(created);
        }
      }

      res.json({ 
        message: "Employee data seeded successfully",
        created: createdEmployees.length,
        employees: createdEmployees
      });
    } catch (error) {
      console.error("Error seeding employees:", error);
      res.status(500).json({ message: "Failed to seed employee data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
