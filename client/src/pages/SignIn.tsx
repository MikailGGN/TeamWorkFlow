import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { BarChart3, Shield, Users, Target, TrendingUp, Eye, EyeOff } from "lucide-react";
import { authManager } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useSession } from "@/lib/SessionContext";
import marbleDeeImage from "@assets/Marbledee-IWD2025_1749987380484.png";
import hawkerImage from "@assets/hawker_1749987409718.jpg";

// Flip Card Component
const FlipCard = ({ image, delay }: { image: string; delay: number }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsFlipped(prev => !prev);
    }, 3000 + delay);

    return () => clearInterval(interval);
  }, [delay]);

  return (
    <div className="flip-card-container relative">
      <div className={`flip-card-inner ${isFlipped ? 'flipped' : ''}`}>
        <div className="flip-card-front">
          <img
            src={image}
            alt="Field Operations"
            className="w-full h-full object-cover rounded-xl"
          />
        </div>
        <div className="flip-card-back bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="text-center text-white p-4 relative z-10">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-3 backdrop-blur-sm">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <p className="text-sm font-bold">FieldForce Pro</p>
            <p className="text-xs text-blue-100 mt-1">Enterprise Suite</p>
          </div>
          <div className="absolute -top-4 -right-4 w-16 h-16 bg-white/5 rounded-full blur-xl"></div>
          <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-purple-400/20 rounded-full blur-lg"></div>
        </div>
      </div>
    </div>
  );
};

export function SignIn() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { toast } = useToast();
  const { setSession, isAuthenticated } = useSession();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await authManager.signIn(email, password);
    
    if (result.success) {
      // Get user data from auth manager after successful login
      const authenticatedUser = authManager.getUser();
      
      // Set session data using centralized session management
      setSession(
        authenticatedUser?.name || authenticatedUser?.email || email,
        authenticatedUser?.id?.toString() || "unknown",
        authenticatedUser?.role || "user"
      );

      // Save additional data to localStorage if remember me is checked
      if (rememberMe) {
        localStorage.setItem("rememberMe", "true");
        localStorage.setItem("lastEmail", email);
      }

      // Redirect based on user role and redirectTo response
      const redirectPath = result.redirectTo || "/dashboard";
      setLocation(redirectPath);
      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      });
    } else {
      toast({
        title: "Sign in failed",
        description: result.error || "Please check your credentials and try again.",
        variant: "destructive",
      });
    }
    
    setLoading(false);
  };

  // Load remembered email on component mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem("lastEmail");
    const rememberMeStatus = localStorage.getItem("rememberMe");
    
    if (rememberMeStatus === "true" && rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-blue-900 to-purple-900 flex">
      {/* Left Side - Brand Section */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20"></div>
        <div className="relative z-10 flex flex-col justify-center p-12 text-white">
          <div className="mb-8">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">FieldForce Pro</h1>
            <p className="text-xl text-blue-100 mb-8">
              Advanced Field Operations Management Platform - Empowering teams with intelligent analytics and seamless coordination.
            </p>
          </div>
          
          {/* Image Collage */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="h-32">
              <FlipCard image={marbleDeeImage} delay={0} />
            </div>
            <div className="h-32">
              <FlipCard image={hawkerImage} delay={500} />
            </div>
            <div className="h-32">
              <FlipCard image={marbleDeeImage} delay={1000} />
            </div>
            <div className="h-32">
              <FlipCard image={hawkerImage} delay={1500} />
            </div>
          </div>

          {/* Feature Icons */}
          <div className="grid grid-cols-2 gap-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold">Team Management</p>
                <p className="text-sm text-blue-200">Coordinate field operations</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold">Performance Tracking</p>
                <p className="text-sm text-blue-200">Monitor KPIs and OKRs</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold">Secure Access</p>
                <p className="text-sm text-blue-200">Enterprise-grade security</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold">Real-time Analytics</p>
                <p className="text-sm text-blue-200">Live performance insights</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute top-20 right-20 w-32 h-32 bg-white/5 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 left-20 w-24 h-24 bg-purple-400/10 rounded-full blur-lg"></div>
      </div>

      {/* Right Side - Sign In Form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-md">
          <Card className="backdrop-blur-sm bg-white/95 border-0 shadow-2xl">
            <CardHeader className="text-center space-y-2 pb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Welcome to FieldForce Pro</h2>
              <p className="text-gray-600">Sign in to your advanced field operations platform</p>
            </CardHeader>
            
            <CardContent className="pt-0">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="h-12 px-4 border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="h-12 px-4 pr-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="remember" 
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked === true)}
                      className="border-gray-300"
                    />
                    <Label htmlFor="remember" className="text-sm text-gray-600 cursor-pointer">
                      Remember me
                    </Label>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setLocation('/forgot-password')}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
                
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:scale-100"
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>

              {/* Test Credentials */}
              <div className="mt-8 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center space-x-2 mb-3">
                  <Shield className="w-4 h-4 text-gray-600" />
                  <h3 className="text-sm font-semibold text-gray-700">Demo Credentials</h3>
                </div>
                <div className="space-y-3 text-xs">
                  <div className="flex flex-col space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 font-medium">Field Area Executive:</span>
                      <code className="bg-white px-2 py-1 rounded border text-blue-600">fae@company.com</code>
                    </div>
                    <p className="text-gray-500 text-xs">→ Team Creation Dashboard</p>
                  </div>
                  
                  <div className="flex flex-col space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 font-medium">System Administrator:</span>
                      <code className="bg-white px-2 py-1 rounded border text-blue-600">admin@company.com</code>
                    </div>
                    <p className="text-gray-500 text-xs">→ Main Operations Dashboard</p>
                  </div>
                  
                  <div className="flex flex-col space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 font-medium">Standard Access:</span>
                      <code className="bg-white px-2 py-1 rounded border text-blue-600">admin@example.com</code>
                    </div>
                    <p className="text-gray-500 text-xs">Password: admin123</p>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-center text-gray-500 italic">
                      Employee accounts: simplified authentication (any password)
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
