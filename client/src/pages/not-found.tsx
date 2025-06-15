import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, LogOut, Home } from "lucide-react";
import { authManager } from "@/lib/auth";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();
  const user = authManager.getUser();

  const handleSignOut = () => {
    authManager.signOut();
    window.location.href = "/";
  };

  const handleGoHome = () => {
    if (user) {
      // Redirect based on user role
      const redirectPath = user.role === 'FAE' ? '/create-team' : '/dashboard';
      setLocation(redirectPath);
    } else {
      setLocation('/');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      {/* Header with Sign Out for authenticated users */}
      {user && (
        <div className="fixed top-0 right-0 p-4 z-50">
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="bg-white hover:bg-gray-50"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      )}
      
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900">404 Page Not Found</h1>
          </div>

          <p className="mt-4 text-sm text-gray-600 mb-6">
            The page you're looking for doesn't exist or has been moved.
          </p>

          <div className="flex flex-col gap-2">
            <Button onClick={handleGoHome} className="w-full">
              <Home className="w-4 h-4 mr-2" />
              {user ? 'Go to Dashboard' : 'Go Home'}
            </Button>
            {user && (
              <Button onClick={handleSignOut} variant="outline" className="w-full">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
