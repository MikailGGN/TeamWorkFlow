import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { BarChart3 } from "lucide-react";
import { authManager } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

export function SignIn() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await authManager.signIn(email, password);
    
    if (result.success) {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="text-white text-2xl w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Team Management System</h1>
            <p className="text-slate-600 mt-2">Sign in to access field operations</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label className="block text-sm font-medium text-slate-700 mb-2">
                Email Address
              </Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                required
              />
            </div>
            
            <div>
              <Label className="block text-sm font-medium text-slate-700 mb-2">
                Password
              </Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                required
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox id="remember" />
                <Label htmlFor="remember" className="text-sm text-slate-600">
                  Remember me
                </Label>
              </div>
              <a href="#" className="text-sm text-primary-600 hover:text-primary-700">
                Forgot password?
              </a>
            </div>
            
            <Button 
              type="submit" 
              disabled={loading}
              className="w-full bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium"
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          {/* Test Credentials */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg border">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Test Credentials:</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">FAE (redirects to CreateTeam):</span>
                <code className="bg-white px-2 py-1 rounded">fae@company.com</code>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Admin (redirects to Dashboard):</span>
                <code className="bg-white px-2 py-1 rounded">admin@company.com</code>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Regular User:</span>
                <code className="bg-white px-2 py-1 rounded">admin@example.com / admin123</code>
              </div>
              <div className="text-center text-gray-500 mt-2">
                <em>Employee accounts: any password works (simplified auth)</em>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
