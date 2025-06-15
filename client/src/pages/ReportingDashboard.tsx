import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MetricsLoading, TableLoading } from "@/components/ui/loading";
import { 
  Users, 
  CheckCircle, 
  Clock, 
  Trophy, 
  Download,
  Plus,
  Edit,
  Eye,
  Code,
  Megaphone,
  User
} from "lucide-react";
import { Link } from "wouter";

interface Metrics {
  totalUsers: number;
  totalTeams: number;
  completedTasks: number;
  totalTasks: number;
  avgAttendance: number;
  productivity: number;
}

interface TeamWithStats {
  id: number;
  name: string;
  description: string;
  category: string;
  memberCount: number;
  taskCount: number;
  progress: number;
}

export default function ReportingDashboard() {
  const { data: metrics, isLoading: metricsLoading } = useQuery<Metrics>({
    queryKey: ["/api/dashboard/metrics"],
  });

  const { data: teams, isLoading: teamsLoading } = useQuery<TeamWithStats[]>({
    queryKey: ["/api/teams"],
  });

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'development':
        return <Code className="text-primary-600 w-5 h-5" />;
      case 'marketing':
        return <Megaphone className="text-green-600 w-5 h-5" />;
      default:
        return <Users className="text-slate-600 w-5 h-5" />;
    }
  };

  const getCategoryBgColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'development':
        return 'bg-primary-100';
      case 'marketing':
        return 'bg-green-100';
      default:
        return 'bg-slate-100';
    }
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Dashboard Overview</h1>
                <p className="text-slate-600 mt-1">Monitor your team's performance and key metrics</p>
              </div>
              <div className="flex items-center space-x-3">
                <Select defaultValue="30">
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                  </SelectContent>
                </Select>
                <Button className="bg-primary-600 text-white hover:bg-primary-700">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </div>

          {/* Metrics Cards */}
          {metricsLoading ? (
            <MetricsLoading />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="shadow-sm border-slate-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                      <Users className="text-primary-600 w-6 h-6" />
                    </div>
                    <span className="text-green-500 text-sm font-medium">+12%</span>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">{metrics?.totalUsers || 0}</h3>
                  <p className="text-slate-500 text-sm">Total Users</p>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-slate-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="text-green-600 w-6 h-6" />
                    </div>
                    <span className="text-green-500 text-sm font-medium">+8%</span>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">{metrics?.completedTasks || 0}</h3>
                  <p className="text-slate-500 text-sm">Completed Tasks</p>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-slate-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                      <Clock className="text-amber-600 w-6 h-6" />
                    </div>
                    <span className="text-red-500 text-sm font-medium">-3%</span>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">{metrics?.avgAttendance || 0}%</h3>
                  <p className="text-slate-500 text-sm">Avg. Attendance</p>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-slate-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Trophy className="text-purple-600 w-6 h-6" />
                    </div>
                    <span className="text-green-500 text-sm font-medium">+15%</span>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">{metrics?.productivity || 0}%</h3>
                  <p className="text-slate-500 text-sm">Productivity Score</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Charts and Tables Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Performance Chart */}
            <Card className="shadow-sm border-slate-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-slate-900">Performance Trends</h2>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" className="bg-primary-100 text-primary-700 border-primary-200">
                      Week
                    </Button>
                    <Button variant="ghost" size="sm" className="text-slate-500">
                      Month
                    </Button>
                  </div>
                </div>
                <div className="h-64 bg-slate-50 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="w-16 h-16 text-slate-400 mx-auto mb-2" />
                    <p className="text-slate-500">Performance Chart</p>
                    <p className="text-xs text-slate-400 mt-1">Chart implementation pending</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activities */}
            <Card className="shadow-sm border-slate-200">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold text-slate-900 mb-6">Recent Activities</h2>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <User className="text-primary-600 w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">System initialized successfully</p>
                      <p className="text-xs text-slate-500">Just now</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="text-green-600 w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">Dashboard loaded</p>
                      <p className="text-xs text-slate-500">1 minute ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Teams Overview Table */}
          <Card className="shadow-sm border-slate-200">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-900">Teams Overview</h2>
                <Link href="/create-team">
                  <Button className="bg-primary-600 text-white hover:bg-primary-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Team
                  </Button>
                </Link>
              </div>
            </div>
            <div className="overflow-x-auto">
              {teamsLoading ? (
                <div className="p-6">
                  <TableLoading />
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Team</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Members</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tasks</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Progress</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {teams && teams.length > 0 ? (
                      teams.map((team) => (
                        <tr key={team.id}>
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className={`w-10 h-10 ${getCategoryBgColor(team.category)} rounded-lg flex items-center justify-center mr-3`}>
                                {getCategoryIcon(team.category)}
                              </div>
                              <div>
                                <p className="font-medium text-slate-900">{team.name}</p>
                                <p className="text-sm text-slate-500">{team.description}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-900">{team.memberCount}</td>
                          <td className="px-6 py-4 text-sm text-slate-900">{team.taskCount}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="w-full bg-slate-200 rounded-full h-2 mr-2">
                                <div 
                                  className="bg-primary-600 h-2 rounded-full" 
                                  style={{ width: `${team.progress}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-slate-600">{team.progress}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              Active
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              <Button variant="ghost" size="sm" className="text-primary-600 hover:text-primary-800">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-600">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                          No teams found. Create your first team to get started.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
