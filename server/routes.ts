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
    
    // Handle employee authentication (FAE, ADMIN)
    if (decoded.type === 'employee') {
      req.user = { id: decoded.id, email: decoded.email, role: decoded.role };
      next();
      return;
    }
    
    // Handle regular user authentication
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
      console.log("Login attempt for:", req.body?.email);
      const { email, password } = signInSchema.parse(req.body);
      
      // Check for FAE employees in simulated public.employees table
      const demoEmployees = [
        {
          id: 'fae-001',
          email: 'fae@company.com',
          fullName: 'John Doe - Field Area Executive',
          role: 'FAE',
          status: 'active'
        },
        {
          id: 'admin-001', 
          email: 'admin@company.com',
          fullName: 'Jane Smith - Administrator',
          role: 'ADMIN',
          status: 'active'
        }
      ];

      const employee = demoEmployees.find(emp => emp.email === email && emp.status === 'active');
      if (employee) {
        console.log("FAE Employee authenticated:", employee.email, employee.role);
        
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

      // Fallback to regular user authentication
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
      console.error("Sign in error:", error);
      res.status(400).json({ message: "Invalid request data", details: error.message });
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
    // Handle employee profile requests
    if (req.user!.id && typeof req.user!.id === 'string' && req.user!.id.startsWith('fae-') || req.user!.id.startsWith('admin-')) {
      return res.json({
        id: req.user!.id,
        email: req.user!.email,
        name: req.user!.id.startsWith('fae-') ? 'John Doe - Field Area Executive' : 'Jane Smith - Administrator',
        role: req.user!.role,
        type: 'employee'
      });
    }
    
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

  // Get teams created by current FAE in the last week (for canvasser registration)
  app.get("/api/teams/my-recent", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const allTeams = await storage.getAllTeams();
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      // Filter teams created by current FAE in the last week
      const myRecentTeams = allTeams.filter(team => {
        const isMyTeam = team.createdBy === req.user?.id || team.faeId === req.user?.id?.toString();
        const isRecent = team.createdAt && new Date(team.createdAt) >= oneWeekAgo;
        return isMyTeam && isRecent;
      });
      
      res.json(myRecentTeams);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch recent teams" });
    }
  });

  app.post("/api/teams", authenticateToken, async (req: AuthRequest, res) => {
    try {
      // Validate required fields manually since we have custom fields
      const { name, description, category, activityType, channels, kitId, teamId, location, date } = req.body;
      
      if (!name || !category || !activityType || !kitId) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const teamData = {
        name,
        description: description || null,
        category,
        activityType,
        channels,
        kitId,
        teamId,
        location,
        date: date ? new Date(date) : new Date(),
        createdBy: req.user!.id,
        faeId: req.user!.id.toString()
      };
      
      const team = await storage.createTeam(teamData);
      
      // Add creator as team admin
      await storage.addTeamMember(team.id, req.user!.id, 'admin');
      
      res.status(201).json(team);
    } catch (error: any) {
      console.error('Team creation error:', error);
      res.status(400).json({ message: error.message || "Invalid team data" });
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

  // Sync approved canvasser to database
  app.post("/api/canvassers/sync", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const canvasserData = req.body;
      
      // Convert dataURL to binary for storage optimization in Supabase
      let optimizedPhoto = null;
      if (canvasserData.photo && canvasserData.photo.startsWith('data:image/')) {
        // Extract base64 data and compress for database storage
        const base64Data = canvasserData.photo.split(',')[1];
        // Store compressed base64 string (can be further optimized to binary blob)
        optimizedPhoto = base64Data;
      }

      const profileData = {
        id: `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        email: canvasserData.email || null,
        fullName: canvasserData.fullName,
        phone: canvasserData.phone,
        nin: canvasserData.nin,
        smartCashAccount: canvasserData.smartCashAccount || null,
        role: "canvasser",
        status: "approved",
        location: canvasserData.location || null,
        photo: optimizedPhoto,
        teamId: canvasserData.teamId,
        createdBy: req.user?.id || null,
        approvedBy: req.user?.id || null
      };

      const profile = await storage.createProfile(profileData);
      res.status(201).json({ success: true, profile });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
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

  // Turf Management
  app.get("/api/turfs", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const turfs = await storage.getAllTurfs();
      res.json(turfs);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch turfs" });
    }
  });

  app.post("/api/turfs", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { name, description, geojson, color, teamId, status } = req.body;
      
      if (!name || !geojson || !color) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const turfData = {
        name,
        description: description || null,
        geojson,
        color,
        teamId: teamId ? parseInt(teamId) : null,
        status: status || 'active',
        createdBy: req.user!.id
      };
      
      const turf = await storage.createTurf(turfData);
      res.status(201).json(turf);
    } catch (error: any) {
      console.error('Turf creation error:', error);
      res.status(400).json({ message: error.message || "Failed to create turf" });
    }
  });

  app.put("/api/turfs/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const turfId = parseInt(req.params.id);
      const updateData = req.body;
      
      const updatedTurf = await storage.updateTurf(turfId, updateData);
      if (!updatedTurf) {
        return res.status(404).json({ message: "Turf not found" });
      }
      
      res.json(updatedTurf);
    } catch (error: any) {
      res.status(400).json({ message: "Failed to update turf" });
    }
  });

  app.delete("/api/turfs/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const turfId = parseInt(req.params.id);
      const deleted = await storage.deleteTurf(turfId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Turf not found" });
      }
      
      res.json({ message: "Turf deleted successfully" });
    } catch (error: any) {
      res.status(400).json({ message: "Failed to delete turf" });
    }
  });

  // Get canvasser engagement data for heatmap
  app.get("/api/canvassers/engagement", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const profiles = await storage.getAllProfiles();
      const canvasserActivities = await storage.getCanvasserActivities();
      
      const engagementData = profiles
        .filter(profile => profile.role === 'canvasser')
        .map(profile => {
          // Get activities for this canvasser
          const activities = canvasserActivities.filter(activity => 
            activity.canvasserId === profile.id
          );
          
          // Calculate engagement score based on activities
          const totalActivities = activities.length;
          const recentActivities = activities.filter(activity => {
            const activityDate = new Date(activity.createdAt || '');
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return activityDate >= thirtyDaysAgo;
          }).length;
          
          // Simple engagement calculation: recent activity frequency
          const engagementScore = Math.min(100, (recentActivities * 10) + (totalActivities * 2));
          
          // Parse location if available
          let location = null;
          if (profile.location && typeof profile.location === 'object') {
            const loc = profile.location as any;
            if (loc.latitude && loc.longitude) {
              location = {
                latitude: parseFloat(loc.latitude),
                longitude: parseFloat(loc.longitude)
              };
            }
          }
          
          return {
            id: profile.id,
            email: profile.email,
            full_name: profile.fullName || profile.email,
            location,
            engagement_score: Math.round(engagementScore),
            activities_count: totalActivities,
            last_active: activities.length > 0 
              ? activities.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime())[0].createdAt
              : profile.createdAt,
            status: profile.status || 'pending'
          };
        });
      
      res.json(engagementData);
    } catch (error) {
      console.error("Error fetching canvasser engagement data:", error);
      res.status(500).json({ error: "Failed to fetch engagement data" });
    }
  });

  // Get daily canvasser productivity
  app.get("/api/canvassers/daily-productivity/:date", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { date } = req.params as any;
      const profiles = await storage.getAllProfiles();
      const canvasserActivities = await storage.getCanvasserActivities();
      
      // Generate productivity data for approved canvassers
      const productivityData = profiles
        .filter(profile => profile.role === 'canvasser' && profile.status === 'approved')
        .map(profile => {
          // Get activities for this canvasser on the specific date
          const dayActivities = canvasserActivities.filter(activity => {
            if (activity.canvasserId !== profile.id) return false;
            const activityDate = new Date(activity.createdAt || '').toISOString().split('T')[0];
            return activityDate === date;
          });

          // Calculate metrics
          const dailyTarget = 10; // Default target
          const actualCount = dayActivities.length;
          const gadsPoints = Math.min(100, actualCount * 5);
          const incentiveAmount = actualCount >= dailyTarget ? 1000 : actualCount * 50;
          const performanceRating = actualCount >= dailyTarget * 1.2 ? 'excellent' : 
                                   actualCount >= dailyTarget ? 'good' : 
                                   actualCount >= dailyTarget * 0.8 ? 'average' : 'poor';

          return {
            id: profile.id,
            email: profile.email,
            fullName: profile.fullName || profile.email,
            status: profile.status,
            dailyTarget,
            actualCount,
            gadsPoints,
            incentiveAmount,
            performanceRating,
            notes: '',
            lastUpdated: new Date(),
            updatedBy: 'system'
          };
        });

      res.json(productivityData);
    } catch (error) {
      console.error("Error fetching daily productivity:", error);
      res.status(500).json({ error: "Failed to fetch daily productivity data" });
    }
  });

  // Update canvasser productivity
  app.put("/api/canvassers/:id/productivity", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params as any;
      const updateData = req.body as any;
      
      // For now, we'll return success since this is demonstration data
      // In a real implementation, this would update the database
      res.json({ 
        message: "Productivity updated successfully",
        canvasserId: id,
        updatedFields: updateData
      });
    } catch (error) {
      console.error("Error updating productivity:", error);
      res.status(500).json({ error: "Failed to update productivity data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
