import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MetricsLoading, TableLoading } from "@/components/ui/loading";
import { 
  Download, 
  Filter, 
  Calendar,
  TrendingUp, 
  TrendingDown,
  BarChart3,
  PieChart,
  Target,
  Users,
  CheckCircle,
  Clock
} from "lucide-react";
import { Task, Team, User, Attendance } from "@shared/schema";

interface ReportMetrics {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  teamPerformance: Array<{
    teamName: string;
    completionRate: number;
    totalTasks: number;
    completedTasks: number;
  }>;
  userPerformance: Array<{
    userName: string;
    completedTasks: number;
    pendingTasks: number;
    productivityScore: number;
  }>;
  attendanceMetrics: {
    averageAttendance: number;
    totalPresent: number;
    totalAbsent: number;
    totalLate: number;
  };
}

export default function GadsReporting() {
  const [dateRange, setDateRange] = useState("30");
  const [reportType, setReportType] = useState("overview");
  const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: tasks, isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: teams, isLoading: teamsLoading } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
  });

  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: attendance, isLoading: attendanceLoading } = useQuery<Attendance[]>({
    queryKey: ["/api/attendance"],
  });

  const isLoading = tasksLoading || teamsLoading || usersLoading || attendanceLoading;

  // Calculate report metrics
  const reportMetrics: ReportMetrics | null = (() => {
    if (!tasks || !teams || !users || !attendance) return null;

    const now = new Date();
    const completedTasks = tasks.filter(t => t.status === 'completed');
    const pendingTasks = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress');
    const overdueTasks = tasks.filter(t => 
      t.dueDate && 
      new Date(t.dueDate) < now && 
      t.status !== 'completed'
    );

    // Team performance
    const teamPerformance = teams.map(team => {
      const teamTasks = tasks.filter(t => t.teamId === team.id);
      const teamCompletedTasks = teamTasks.filter(t => t.status === 'completed');
      
      return {
        teamName: team.name,
        totalTasks: teamTasks.length,
        completedTasks: teamCompletedTasks.length,
        completionRate: teamTasks.length > 0 ? Math.round((teamCompletedTasks.length / teamTasks.length) * 100) : 0
      };
    });

    // User performance
    const userPerformance = users.map(user => {
      const userTasks = tasks.filter(t => t.assignedTo === user.id);
      const userCompletedTasks = userTasks.filter(t => t.status === 'completed');
      const userPendingTasks = userTasks.filter(t => t.status === 'pending' || t.status === 'in_progress');
      
      const productivityScore = userTasks.length > 0 ? 
        Math.round((userCompletedTasks.length / userTasks.length) * 100) : 0;

      return {
        userName: user.name,
        completedTasks: userCompletedTasks.length,
        pendingTasks: userPendingTasks.length,
        productivityScore
      };
    });

    // Attendance metrics
    const presentRecords = attendance.filter(a => a.status === 'present');
    const absentRecords = attendance.filter(a => a.status === 'absent');
    const lateRecords = attendance.filter(a => a.status === 'late');
    const averageAttendance = attendance.length > 0 ? 
      Math.round((presentRecords.length / attendance.length) * 100) : 0;

    return {
      totalTasks: tasks.length,
      completedTasks: completedTasks.length,
      pendingTasks: pendingTasks.length,
      overdueTasks: overdueTasks.length,
      teamPerformance,
      userPerformance,
      attendanceMetrics: {
        averageAttendance,
        totalPresent: presentRecords.length,
        totalAbsent: absentRecords.length,
        totalLate: lateRecords.length
      }
    };
  })();

  const handleExportReport = () => {
    if (!reportMetrics) return;

    const reportData = {
      generatedAt: new Date().toISOString(),
      dateRange: `${startDate} to ${endDate}`,
      reportType,
      metrics: reportMetrics
    };

    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gads-report-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
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
                <h1 className="text-3xl font-bold text-slate-900">GADS Reporting</h1>
                <p className="text-slate-600 mt-1">Goals, Analytics, Data & Systems reporting dashboard</p>
              </div>
              <div className="flex items-center space-x-3">
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="overview">Overview</SelectItem>
                    <SelectItem value="performance">Performance</SelectItem>
                    <SelectItem value="attendance">Attendance</SelectItem>
                    <SelectItem value="productivity">Productivity</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleExportReport} className="bg-primary-600 text-white hover:bg-primary-700">
                  <Download className="w-4 h-4 mr-2" />
                  Export Report
                </Button>
              </div>
            </div>
          </div>

          {/* Date Range Filter */}
          {dateRange === "custom" && (
            <Card className="shadow-sm border-slate-200 mb-8">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    <span className="text-sm font-medium text-slate-700">Date Range:</span>
                  </div>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-40"
                  />
                  <span className="text-slate-500">to</span>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-40"
                  />
                  <Button variant="outline" size="sm">
                    <Filter className="w-4 h-4 mr-2" />
                    Apply Filter
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Key Metrics */}
          {isLoading ? (
            <MetricsLoading />
          ) : reportMetrics ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="shadow-sm border-slate-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                      <Target className="text-primary-600 w-6 h-6" />
                    </div>
                    <div className="flex items-center text-green-500 text-sm font-medium">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      {reportMetrics.completedTasks > 0 ? '+' : ''}
                      {Math.round((reportMetrics.completedTasks / Math.max(reportMetrics.totalTasks, 1)) * 100)}%
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">{reportMetrics.totalTasks}</h3>
                  <p className="text-slate-500 text-sm">Total Tasks</p>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-slate-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="text-green-600 w-6 h-6" />
                    </div>
                    <div className="flex items-center text-green-500 text-sm font-medium">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      {Math.round((reportMetrics.completedTasks / Math.max(reportMetrics.totalTasks, 1)) * 100)}%
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">{reportMetrics.completedTasks}</h3>
                  <p className="text-slate-500 text-sm">Completed Tasks</p>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-slate-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                      <Clock className="text-amber-600 w-6 h-6" />
                    </div>
                    <div className="flex items-center text-red-500 text-sm font-medium">
                      <TrendingDown className="w-4 h-4 mr-1" />
                      {reportMetrics.overdueTasks}
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">{reportMetrics.attendanceMetrics.averageAttendance}%</h3>
                  <p className="text-slate-500 text-sm">Avg. Attendance</p>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-slate-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Users className="text-purple-600 w-6 h-6" />
                    </div>
                    <div className="flex items-center text-green-500 text-sm font-medium">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      Active
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">{reportMetrics.userPerformance.length}</h3>
                  <p className="text-slate-500 text-sm">Active Users</p>
                </CardContent>
              </Card>
            </div>
          ) : null}

          {/* Charts and Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Performance Analysis */}
            <Card className="shadow-sm border-slate-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-slate-900">Performance Analysis</h2>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" className="bg-primary-100 text-primary-700 border-primary-200">
                      Teams
                    </Button>
                    <Button variant="ghost" size="sm" className="text-slate-500">
                      Users
                    </Button>
                  </div>
                </div>
                <div className="h-64 bg-slate-50 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="w-16 h-16 text-slate-400 mx-auto mb-2" />
                    <p className="text-slate-500">Performance Analytics Chart</p>
                    <p className="text-xs text-slate-400 mt-1">Visualization would be implemented with Chart.js or similar</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Goal Achievement */}
            <Card className="shadow-sm border-slate-200">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold text-slate-900 mb-6">Goal Achievement</h2>
                <div className="h-64 bg-slate-50 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <PieChart className="w-16 h-16 text-slate-400 mx-auto mb-2" />
                    <p className="text-slate-500">Goals & Targets Chart</p>
                    <p className="text-xs text-slate-400 mt-1">Goal progress visualization</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Reports */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Team Performance Table */}
            <Card className="shadow-sm border-slate-200">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-xl font-semibold text-slate-900">Team Performance</h2>
              </div>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-6">
                    <TableLoading />
                  </div>
                ) : reportMetrics ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Team</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tasks</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Completion</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {reportMetrics.teamPerformance.map((team, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4">
                              <p className="font-medium text-slate-900">{team.teamName}</p>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-900">
                              {team.completedTasks}/{team.totalTasks}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                <div className="w-full bg-slate-200 rounded-full h-2 mr-2">
                                  <div 
                                    className="bg-primary-600 h-2 rounded-full" 
                                    style={{ width: `${team.completionRate}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm text-slate-600">{team.completionRate}%</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            {/* User Productivity Table */}
            <Card className="shadow-sm border-slate-200">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-xl font-semibold text-slate-900">User Productivity</h2>
              </div>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-6">
                    <TableLoading />
                  </div>
                ) : reportMetrics ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">User</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Completed</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Score</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {reportMetrics.userPerformance
                          .sort((a, b) => b.productivityScore - a.productivityScore)
                          .slice(0, 10)
                          .map((user, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4">
                              <p className="font-medium text-slate-900">{user.userName}</p>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-900">
                              {user.completedTasks}
                            </td>
                            <td className="px-6 py-4">
                              <Badge 
                                className={
                                  user.productivityScore >= 80 ? 'bg-green-100 text-green-800' :
                                  user.productivityScore >= 60 ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }
                              >
                                {user.productivityScore}%
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
