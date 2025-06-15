import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  Users, UserPlus, Shield, Database, Settings, Activity,
  MapPin, Target, BarChart3, Clock, CheckCircle, XCircle,
  Edit, Trash2, Eye, Plus, Search, Filter
} from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  lastLogin?: string;
}

interface Profile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  faeId?: string;
  approvedBy?: string;
  createdAt: string;
}

interface DatabaseStats {
  totalEmployees: number;
  totalProfiles: number;
  totalTeams: number;
  totalTasks: number;
  pendingApprovals: number;
  activeCanvassers: number;
}

export default function AdminCPanel() {
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [isCreateEmployeeOpen, setIsCreateEmployeeOpen] = useState(false);
  const [isCreateProfileOpen, setIsCreateProfileOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch database statistics
  const { data: stats } = useQuery<DatabaseStats>({
    queryKey: ["/api/dashboard/metrics"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch employees data
  const { data: employees = [], isLoading: employeesLoading } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  // Fetch profiles data
  const { data: profiles = [], isLoading: profilesLoading } = useQuery<Profile[]>({
    queryKey: ["/api/profiles"],
  });

  // Create employee mutation
  const createEmployeeMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/employees", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      setIsCreateEmployeeOpen(false);
      toast({ title: "Success", description: "Employee created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create employee", variant: "destructive" });
    },
  });

  // Create profile mutation
  const createProfileMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/profiles", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profiles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      setIsCreateProfileOpen(false);
      toast({ title: "Success", description: "Profile created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create profile", variant: "destructive" });
    },
  });

  // Approve canvasser mutation
  const approveCanvasserMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/profiles/${id}/approve`, "POST", {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profiles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      toast({ title: "Success", description: "Canvasser approved successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to approve canvasser", variant: "destructive" });
    },
  });

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (selectedRole === "all" || emp.role === selectedRole)
  );

  const filteredProfiles = profiles.filter(profile => 
    profile.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (selectedRole === "all" || profile.role === selectedRole)
  );

  const handleCreateEmployee = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const data = {
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
      role: formData.get("role"),
      department: formData.get("department"),
      region: formData.get("region"),
    };
    createEmployeeMutation.mutate(data);
  };

  const handleCreateProfile = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const data = {
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      role: formData.get("role"),
      faeId: formData.get("faeId"),
      address: formData.get("address"),
    };
    createProfileMutation.mutate(data);
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">FieldForce Pro - Admin Control Panel</h1>
                <p className="text-slate-600 mt-1">Complete database and user management for Supabase integration</p>
              </div>
              <div className="flex gap-2">
                <Dialog open={isCreateEmployeeOpen} onOpenChange={setIsCreateEmployeeOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-600 text-white hover:bg-blue-700">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add Employee
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Create New Employee</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateEmployee} className="space-y-4">
                      <div>
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" name="name" required />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" name="email" type="email" required />
                      </div>
                      <div>
                        <Label htmlFor="password">Password</Label>
                        <Input id="password" name="password" type="password" required />
                      </div>
                      <div>
                        <Label htmlFor="role">Role</Label>
                        <Select name="role" required>
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="FAE">Field Area Executive</SelectItem>
                            <SelectItem value="supervisor">Supervisor</SelectItem>
                            <SelectItem value="manager">Manager</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="department">Department</Label>
                        <Input id="department" name="department" />
                      </div>
                      <div>
                        <Label htmlFor="region">Region</Label>
                        <Input id="region" name="region" />
                      </div>
                      <Button type="submit" className="w-full" disabled={createEmployeeMutation.isPending}>
                        {createEmployeeMutation.isPending ? "Creating..." : "Create Employee"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>

                <Dialog open={isCreateProfileOpen} onOpenChange={setIsCreateProfileOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-green-600 text-white hover:bg-green-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Profile
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Create New Profile</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateProfile} className="space-y-4">
                      <div>
                        <Label htmlFor="profile-name">Full Name</Label>
                        <Input id="profile-name" name="name" required />
                      </div>
                      <div>
                        <Label htmlFor="profile-email">Email</Label>
                        <Input id="profile-email" name="email" type="email" required />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone</Label>
                        <Input id="phone" name="phone" />
                      </div>
                      <div>
                        <Label htmlFor="profile-role">Role</Label>
                        <Select name="role" required>
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="canvasser">Canvasser</SelectItem>
                            <SelectItem value="fae">Field Area Executive</SelectItem>
                            <SelectItem value="team_lead">Team Lead</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="faeId">FAE ID (for canvassers)</Label>
                        <Input id="faeId" name="faeId" placeholder="Optional" />
                      </div>
                      <div>
                        <Label htmlFor="address">Address</Label>
                        <Textarea id="address" name="address" />
                      </div>
                      <Button type="submit" className="w-full" disabled={createProfileMutation.isPending}>
                        {createProfileMutation.isPending ? "Creating..." : "Create Profile"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="employees">Employees</TabsTrigger>
              <TabsTrigger value="profiles">Profiles</TabsTrigger>
              <TabsTrigger value="database">Database</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.totalEmployees || 0}</div>
                    <p className="text-xs text-muted-foreground">Active staff members</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Profiles</CardTitle>
                    <Shield className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.totalProfiles || 0}</div>
                    <p className="text-xs text-muted-foreground">Field operations profiles</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Canvassers</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.activeCanvassers || 0}</div>
                    <p className="text-xs text-muted-foreground">Field team members</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Teams</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.totalTeams || 0}</div>
                    <p className="text-xs text-muted-foreground">Active teams</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.totalTasks || 0}</div>
                    <p className="text-xs text-muted-foreground">Assigned tasks</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.pendingApprovals || 0}</div>
                    <p className="text-xs text-muted-foreground">Awaiting approval</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>System Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span>Supabase Connection</span>
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Connected
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Database Status</span>
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Operational
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>API Status</span>
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="employees" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Employee Management</CardTitle>
                  <div className="flex gap-4 mt-4">
                    <div className="flex-1">
                      <Input
                        placeholder="Search employees..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="max-w-sm"
                      />
                    </div>
                    <Select value={selectedRole} onValueChange={setSelectedRole}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Filter by role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="FAE">Field Area Executive</SelectItem>
                        <SelectItem value="supervisor">Supervisor</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  {employeesLoading ? (
                    <div className="text-center py-8">Loading employees...</div>
                  ) : (
                    <div className="space-y-4">
                      {filteredEmployees.map((employee) => (
                        <div key={employee.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <Users className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="font-medium">{employee.name}</h3>
                              <p className="text-sm text-slate-600">{employee.email}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline">{employee.role}</Badge>
                                <Badge 
                                  variant={employee.status === 'active' ? 'default' : 'secondary'}
                                  className={employee.status === 'active' ? 'bg-green-100 text-green-800' : ''}
                                >
                                  {employee.status}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="profiles" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Management</CardTitle>
                  <div className="flex gap-4 mt-4">
                    <div className="flex-1">
                      <Input
                        placeholder="Search profiles..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="max-w-sm"
                      />
                    </div>
                    <Select value={selectedRole} onValueChange={setSelectedRole}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Filter by role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="canvasser">Canvasser</SelectItem>
                        <SelectItem value="fae">Field Area Executive</SelectItem>
                        <SelectItem value="team_lead">Team Lead</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  {profilesLoading ? (
                    <div className="text-center py-8">Loading profiles...</div>
                  ) : (
                    <div className="space-y-4">
                      {filteredProfiles.map((profile) => (
                        <div key={profile.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                              <Shield className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                              <h3 className="font-medium">{profile.name}</h3>
                              <p className="text-sm text-slate-600">{profile.email}</p>
                              {profile.phone && (
                                <p className="text-sm text-slate-500">{profile.phone}</p>
                              )}
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline">{profile.role}</Badge>
                                <Badge 
                                  variant={profile.status === 'approved' ? 'default' : 
                                          profile.status === 'pending' ? 'secondary' : 'destructive'}
                                  className={
                                    profile.status === 'approved' ? 'bg-green-100 text-green-800' :
                                    profile.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                  }
                                >
                                  {profile.status}
                                </Badge>
                                {profile.faeId && (
                                  <Badge variant="outline">FAE: {profile.faeId}</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {profile.status === 'pending' && (
                              <Button 
                                size="sm" 
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => approveCanvasserMutation.mutate(profile.id)}
                                disabled={approveCanvasserMutation.isPending}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                            )}
                            <Button size="sm" variant="outline">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="database" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Database Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Connection Status</h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span>Supabase URL</span>
                          <Badge variant="default" className="bg-blue-100 text-blue-800">
                            Connected
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Database URL</span>
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            Active
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Connection Type</span>
                          <Badge variant="outline">Direct Database</Badge>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Table Statistics</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Employees</span>
                          <span className="font-medium">{stats?.totalEmployees || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Profiles</span>
                          <span className="font-medium">{stats?.totalProfiles || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Teams</span>
                          <span className="font-medium">{stats?.totalTeams || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tasks</span>
                          <span className="font-medium">{stats?.totalTasks || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Database Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button variant="outline" className="flex items-center justify-center">
                      <Database className="w-4 h-4 mr-2" />
                      Backup Database
                    </Button>
                    <Button variant="outline" className="flex items-center justify-center">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      View Analytics
                    </Button>
                    <Button variant="outline" className="flex items-center justify-center">
                      <Settings className="w-4 h-4 mr-2" />
                      Configuration
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Environment Configuration</h3>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Node Environment</Label>
                            <Input value="development" disabled />
                          </div>
                          <div>
                            <Label>Port</Label>
                            <Input value="5000" disabled />
                          </div>
                        </div>
                        <div>
                          <Label>Database URL</Label>
                          <Input value="postgresql://***connected***" disabled />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-4">Application Settings</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span>Auto-approve canvassers</span>
                          <Button size="sm" variant="outline">Configure</Button>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Email notifications</span>
                          <Button size="sm" variant="outline">Configure</Button>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>API rate limiting</span>
                          <Button size="sm" variant="outline">Configure</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}