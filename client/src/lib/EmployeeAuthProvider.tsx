import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  department?: string;
  type: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string, isDemoMode?: boolean) => Promise<{ success: boolean; error?: string }>;
  signOut: () => void;
  getRedirectRoute: () => Promise<string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function EmployeeAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing token on load
    const token = localStorage.getItem('auth_token');
    if (token) {
      loadUserProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const loadUserProfile = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        localStorage.removeItem('auth_token');
        setUser(null);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      localStorage.removeItem('auth_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string, isDemoMode = false) => {
    setLoading(true);
    
    try {
      const endpoint = isDemoMode ? '/api/auth/demo-signin' : '/api/auth/signin';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok && data.token) {
        localStorage.setItem('auth_token', data.token);
        setUser(data.user);
        setLoading(false);
        return { success: true };
      } else {
        setLoading(false);
        return { success: false, error: data.message || 'Authentication failed' };
      }
    } catch (error) {
      setLoading(false);
      return { success: false, error: 'Network error occurred' };
    }
  };

  const signOut = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
  };

  const getRedirectRoute = async (): Promise<string> => {
    const token = localStorage.getItem('auth_token');
    if (!token) return '/signin';

    try {
      const response = await fetch('/api/user/route', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.route;
      }
    } catch (error) {
      console.error('Error getting redirect route:', error);
    }

    return '/dashboard';
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signIn,
      signOut,
      getRedirectRoute
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an EmployeeAuthProvider');
  }
  return context;
}