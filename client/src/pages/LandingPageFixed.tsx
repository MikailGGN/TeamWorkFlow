import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, Users, Target, TrendingUp, LogOut, Clock, UserPlus, 
  BarChart2, Smartphone, CalendarDays, MapPin, Camera, CheckCircle2
} from "lucide-react";
import { useAuth } from "@/lib/EmployeeAuthProvider";

export function LandingPage() {
  const [, setLocation] = useLocation();
  const { user, signOut } = useAuth();

  const handleSignOut = () => {
    signOut();
    setLocation("/");
  };

  // If user is authenticated and is FAE, show FAE dashboard
  if (user && user.role === "FAE") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">FieldForce Pro</h1>
                  <p className="text-sm text-gray-600">FAE Dashboard</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {user ? user.email : "User"}
                </Badge>
                <Button
                  onClick={handleSignOut}
                  variant="outline"
                  size="sm"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome back, Field Area Executive
            </h2>
            <p className="text-gray-600">
              Here's your overview of field operations and team performance.
            </p>
          </div>

          {/* Action Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Team Management */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setLocation('/create-team')}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-lg">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <UserPlus className="w-4 h-4 text-blue-600" />
                  </div>
                  Team Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm mb-4">
                  Create new teams, manage canvasser assignments, and track team performance across different territories.
                </p>
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={() => setLocation('/create-team')}
                >
                  Manage Teams
                </Button>
              </CardContent>
            </Card>

            {/* Canvasser Approval */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setLocation('/canvasser-approval')}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-lg">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  </div>
                  Canvasser Approval
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm mb-4">
                  Review and approve new canvasser registrations, verify credentials, and onboard team members.
                </p>
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={() => setLocation('/canvasser-approval')}
                >
                  Review Applications
                </Button>
              </CardContent>
            </Card>

            {/* Performance Tracking */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setLocation('/daily-performance')}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-lg">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                    <BarChart2 className="w-4 h-4 text-purple-600" />
                  </div>
                  Performance Tracking
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm mb-4">
                  Monitor daily productivity, track KPIs, and analyze team performance metrics in real-time.
                </p>
                <Button 
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  onClick={() => setLocation('/daily-performance')}
                >
                  View Performance
                </Button>
              </CardContent>
            </Card>

            {/* Territory Management */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setLocation('/turf-mapping')}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-lg">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                    <MapPin className="w-4 h-4 text-orange-600" />
                  </div>
                  Territory Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm mb-4">
                  Define territories, assign areas to teams, and optimize coverage using interactive mapping tools.
                </p>
                <Button 
                  className="w-full bg-orange-600 hover:bg-orange-700"
                  onClick={() => setLocation('/turf-mapping')}
                >
                  Manage Territories
                </Button>
              </CardContent>
            </Card>

            {/* Activity Planning */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setLocation('/activity-planner')}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-lg">
                  <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                    <CalendarDays className="w-4 h-4 text-indigo-600" />
                  </div>
                  Activity Planning
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm mb-4">
                  Schedule activities, plan campaigns, and coordinate field operations with calendar-based tools.
                </p>
                <Button 
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                  onClick={() => setLocation('/activity-planner')}
                >
                  Plan Activities
                </Button>
              </CardContent>
            </Card>

            {/* Campaign Management */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setLocation('/campaign-setup')}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-lg">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                    <Camera className="w-4 h-4 text-red-600" />
                  </div>
                  Campaign Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm mb-4">
                  Create campaigns, capture location-based photos, and manage field marketing activities.
                </p>
                <Button 
                  className="w-full bg-red-600 hover:bg-red-700"
                  onClick={() => setLocation('/campaign-setup')}
                >
                  Manage Campaigns
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Quick Access Tools */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Access Tools</h3>
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button 
                    variant="outline" 
                    className="h-auto p-4 flex flex-col items-center space-y-2"
                    onClick={() => setLocation('/attendance')}
                  >
                    <Clock className="w-6 h-6 text-blue-600" />
                    <span className="text-sm">Attendance</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-auto p-4 flex flex-col items-center space-y-2"
                    onClick={() => setLocation('/reports')}
                  >
                    <BarChart3 className="w-6 h-6 text-green-600" />
                    <span className="text-sm">Reports</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-auto p-4 flex flex-col items-center space-y-2"
                    onClick={() => setLocation('/sim-inventory')}
                  >
                    <Smartphone className="w-6 h-6 text-purple-600" />
                    <span className="text-sm">Inventory</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-auto p-4 flex flex-col items-center space-y-2"
                    onClick={() => setLocation('/engagement-heatmap')}
                  >
                    <Target className="w-6 h-6 text-orange-600" />
                    <span className="text-sm">Analytics</span>
                  </Button>
                </div>
                <Button 
                  className="w-full mt-4" 
                  variant="outline"
                  onClick={() => setLocation('/dashboard')}
                >
                  View All Tools
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Active Teams</p>
                    <p className="text-2xl font-bold">0</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">Today's Check-ins</p>
                    <p className="text-2xl font-bold">0</p>
                  </div>
                  <Clock className="w-8 h-8 text-green-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">Performance Entries</p>
                    <p className="text-2xl font-bold">0</p>
                  </div>
                  <BarChart2 className="w-8 h-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm">Equipment Items</p>
                    <p className="text-2xl font-bold">0</p>
                  </div>
                  <Smartphone className="w-8 h-8 text-orange-200" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Default landing page for non-FAE users or unauthenticated users
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-slate-100">
      {/* Header with Sign Out for authenticated users */}
      {user && (
        <div className="fixed top-0 right-0 p-4 z-50">
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="bg-white/90 backdrop-blur-sm hover:bg-white"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      )}
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="w-20 h-20 bg-primary-600 rounded-xl flex items-center justify-center mx-auto mb-6">
            <BarChart3 className="text-white text-3xl w-10 h-10" />
          </div>
          <h1 className="text-5xl font-bold text-slate-900 mb-4">
            FieldForce Pro
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-8">
            Advanced Field Operations Management Platform - Empowering teams with intelligent analytics, 
            comprehensive task management, and seamless field coordination.
          </p>
          <div className="flex justify-center space-x-4">
            <Button 
              onClick={() => setLocation("/signin")}
              className="bg-primary-600 text-white hover:bg-primary-700 px-8 py-3 text-lg"
            >
              Get Started
            </Button>
            <Button 
              variant="outline"
              onClick={() => setLocation("/dashboard")}
              className="border-primary-600 text-primary-600 hover:bg-primary-50 px-8 py-3 text-lg"
            >
              View Demo
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card className="shadow-lg border-0">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="text-primary-600 w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Team Management</h3>
              <p className="text-slate-600">
                Create and manage teams, assign roles, and track member performance across projects.
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Target className="text-green-600 w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Task Tracking</h3>
              <p className="text-slate-600">
                Organize tasks, set priorities, and monitor progress with real-time updates and notifications.
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="text-purple-600 w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Analytics & Reports</h3>
              <p className="text-slate-600">
                Generate comprehensive reports and gain insights into team productivity and performance.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <Card className="shadow-lg border-0 bg-primary-600 text-white">
            <CardContent className="p-12">
              <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Field Operations?</h2>
              <p className="text-primary-100 text-lg mb-8 max-w-2xl mx-auto">
                Join thousands of teams already using FieldForce Pro to streamline their operations, 
                improve productivity, and achieve better results.
              </p>
              <div className="flex justify-center space-x-4">
                <Button 
                  onClick={() => setLocation("/signin")}
                  className="bg-white text-primary-600 hover:bg-primary-50 px-8 py-3 text-lg font-semibold"
                >
                  Start Free Trial
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setLocation("/demo")}
                  className="border-white text-white hover:bg-white/10 px-8 py-3 text-lg"
                >
                  Try Demo
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}