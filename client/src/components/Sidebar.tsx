import { Link, useLocation } from "wouter";
import { 
  BarChart3, 
  CheckSquare, 
  Users, 
  Clock, 
  UserCog, 
  TrendingUp,
  LogOut,
  User,
  UserCheck,
  MapPin,
  Activity,
  Target,
  Settings,
  Megaphone
} from "lucide-react";
import { authManager } from "@/lib/auth";

const navigationItems = [
  { path: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { path: "/create-team", label: "Create Team", icon: Users },
  { path: "/campaign-setup", label: "Campaign Setup", icon: Megaphone },
  { path: "/canvasser-approval", label: "Canvasser Approval", icon: UserCheck },
  { path: "/turf-mapping", label: "Turf Mapping", icon: MapPin },
  { path: "/engagement-heatmap", label: "Engagement Heatmap", icon: Activity },
  { path: "/daily-canvasser-list", label: "Daily Productivity", icon: Target },
  { path: "/daily-performance", label: "Daily Performance", icon: TrendingUp },
  { path: "/fae-reporting", label: "FAE Reporting", icon: BarChart3 },
  { path: "/okr-dashboard", label: "OKR Performance", icon: TrendingUp },
  { path: "/tasks", label: "Task Management", icon: CheckSquare },
  { path: "/teams", label: "Team Management", icon: Users },
  { path: "/attendance", label: "Attendance Log", icon: Clock },
  { path: "/time-tracking", label: "Time Tracking", icon: Clock },
  { path: "/users", label: "User Management", icon: UserCog },
  { path: "/reports", label: "GADS Reporting", icon: BarChart3 },
  { path: "/admin-cpanel", label: "Admin CPanel", icon: Settings },
];

export function Sidebar() {
  const [location] = useLocation();
  const user = authManager.getUser();

  const handleSignOut = () => {
    authManager.signOut();
    window.location.href = "/";
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <BarChart3 className="text-white w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900">FieldForce Pro</h2>
            <p className="text-xs text-slate-500">Enterprise Suite</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            
            return (
              <Link key={item.path} href={item.path}>
                <div className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                  isActive 
                    ? "bg-primary-50 text-primary-700 font-medium" 
                    : "text-slate-600 hover:bg-slate-100"
                }`}>
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>
      
      <div className="p-4 border-t border-slate-200">
        <div className="flex items-center space-x-3 px-3 py-2">
          <div className="w-8 h-8 bg-slate-300 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-slate-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900">{user?.name || "User"}</p>
            <p className="text-xs text-slate-500 capitalize">{user?.role || "Member"}</p>
          </div>
          <button 
            onClick={handleSignOut}
            className="text-slate-400 hover:text-slate-600"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
