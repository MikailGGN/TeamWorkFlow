import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { EmployeeAuthProvider } from "@/lib/EmployeeAuthProvider";
import { SignIn } from "@/pages/SignIn";
import { DemoSignIn } from "@/pages/DemoSignIn";
import { ForgotPassword } from "@/pages/ForgotPassword";
import { ResetPassword } from "@/pages/ResetPassword";
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
import OKRDashboard from "@/pages/OKRDashboard";
import AdminCPanel from "@/pages/AdminCPanel";
import CameraDemo from "@/pages/CameraDemo";
import TimeTracking from "@/pages/TimeTracking";
import DailyPerformance from "@/pages/DailyPerformance";
import FAEReporting from "@/pages/FAEReporting";
import { SimInventory } from "@/pages/SimInventory";
import { ActivityPlanner } from "@/pages/ActivityPlanner";
import CampaignSetup from "@/pages/CampaignSetup";
import { LandingPage } from "@/pages/LandingPage";
import NotFound from "@/pages/not-found";
import { useAuth } from "@/lib/EmployeeAuthProvider";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    window.location.href = '/signin';
    return null;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/signin" component={SignIn} />
      <Route path="/demo" component={DemoSignIn} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
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
      <Route path="/okr-dashboard" component={() => <ProtectedRoute component={OKRDashboard} />} />
      <Route path="/admin-cpanel" component={() => <ProtectedRoute component={AdminCPanel} />} />
      <Route path="/time-tracking" component={() => <ProtectedRoute component={TimeTracking} />} />
      <Route path="/daily-performance" component={() => <ProtectedRoute component={DailyPerformance} />} />
      <Route path="/fae-reporting" component={() => <ProtectedRoute component={FAEReporting} />} />
      <Route path="/sim-inventory" component={() => <ProtectedRoute component={SimInventory} />} />
      <Route path="/activity-planner" component={() => <ProtectedRoute component={ActivityPlanner} />} />
      <Route path="/campaign-setup" component={() => <ProtectedRoute component={CampaignSetup} />} />
      <Route path="/reports" component={() => <ProtectedRoute component={GadsReporting} />} />
      <Route path="/GadsReporting" component={() => <ProtectedRoute component={GadsReporting} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <EmployeeAuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </EmployeeAuthProvider>
    </QueryClientProvider>
  );
}

export default App;
