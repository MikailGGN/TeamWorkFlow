import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, Users, Target, TrendingUp, LogOut } from "lucide-react";
import { authManager } from "@/lib/auth";

export function LandingPage() {
  const [, setLocation] = useLocation();
  const user = authManager.getUser();

  const handleSignOut = () => {
    authManager.signOut();
    window.location.href = "/";
  };

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
            Team Management Dashboard
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-8">
            Streamline your team operations with comprehensive task management, 
            attendance tracking, and performance analytics.
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
              <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Team Management?</h2>
              <p className="text-xl mb-6 opacity-90">
                Join thousands of teams already using our platform to achieve better results.
              </p>
              <Button 
                onClick={() => setLocation("/signin")}
                className="bg-white text-primary-600 hover:bg-slate-100 px-8 py-3 text-lg font-semibold"
              >
                Start Your Journey
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}