import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SignIn } from "@/pages/SignIn";
import ReportingDashboard from "@/pages/ReportingDashboard";
import CreateTeam from "@/pages/CreateTeam";
import TaskManagement from "@/pages/TaskManagement";
import AttendanceLog from "@/pages/AttendanceLog";
import TeamManagement from "@/pages/TeamManagement";
import UserManagement from "@/pages/UserManagement";
import GadsReporting from "@/pages/GadsReporting";
import CanvasserApproval from "@/pages/CanvasserApproval";
import TurfMapping from "@/pages/TurfMapping";
import EngagementHeatmap from "@/pages/EngagementHeatmap";
import DailyCanvasserList from "@/pages/DailyCanvasserList";
import NotFound from "@/pages/not-found";
import { authManager } from "@/lib/auth";
import { useEffect, useState } from "react";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = authManager.isAuthenticated();
      setIsAuthenticated(authenticated);
      setIsChecking(false);
    };

    checkAuth();
    // Check periodically in case token expires
    const interval = setInterval(checkAuth, 60000);
    return () => clearInterval(interval);
  }, []);

  if (isChecking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <SignIn />;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={SignIn} />
      <Route path="/signin" component={SignIn} />
      <Route path="/dashboard" component={() => <ProtectedRoute component={ReportingDashboard} />} />
      <Route path="/reportingdashboard" component={() => <ProtectedRoute component={ReportingDashboard} />} />
      <Route path="/create-team" component={() => <ProtectedRoute component={CreateTeam} />} />
      <Route path="/createteam" component={() => <ProtectedRoute component={CreateTeam} />} />
      <Route path="/tasks" component={() => <ProtectedRoute component={TaskManagement} />} />
      <Route path="/TaskManagement" component={() => <ProtectedRoute component={TaskManagement} />} />
      <Route path="/attendance" component={() => <ProtectedRoute component={AttendanceLog} />} />
      <Route path="/AttendanceLog" component={() => <ProtectedRoute component={AttendanceLog} />} />
      <Route path="/teams" component={() => <ProtectedRoute component={TeamManagement} />} />
      <Route path="/TeamManagement" component={() => <ProtectedRoute component={TeamManagement} />} />
      <Route path="/users" component={() => <ProtectedRoute component={UserManagement} />} />
      <Route path="/UserManagement" component={() => <ProtectedRoute component={UserManagement} />} />
      <Route path="/canvasser-approval" component={() => <ProtectedRoute component={CanvasserApproval} />} />
      <Route path="/CanvasserApproval" component={() => <ProtectedRoute component={CanvasserApproval} />} />
      <Route path="/turf-mapping" component={() => <ProtectedRoute component={TurfMapping} />} />
      <Route path="/engagement-heatmap" component={() => <ProtectedRoute component={EngagementHeatmap} />} />
      <Route path="/daily-canvasser-list" component={() => <ProtectedRoute component={DailyCanvasserList} />} />
      <Route path="/reports" component={() => <ProtectedRoute component={GadsReporting} />} />
      <Route path="/GadsReporting" component={() => <ProtectedRoute component={GadsReporting} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
