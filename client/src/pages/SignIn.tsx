import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { BarChart3, Shield, Users, Target, TrendingUp, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/lib/EmployeeAuthProvider";
import { useToast } from "@/hooks/use-toast";
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
  const { signIn, user, getRedirectRoute } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      getRedirectRoute().then(route => {
        setLocation(route);
      });
    }
  }, [user, setLocation, getRedirectRoute]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await signIn(email, password, false);
      
      if (!result.success) {
        toast({
          title: "Sign in failed",
          description: result.error || "Please check your credentials and try again.",
          variant: "destructive",
        });
      } else {
        // Save remember me preferences
        if (rememberMe) {
          localStorage.setItem("rememberMe", "true");
          localStorage.setItem("lastEmail", email);
        }

        toast({
          title: "Welcome back!",
          description: "You have successfully signed in.",
        });

        // Get and navigate to role-based route
        const redirectRoute = await getRedirectRoute();
        setLocation(redirectRoute);
      }
    } catch (error) {
      toast({
        title: "Authentication error",
        description: "An unexpected error occurred. Please try again.",
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex">
      {/* Left Side - Image Carousel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-blue-600 to-purple-700">
        <div className="absolute inset-0 bg-black/20"></div>
        
        {/* Animated Background Elements */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-32 right-16 w-24 h-24 bg-purple-400/20 rounded-full blur-lg animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/3 w-16 h-16 bg-blue-300/30 rounded-full blur-md animate-bounce delay-500"></div>
        
        <div className="relative z-10 flex flex-col justify-between p-12 text-white h-full">
          {/* Header */}
          <div>
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">FieldForce Pro</h1>
                <p className="text-blue-100 text-sm">Enterprise Suite</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <h2 className="text-4xl font-bold leading-tight">
                Streamline Your<br />
                <span className="text-blue-200">Field Operations</span>
              </h2>
              <p className="text-blue-100 text-lg leading-relaxed max-w-md">
                Comprehensive team management, real-time tracking, and powerful analytics 
                for modern field operations.
              </p>
            </div>
          </div>

          {/* Image Grid */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <FlipCard image={marbleDeeImage} delay={0} />
            <FlipCard image={hawkerImage} delay={1000} />
          </div>

          {/* Features */}
          <div className="grid grid-cols-2 gap-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <Users className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-semibold text-sm">Team Management</p>
                <p className="text-blue-100 text-xs">Real-time coordination</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <Target className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-semibold text-sm">Smart Analytics</p>
                <p className="text-blue-100 text-xs">Performance insights</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-semibold text-sm">Growth Tracking</p>
                <p className="text-blue-100 text-xs">KPI monitoring</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-semibold text-sm">Secure Access</p>
                <p className="text-blue-100 text-xs">Role-based control</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Sign In Form */}
      <div className="flex-1 flex items-center justify-center p-8">
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

              {/* Demo Access Link */}
              <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex items-center space-x-2 mb-3">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-semibold text-blue-700">Looking for Demo Access?</h3>
                </div>
                <p className="text-sm text-blue-600 mb-3">
                  Explore the demonstration environment with test credentials and sample data.
                </p>
                <button 
                  type="button" 
                  onClick={() => setLocation('/demo')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
                >
                  Access Demo Environment
                </button>
              </div>

              {/* Employee Login Instructions */}
              <div className="mt-6 p-4 bg-green-50 rounded-xl border border-green-200">
                <div className="flex items-center space-x-2 mb-3">
                  <Users className="w-4 h-4 text-green-600" />
                  <h3 className="text-sm font-semibold text-green-700">Employee Access</h3>
                </div>
                <p className="text-sm text-green-600">
                  Use your company email and Supabase authentication password to access role-specific dashboards.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}