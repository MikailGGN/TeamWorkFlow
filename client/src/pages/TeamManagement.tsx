import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TableLoading } from "@/components/ui/loading";
import { Plus, Edit, Eye, Users, Code, Megaphone, User } from "lucide-react";
import { Link } from "wouter";
import { Team, TeamMember, User as UserType } from "@shared/schema";

interface TeamWithStats extends Team {
  memberCount: number;
  taskCount: number;
  progress: number;
}

interface TeamMemberWithUser extends TeamMember {
  user: UserType;
}

export default function TeamManagement() {
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

  const getStatusBadge = (memberCount: number) => {
    if (memberCount === 0) {
      return <Badge className="bg-gray-100 text-gray-800">Empty</Badge>;
    } else if (memberCount < 5) {
      return <Badge className="bg-yellow-100 text-yellow-800">Small</Badge>;
    } else {
      return <Badge className="bg-green-100 text-green-800">Active</Badge>;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Team Management</h1>
                <p className="text-slate-600 mt-1">Manage your teams and team members</p>
              </div>
              <Link href="/create-team">
                <Button className="bg-primary-600 text-white hover:bg-primary-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Team
                </Button>
              </Link>
            </div>
          </div>

          {/* Teams Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="shadow-sm border-slate-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Total Teams</p>
                    <p className="text-2xl font-bold text-slate-900">{teams?.length || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Users className="text-primary-600 w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-slate-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Total Members</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {teams?.reduce((total, team) => total + team.memberCount, 0) || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <User className="text-green-600 w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-slate-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Active Teams</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {teams?.filter(team => team.memberCount > 0).length || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                    <Users className="text-amber-600 w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Teams Table */}
          <Card className="shadow-sm border-slate-200">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900">All Teams</h2>
            </div>
            <CardContent className="p-0">
              {teamsLoading ? (
                <div className="p-6">
                  <TableLoading />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Team</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Category</th>
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
                                  <p className="text-sm text-slate-500">{team.description || "No description"}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <Badge variant="outline" className="capitalize">
                                {team.category}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-900">
                              <div className="flex items-center space-x-1">
                                <Users className="w-4 h-4 text-slate-400" />
                                <span>{team.memberCount}</span>
                              </div>
                            </td>
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
                              {getStatusBadge(team.memberCount)}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="text-primary-600 hover:text-primary-800"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="text-slate-400 hover:text-slate-600"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                            No teams found. Create your first team to get started.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
