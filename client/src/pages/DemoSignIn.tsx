import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { BarChart3, Shield, Users, Target, TrendingUp, Eye, EyeOff, AlertTriangle } from "lucide-react";
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
        <div className="flip-card-back bg-gradient-to-br from-orange-600 to-red-600 rounded-xl flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="text-center text-white p-4 relative z-10">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-3 backdrop-blur-sm">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <p className="text-sm font-bold">Demo Mode</p>
            <p className="text-xs text-orange-100 mt-1">Testing Environment</p>
          </div>
          <div className="absolute -top-4 -right-4 w-16 h-16 bg-white/5 rounded-full blur-xl"></div>
          <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-orange-400/20 rounded-full blur-lg"></div>
        </div>
      </div>
    </div>
  );
};

export function DemoSignIn() {
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
      setLocation('/dashboard');
    }
  }, [isAuthenticated, setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Demo authentication - only works on demo page
      const response = await fetch("/api/auth/demo-signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Authentication failed');
      }

      const data = await response.json();
      
      // Store session data with proper format
      localStorage.setItem("token", data.token);
      localStorage.setItem("userEmail", data.user.email);
      setSession(data.user.name || data.user.email, data.user.id.toString(), data.user.role);
      
      // Save remember me preferences
      if (rememberMe) {
        localStorage.setItem("rememberMe", "true");
        localStorage.setItem("lastEmail", email);
      }

      toast({
        title: "Demo Access Granted",
        description: "Welcome to the FieldForce Pro demo environment.",
      });

      // Redirect based on user role
      const redirectPath = data.user.role === 'FAE' ? '/create-team' : 
                          data.user.role === 'ADMIN' ? '/admin-cpanel' : '/dashboard';
      setLocation(redirectPath);

    } catch (error: any) {
      toast({
        title: "Demo Sign in failed",
        description: error.message || "Please check your credentials and try again.",
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

  const handleQuickLogin = (demoEmail: string, demoPassword: string = "demo123") => {
    setEmail(demoEmail);
    setPassword(demoPassword);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-900 via-red-900 to-pink-900 flex">
      {/* Left Side - Demo Brand Section */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-600/20 to-red-600/20"></div>
        <div className="relative z-10 flex flex-col justify-center p-12 text-white">
          <div className="mb-8">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6">
              <AlertTriangle className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">FieldForce Pro Demo</h1>
            <p className="text-xl text-orange-100 mb-8">
              Explore the demo environment with simplified authentication and test data.
            </p>
            
            {/* Demo Warning Banner */}
            <div className="bg-orange-500/20 border border-orange-400/30 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-orange-300" />
                <span className="font-semibold text-orange-100">Demo Environment</span>
              </div>
              <p className="text-sm text-orange-200">
                This is a demonstration environment with mock data. For production access, please use the main signin page.
              </p>
            </div>
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
                <p className="text-sm text-orange-200">Demo team operations</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold">Performance Tracking</p>
                <p className="text-sm text-orange-200">Sample KPIs and OKRs</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold">Demo Access</p>
                <p className="text-sm text-orange-200">Simplified authentication</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold">Test Analytics</p>
                <p className="text-sm text-orange-200">Demo data insights</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute top-20 right-20 w-32 h-32 bg-white/5 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 left-20 w-24 h-24 bg-orange-400/10 rounded-full blur-lg"></div>
      </div>

      {/* Right Side - Demo Sign In Form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-md">
          <Card className="backdrop-blur-sm bg-white/95 border-0 shadow-2xl">
            <CardHeader className="text-center space-y-2 pb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-600 to-red-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">FieldForce Pro Demo</h2>
              <p className="text-gray-600">Access the demonstration environment</p>
            </CardHeader>
            
            <CardContent className="pt-0">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Demo Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter demo email address"
                    className="h-12 px-4 border-gray-300 focus:border-orange-500 focus:ring-orange-500 transition-all duration-200"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Demo Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter demo password"
                      className="h-12 px-4 pr-12 border-gray-300 focus:border-orange-500 focus:ring-orange-500 transition-all duration-200"
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
                    onClick={() => setLocation('/signin')}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                  >
                    Production Login
                  </button>
                </div>
                
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full h-12 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:scale-100"
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Accessing Demo...</span>
                    </div>
                  ) : (
                    "Access Demo Environment"
                  )}
                </Button>
              </form>

              {/* Demo Credentials */}
              <div className="mt-8 p-4 bg-orange-50 rounded-xl border border-orange-200">
                <div className="flex items-center space-x-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                  <h3 className="text-sm font-semibold text-orange-700">Demo Credentials</h3>
                </div>
                <div className="space-y-3 text-xs">
                  <div className="flex flex-col space-y-1">
                    <button
                      type="button"
                      onClick={() => handleQuickLogin('fae@company.com')}
                      className="flex items-center justify-between p-2 bg-white rounded border hover:bg-orange-50 transition-colors"
                    >
                      <span className="text-gray-600 font-medium">Field Area Executive:</span>
                      <code className="bg-orange-100 px-2 py-1 rounded text-orange-700">fae@company.com</code>
                    </button>
                    <p className="text-gray-500 text-xs ml-2">→ Team Creation Dashboard</p>
                  </div>
                  
                  <div className="flex flex-col space-y-1">
                    <button
                      type="button"
                      onClick={() => handleQuickLogin('admin@company.com')}
                      className="flex items-center justify-between p-2 bg-white rounded border hover:bg-orange-50 transition-colors"
                    >
                      <span className="text-gray-600 font-medium">System Administrator:</span>
                      <code className="bg-orange-100 px-2 py-1 rounded text-orange-700">admin@company.com</code>
                    </button>
                    <p className="text-gray-500 text-xs ml-2">→ Main Operations Dashboard</p>
                  </div>
                  
                  <div className="flex flex-col space-y-1">
                    <button
                      type="button"
                      onClick={() => handleQuickLogin('admin@example.com', 'admin123')}
                      className="flex items-center justify-between p-2 bg-white rounded border hover:bg-orange-50 transition-colors"
                    >
                      <span className="text-gray-600 font-medium">Standard Access:</span>
                      <code className="bg-orange-100 px-2 py-1 rounded text-orange-700">admin@example.com</code>
                    </button>
                    <p className="text-gray-500 text-xs ml-2">Password: admin123</p>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-orange-200">
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