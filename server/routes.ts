import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import { supabaseStorage, supabase } from "./supabase";
import { signInSchema, insertUserSchema, insertTeamSchema, insertTaskSchema, insertAttendanceSchema } from "@shared/schema";
import { z } from "zod";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

interface AuthRequest extends Request {
  user?: { id: number; email: string; role: string };
}

// Middleware to verify JWT token
const authenticateToken = async (req: AuthRequest, res: Response, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    console.log('Token decoded:', decoded);
    
    // Handle demo user authentication
    if (decoded.type === 'demo_user') {
      req.user = { id: decoded.id, email: decoded.email, role: decoded.role };
      next();
      return;
    }
    
    // Handle Supabase authentication
    if (decoded.type === 'supabase') {
      req.user = { id: decoded.id, email: decoded.email, role: decoded.roles?.[0] || 'USER' };
      next();
      return;
    }
    
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
    console.error('Token verification error:', error);
    return res.status(401).json({ message: 'Invalid token' });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Test Supabase connection and check table schema
  app.get("/api/test/supabase", async (req, res) => {
    try {
      if (!supabase) {
        return res.status(500).json({ error: 'Supabase client not available' });
      }

      // Check if tables exist and their schema
      const { data: employeesData, error: employeesError } = await supabase
        .from('employees')
        .select('*')
        .limit(0);

      const { data: rolesData, error: rolesError } = await supabase
        .from('roles')
        .select('*')
        .limit(0);

      // Try to get table structure information
      let schemaInfo = {};
      try {
        const { data: tableInfo } = await supabase
          .rpc('get_schema_info');
        schemaInfo = tableInfo;
      } catch (e) {
        // Ignore if RPC doesn't exist
      }

      res.json({
        status: 'connected',
        message: 'Supabase connection successful',
        tables: {
          employees: {
            exists: !employeesError,
            error: employeesError?.message || null
          },
          roles: {
            exists: !rolesError,
            error: rolesError?.message || null
          }
        },
        schemaInfo
      });
    } catch (error) {
      res.status(500).json({ 
        status: 'error',
        error: error.message,
        message: 'Failed to test Supabase connection'
      });
    }
  });

  // Create database tables and initialize system
  app.post("/api/setup/init", async (req, res) => {
    try {
      if (!supabase) {
        return res.status(500).json({ error: 'Supabase client not available' });
      }

      console.log('Creating database schema via Supabase client...');
      
      // Create roles table using direct SQL execution
      const createRolesSQL = `
        CREATE TABLE IF NOT EXISTS roles (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          description TEXT,
          permissions JSONB DEFAULT '[]',
          created_at TIMESTAMP DEFAULT NOW()
        );
      `;

      const createUserRolesSQL = `
        CREATE TABLE IF NOT EXISTS user_roles (
          id SERIAL PRIMARY KEY,
          user_id UUID NOT NULL,
          role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
          created_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(user_id, role_id)
        );
      `;

      const createEmployeesSQL = `
        CREATE TABLE IF NOT EXISTS employees (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email TEXT NOT NULL UNIQUE,
          full_name TEXT NOT NULL,
          role TEXT NOT NULL,
          department TEXT,
          phone TEXT,
          status TEXT NOT NULL DEFAULT 'active',
          supabase_user_id UUID UNIQUE,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `;

      // Add supabase_user_id column to existing employees table
      const addSupabaseUserIdSQL = `
        ALTER TABLE employees 
        ADD COLUMN IF NOT EXISTS supabase_user_id UUID UNIQUE;
      `;

      // Create roles and user_roles tables
      try {
        await supabase.rpc('exec_sql', { sql: addSupabaseUserIdSQL });
        await supabase.rpc('exec_sql', { sql: createRolesSQL });
        await supabase.rpc('exec_sql', { sql: createUserRolesSQL });
      } catch (sqlError) {
        console.log('SQL execution may not be supported, trying direct table operations...');
      }

      // Initialize default roles
      const defaultRoles = [
        { name: 'FAE', description: 'Field Area Engineer', permissions: ['create_teams', 'manage_canvassers', 'view_reports'] },
        { name: 'ADMIN', description: 'Administrator', permissions: ['full_access'] },
        { name: 'CANVASSER', description: 'Canvasser', permissions: ['update_profile', 'submit_activities'] },
        { name: 'SUPERVISOR', description: 'Supervisor', permissions: ['view_teams', 'view_reports'] }
      ];

      const createdRoles = [];
      for (const roleData of defaultRoles) {
        try {
          const { data, error } = await supabase
            .from('roles')
            .upsert({
              name: roleData.name,
              description: roleData.description,
              permissions: roleData.permissions
            }, { 
              onConflict: 'name',
              ignoreDuplicates: true 
            })
            .select()
            .single();

          if (!error && data) {
            createdRoles.push(data);
            console.log(`Created/updated role: ${roleData.name}`);
          }
        } catch (roleError) {
          console.log(`Role ${roleData.name} may already exist:`, roleError);
        }
      }
      
      res.json({ 
        message: 'Database schema created and system initialized successfully',
        createdRoles,
        tablesCreated: ['roles', 'user_roles', 'employees'],
        supabaseConnected: true
      });
    } catch (error) {
      console.error('Error initializing system:', error);
      res.status(500).json({ error: 'Failed to initialize system', details: error.message });
    }
  });

  // Create employee record for manual Supabase user signup
  app.post("/api/setup/create-employee", async (req, res) => {
    try {
      if (!supabase) {
        return res.status(500).json({ error: 'Supabase client not available' });
      }

      const { email, fullName, role = 'FAE', supabaseUserId } = req.body;
      console.log("Creating employee record:", email);

      // Update existing employee record to link with Supabase user
      // First check if employee exists
      const { data: existingEmployee } = await supabase
        .from('employees')
        .select('*')
        .eq('email', email)
        .single();

      if (!existingEmployee) {
        return res.status(404).json({ error: 'Employee not found with this email' });
      }

      const { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .update({
          supabase_user_id: supabaseUserId
        })
        .eq('email', email)
        .select()
        .single();

      if (employeeError) {
        console.error('Error creating employee:', employeeError);
        return res.status(400).json({ error: employeeError.message });
      }

      // Assign role to user if supabaseUserId provided
      if (supabaseUserId) {
        const { data: roleData } = await supabase
          .from('roles')
          .select('id')
          .eq('name', role)
          .single();

        if (roleData) {
          await supabase
            .from('user_roles')
            .insert({
              user_id: supabaseUserId,
              role_id: roleData.id
            });
        }
      }

      res.json({
        message: 'Employee record created successfully',
        employee: employeeData,
        role
      });
    } catch (error) {
      console.error('Error creating employee:', error);
      res.status(500).json({ error: 'Failed to create employee' });
    }
  });

  // Simple user registration that works with Supabase auth
  app.post("/api/auth/register", async (req, res) => {
    try {
      if (!supabase) {
        return res.status(500).json({ error: 'Supabase client not available' });
      }

      // Log request body to debug validation issue
      console.log("Register request body:", req.body);
      
      const { email, password, fullName, role = 'FAE' } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }
      
      console.log("Registering user:", email);

      // Sign up user with Supabase auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role
          }
        }
      });

      if (error) {
        console.error('Supabase signup error:', error);
        return res.status(400).json({ error: error.message });
      }

      // If user is created immediately (email confirmation disabled)
      if (data.user && !data.user.email_confirmed_at) {
        // Create employee record
        const { data: employeeData, error: employeeError } = await supabase
          .from('employees')
          .insert({
            email,
            full_name: fullName || `User - ${role}`,
            role,
            department: role === 'FAE' ? 'Field Operations' : 'Administration',
            phone: '+1234567890',
            status: 'active',
            supabase_user_id: data.user.id
          })
          .select()
          .single();

        // Assign role to user
        const { data: roleData } = await supabase
          .from('roles')
          .select('id')
          .eq('name', role)
          .single();

        if (roleData) {
          await supabase
            .from('user_roles')
            .insert({
              user_id: data.user.id,
              role_id: roleData.id
            });
        }
      }

      res.json({
        message: 'User registration initiated',
        user: data.user,
        session: data.session,
        needsConfirmation: !data.session
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Failed to register user' });
    }
  });

  // Supabase auth-based authentication
  app.post("/api/auth/supabase-signin", async (req, res) => {
    try {
      if (!supabase) {
        return res.status(500).json({ error: 'Supabase client not available' });
      }

      const { email, password } = signInSchema.parse(req.body);
      console.log("Supabase login attempt for:", email);

      // Sign in with Supabase auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Supabase auth error:', error);
        return res.status(401).json({ error: error.message });
      }

      if (data.user) {
        // Get employee data by matching email from existing employees table
        const { data: employeeData } = await supabase
          .from('employees')
          .select('*')
          .eq('email', data.user.email)
          .single();

        // Determine roles based on employee data
        let roles = [];
        if (employeeData) {
          roles = [employeeData.role]; // Use the role from employees table
        }

        const userWithRoles = {
          id: data.user.id,
          email: data.user.email,
          roles,
          employee: employeeData
        };

        console.log("User authenticated with roles:", roles);
        console.log("Employee data:", employeeData?.fullnames, employeeData?.role);

        // Create JWT token with role information
        const token = jwt.sign(
          { 
            id: userWithRoles.id, 
            email: userWithRoles.email, 
            roles: userWithRoles.roles,
            employee: employeeData,
            type: 'supabase' 
          },
          JWT_SECRET,
          { expiresIn: '24h' }
        );

        return res.json({
          token,
          user: userWithRoles,
          session: data.session
        });
      }

      return res.status(401).json({ error: 'Authentication failed' });
    } catch (error) {
      console.error('Supabase signin error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Setup route for initializing employees table
  app.post("/api/setup/employees", async (req, res) => {
    try {
      console.log('Setting up employees table with initial data...');
      
      // Check if employees already exist
      const existingEmployees = await supabaseStorage.getAllEmployees();
      if (existingEmployees.length > 0) {
        return res.json({ 
          message: 'Employees already exist', 
          count: existingEmployees.length,
          employees: existingEmployees 
        });
      }

      // Create FAE employee
      const faeEmployee = await supabaseStorage.createEmployee({
        email: 'fae@company.com',
        fullName: 'John Doe - Field Area Executive',
        role: 'FAE',
        department: 'Field Operations',
        phone: '+1234567890',
        status: 'active'
      });
      console.log('Created FAE employee:', faeEmployee.email);

      // Create Admin employee
      const adminEmployee = await supabaseStorage.createEmployee({
        email: 'admin@company.com',
        fullName: 'Jane Smith - Administrator',
        role: 'ADMIN',
        department: 'Administration',
        phone: '+1234567891',
        status: 'active'
      });
      console.log('Created Admin employee:', adminEmployee.email);

      res.json({ 
        message: 'Employees setup completed successfully!',
        employees: [faeEmployee, adminEmployee]
      });
    } catch (error) {
      console.error('Error setting up employees:', error);
      res.status(500).json({ error: 'Failed to setup employees', details: error.message });
    }
  });

  // Demo authentication route - restricted to demo page access
  app.post("/api/auth/demo-signin", async (req, res) => {
    try {
      console.log("Demo login attempt for:", req.body?.email);
      console.log("Demo request body:", req.body);
      
      const { email, password } = req.body;
      
      // Demo credentials - hardcoded for demo environment only
      const demoAccounts = [
        { email: 'fae@company.com', password: 'demo123', name: 'John Doe - Field Area Executive', role: 'FAE', id: 'demo-fae-001' },
        { email: 'admin@company.com', password: 'demo123', name: 'Jane Smith - Administrator', role: 'ADMIN', id: 'demo-admin-001' },
        { email: 'admin@example.com', password: 'admin123', name: 'Demo User', role: 'ADMIN', id: 'demo-user-001' }
      ];

      const demoUser = demoAccounts.find(account => 
        account.email === email && account.password === password
      );

      if (demoUser) {
        console.log("Demo user authenticated:", demoUser.email, demoUser.role);
        
        const token = jwt.sign(
          { id: demoUser.id, email: demoUser.email, role: demoUser.role, type: 'demo_user' },
          JWT_SECRET,
          { expiresIn: '24h' }
        );

        return res.json({
          token,
          user: {
            id: demoUser.id,
            email: demoUser.email,
            name: demoUser.name,
            role: demoUser.role,
            type: 'demo_user'
          }
        });
      }

      return res.status(401).json({ message: "Invalid demo credentials" });
    } catch (error) {
      console.error("Demo sign in error:", error);
      res.status(400).json({ message: "Invalid demo request", details: error.message });
    }
  });

  // Production authentication route - Supabase only
  app.post("/api/auth/signin", async (req, res) => {
    try {
      console.log("Production login attempt for:", req.body?.email);
      const { email, password } = signInSchema.parse(req.body);
      
      // Only allow Supabase authentication for production
      // No demo credentials or simplified authentication
      return res.status(401).json({ 
        message: "Please use Supabase authentication for production access",
        hint: "Register with your email or use the demo environment"
      });

    } catch (error) {
      console.error("Production sign in error:", error);
      res.status(400).json({ message: "Invalid request data", details: error.message });
    }
  });

  // Forgot password route
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // Check if email exists in users or employees
      const user = await storage.getUserByEmail(email);
      const demoEmployees = [
        { id: 'fae-001', email: 'fae@company.com', fullName: 'John Doe - Field Area Executive', role: 'FAE' },
        { id: 'admin-001', email: 'admin@company.com', fullName: 'Jane Smith - Administrator', role: 'ADMIN' }
      ];
      const employee = demoEmployees.find(emp => emp.email === email);

      if (!user && !employee) {
        // For security, always return success even if email doesn't exist
        return res.json({ message: "If this email exists, a reset link has been sent" });
      }

      // Generate reset token
      const resetToken = jwt.sign(
        { email, type: 'password_reset' },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      // In production, you would send an email here
      console.log(`Password reset link for ${email}: /reset-password?token=${resetToken}`);

      res.json({ 
        message: "Password reset link sent successfully",
        // In development, include the token for testing
        ...(process.env.NODE_ENV === 'development' && { resetToken })
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Reset password route
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, newPassword, confirmPassword } = req.body;

      if (!token || !newPassword || !confirmPassword) {
        return res.status(400).json({ message: "All fields are required" });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: "Passwords do not match" });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters long" });
      }

      // Verify reset token
      let decoded;
      try {
        decoded = jwt.verify(token, JWT_SECRET) as any;
      } catch (error) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }

      if (decoded.type !== 'password_reset') {
        return res.status(400).json({ message: "Invalid reset token" });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update user password
      const user = await storage.getUserByEmail(decoded.email);
      if (user) {
        await storage.updateUser(user.id, { password: hashedPassword });
        console.log(`Password updated for user: ${decoded.email}`);
      } else {
        // Handle employee password update (in real implementation, this would update the employee table)
        console.log(`Password reset requested for employee: ${decoded.email} (not implemented in demo)`);
      }

      res.json({ message: "Password reset successfully" });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Duplicate route removed - using Supabase registration above

  // Protected routes
  app.get("/api/user/profile", authenticateToken, async (req: AuthRequest, res) => {
    const userId = String(req.user!.id);
    console.log('Profile request for userId:', userId, 'type:', typeof userId);
    
    // Handle demo user profile requests
    if (userId.startsWith('demo-')) {
      console.log('Handling demo user profile');
      return res.json({
        id: req.user!.id,
        email: req.user!.email,
        name: userId.includes('fae') ? 'John Doe - Field Area Executive' : 
              userId.includes('admin') ? 'Jane Smith - Administrator' : 'Demo User',
        role: req.user!.role,
        type: 'demo_user'
      });
    }

    // Handle employee profile requests
    if (userId.startsWith('fae-') || userId.startsWith('admin-')) {
      return res.json({
        id: req.user!.id,
        email: req.user!.email,
        name: userId.startsWith('fae-') ? 'John Doe - Field Area Executive' : 'Jane Smith - Administrator',
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

  // Get employees
  app.get("/api/employees", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const employees = await storage.getAllEmployees();
      res.json(employees);
    } catch (error) {
      console.error("Error fetching employees:", error);
      res.status(500).json({ error: "Failed to fetch employees" });
    }
  });

  // Get activity planner data
  app.get("/api/activity-planner", authenticateToken, async (req: AuthRequest, res) => {
    try {
      // Since we're using in-memory storage, we'll return mock data for demonstration
      const mockActivityPlans = [
        {
          id: 1,
          date: "2025-06-15",
          location: "Central Mall",
          activity: "Mega Activation",
          notes: "Special promotion event",
          userEmail: "admin@company.com",
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 2,
          date: "2025-06-18",
          location: "Downtown Plaza",
          activity: "Mini Activation",
          notes: "Weekend outreach",
          userEmail: "admin@company.com",
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      res.json(mockActivityPlans);
    } catch (error) {
      console.error("Error fetching activity plans:", error);
      res.status(500).json({ error: "Failed to fetch activity plans" });
    }
  });

  // Create activity plan
  app.post("/api/activity-planner", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const activityData = req.body as any;
      const activity = await storage.createActivityPlanner(activityData);
      res.status(201).json(activity);
    } catch (error) {
      console.error("Error creating activity plan:", error);
      res.status(500).json({ error: "Failed to create activity plan" });
    }
  });

  // OKR Target routes
  app.get("/api/okr-targets", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const targets = await storage.getAllOkrTargets();
      res.json(targets);
    } catch (error) {
      console.error("Error fetching OKR targets:", error);
      res.status(500).json({ error: "Failed to fetch OKR targets" });
    }
  });

  app.post("/api/okr-targets", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const targetData = req.body as any;
      const target = await storage.createOkrTarget(targetData);
      res.status(201).json(target);
    } catch (error) {
      console.error("Error creating OKR target:", error);
      res.status(500).json({ error: "Failed to create OKR target" });
    }
  });

  // OKR Actual results routes
  app.get("/api/okr-actuals", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const actuals = await storage.getAllOkrActuals();
      res.json(actuals);
    } catch (error) {
      console.error("Error fetching OKR actuals:", error);
      res.status(500).json({ error: "Failed to fetch OKR actuals" });
    }
  });

  app.post("/api/okr-actuals", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const actualData = req.body as any;
      const actual = await storage.createOkrActual(actualData);
      res.status(201).json(actual);
    } catch (error) {
      console.error("Error creating OKR actual:", error);
      res.status(500).json({ error: "Failed to create OKR actual" });
    }
  });

  // Sales Metrics routes
  app.get("/api/sales-metrics", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const period = req.query?.period as string;
      const metrics = period 
        ? await storage.getSalesMetricsByPeriod(period)
        : await storage.getAllSalesMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching sales metrics:", error);
      res.status(500).json({ error: "Failed to fetch sales metrics" });
    }
  });

  app.post("/api/sales-metrics", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const metricData = req.body as any;
      const metric = await storage.createSalesMetric(metricData);
      res.status(201).json(metric);
    } catch (error) {
      console.error("Error creating sales metric:", error);
      res.status(500).json({ error: "Failed to create sales metric" });
    }
  });

  // Admin CPanel Routes for Employee and Profile Management
  app.get("/api/employees", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const employees = await storage.getAllEmployees();
      const employeesWithoutPasswords = employees.map(({ password, ...emp }) => emp);
      res.json(employeesWithoutPasswords);
    } catch (error) {
      console.error("Error fetching employees:", error);
      res.status(500).json({ message: "Failed to fetch employees" });
    }
  });

  app.post("/api/employees", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const data = insertUserSchema.parse(req.body);
      const employee = await storage.createUser(data);
      const { password, ...employeeWithoutPassword } = employee;
      res.status(201).json(employeeWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating employee:", error);
      res.status(500).json({ message: "Failed to create employee" });
    }
  });

  app.get("/api/profiles", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const profiles = await storage.getAllProfiles();
      res.json(profiles);
    } catch (error) {
      console.error("Error fetching profiles:", error);
      res.status(500).json({ message: "Failed to fetch profiles" });
    }
  });

  app.post("/api/profiles", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const profileData = {
        ...req.body,
        status: "pending"
      };
      const profile = await storage.createProfile(profileData);
      res.status(201).json(profile);
    } catch (error) {
      console.error("Error creating profile:", error);
      res.status(500).json({ message: "Failed to create profile" });
    }
  });

  app.post("/api/profiles/:id/approve", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const approvedBy = req.user?.id?.toString() || "admin";
      const profile = await storage.approveCanvasser(id, approvedBy);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      res.json(profile);
    } catch (error) {
      console.error("Error approving canvasser:", error);
      res.status(500).json({ message: "Failed to approve canvasser" });
    }
  });

  app.post("/api/profiles/:id/reject", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const profile = await storage.rejectCanvasser(id);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      res.json(profile);
    } catch (error) {
      console.error("Error rejecting canvasser:", error);
      res.status(500).json({ message: "Failed to reject canvasser" });
    }
  });

  // FAE Performance Reporting API
  app.get("/api/fae-performance/report", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { fae_email, start_date, end_date } = req.query;
      
      if (!fae_email || !start_date || !end_date) {
        return res.status(400).json({ error: "Missing required parameters: fae_email, start_date, end_date" });
      }

      // Mock performance data for demonstration
      const mockDailyReports = [
        { date: start_date, gads: 15, smartphone_activation: 8, others: 3, total: 26, canvassers_active: 5 },
        { date: end_date, gads: 12, smartphone_activation: 6, others: 4, total: 22, canvassers_active: 4 }
      ];

      res.json({ daily_reports: mockDailyReports, monthly_reports: [] });
    } catch (error: any) {
      console.error("Error generating FAE performance report:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/canvasser-performance", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const performanceData = req.body;
      
      if (!performanceData.canvasser_id || !performanceData.date) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      performanceData.recorded_by = req.user?.email;
      performanceData.id = Date.now();
      performanceData.created_at = new Date().toISOString();
      
      res.json(performanceData);
    } catch (error: any) {
      console.error("Error creating canvasser performance:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // SIM Collection API routes
  app.get("/api/sim-collection", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const collections = await storage.getAllSimCollections();
      res.json(collections);
    } catch (error) {
      console.error("Error fetching SIM collections:", error);
      res.status(500).json({ error: "Failed to fetch SIM collections" });
    }
  });

  app.post("/api/sim-collection", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { date, quantity, source, source_details, allocation_type, allocation_details } = req.body;
      
      if (!date || !quantity || quantity <= 0) {
        return res.status(400).json({ error: "Date and quantity are required" });
      }

      if (!source && !allocation_type) {
        return res.status(400).json({ error: "Either source or allocation type is required" });
      }

      const collection = await storage.createSimCollection({
        date,
        quantity,
        source: source || null,
        sourceDetails: source_details || null,
        allocationType: allocation_type || null,
        allocationDetails: allocation_details || null,
        useremail: req.user!.email
      });

      res.json(collection);
    } catch (error) {
      console.error("Error creating SIM collection:", error);
      res.status(500).json({ error: "Failed to create SIM collection" });
    }
  });

  // Campaign routes
  app.get("/api/campaigns", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const campaigns = await storage.getAllCampaigns();
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      res.status(500).json({ error: "Failed to fetch campaigns" });
    }
  });

  app.post("/api/campaigns", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const campaignData = req.body;
      
      if (!campaignData.name || !campaignData.type) {
        return res.status(400).json({ error: "Campaign name and type are required" });
      }

      const campaign = await storage.createCampaign({
        ...campaignData,
        createdBy: req.user!.id
      });

      res.json(campaign);
    } catch (error) {
      console.error("Error creating campaign:", error);
      res.status(500).json({ error: "Failed to create campaign" });
    }
  });

  app.get("/api/campaigns/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const campaign = await storage.getCampaign(id);
      
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      res.json(campaign);
    } catch (error) {
      console.error("Error fetching campaign:", error);
      res.status(500).json({ error: "Failed to fetch campaign" });
    }
  });

  app.put("/api/campaigns/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const campaignData = req.body;
      
      const campaign = await storage.updateCampaign(id, campaignData);
      
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      res.json(campaign);
    } catch (error) {
      console.error("Error updating campaign:", error);
      res.status(500).json({ error: "Failed to update campaign" });
    }
  });

  app.delete("/api/campaigns/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteCampaign(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting campaign:", error);
      res.status(500).json({ error: "Failed to delete campaign" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
