import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from './supabase';
import { UserWithRoles } from '@shared/schema';

interface AuthContextType {
  user: UserWithRoles | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ data: any; error: any }>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string, metadata?: any) => Promise<{ data: any; error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserWithRoles | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      if (!supabase) {
        setLoading(false);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await loadUserWithRoles(session.user.id);
        }
      } catch (error) {
        console.error('Error getting session:', error);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // Listen for auth changes
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (event === 'SIGNED_IN' && session?.user) {
            await loadUserWithRoles(session.user.id);
          } else if (event === 'SIGNED_OUT') {
            setUser(null);
          }
          setLoading(false);
        }
      );

      return () => subscription.unsubscribe();
    }
  }, []);

  const loadUserWithRoles = async (userId: string) => {
    if (!supabase) return;

    try {
      // Get user roles from the user_roles table
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select(`
          roles (
            name,
            permissions
          )
        `)
        .eq('user_id', userId);

      if (rolesError) {
        console.error('Error fetching roles:', rolesError);
      }

      // Get employee data if user has FAE/ADMIN role
      const roles = rolesData?.map((item: any) => item.roles.name) || [];
      let employee = null;

      if (roles.includes('FAE') || roles.includes('ADMIN')) {
        const { data: employeeData } = await supabase
          .from('employees')
          .select('*')
          .eq('supabase_user_id', userId)
          .single();
        
        employee = employeeData;
      }

      // Get user email from auth
      const { data: { user: authUser } } = await supabase.auth.getUser();

      setUser({
        id: userId,
        email: authUser?.email || null,
        roles,
        employee
      });
    } catch (error) {
      console.error('Error loading user with roles:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase client not available' } };
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (data.user && !error) {
      await loadUserWithRoles(data.user.id);
    }
    
    setLoading(false);
    return { data, error };
  };

  const signUp = async (email: string, password: string, metadata?: any) => {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase client not available' } };
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    });
    
    setLoading(false);
    return { data, error };
  };

  const signOut = async () => {
    if (!supabase) return;
    
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setLoading(false);
  };

  const value = {
    user,
    loading,
    signIn,
    signOut,
    signUp
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}