import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface SessionContextType {
  username: string;
  userId: string;
  userRole: string;
  isAuthenticated: boolean;
  setSession: (username: string, userId: string, userRole?: string) => void;
  clearSession: () => void;
  updateUserRole: (role: string) => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const [username, setUsername] = useState("");
  const [userId, setUserId] = useState("");
  const [userRole, setUserRole] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize session from localStorage on mount
  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    const storedUserId = localStorage.getItem("userId");
    const storedUserRole = localStorage.getItem("userRole");
    const token = localStorage.getItem("token");

    if (storedUsername && storedUserId && token) {
      setUsername(storedUsername);
      setUserId(storedUserId);
      setUserRole(storedUserRole || "");
      setIsAuthenticated(true);
    }
  }, []);

  const setSession = (username: string, userId: string, userRole: string = "") => {
    setUsername(username);
    setUserId(userId);
    setUserRole(userRole);
    setIsAuthenticated(true);

    // Persist to localStorage
    localStorage.setItem("username", username);
    localStorage.setItem("userId", userId);
    localStorage.setItem("userRole", userRole);
  };

  const clearSession = () => {
    setUsername("");
    setUserId("");
    setUserRole("");
    setIsAuthenticated(false);

    // Clear from localStorage
    localStorage.removeItem("username");
    localStorage.removeItem("userId");
    localStorage.removeItem("userRole");
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
  };

  const updateUserRole = (role: string) => {
    setUserRole(role);
    localStorage.setItem("userRole", role);
  };

  return (
    <SessionContext.Provider 
      value={{ 
        username, 
        userId, 
        userRole, 
        isAuthenticated, 
        setSession, 
        clearSession, 
        updateUserRole 
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
};