import { User } from "@shared/schema";

interface AuthState {
  token: string | null;
  user: User | null;
}

class AuthManager {
  private state: AuthState = {
    token: localStorage.getItem('token'),
    user: null
  };

  constructor() {
    if (this.state.token) {
      this.loadUser();
    }
  }

  private async loadUser() {
    try {
      const response = await fetch('/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${this.state.token}`
        }
      });
      
      if (response.ok) {
        this.state.user = await response.json();
      } else {
        this.signOut();
      }
    } catch (error) {
      this.signOut();
    }
  }

  async signIn(email: string, password: string): Promise<{ success: boolean; error?: string; redirectTo?: string }> {
    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      if (response.ok) {
        const data = await response.json();
        this.state.token = data.token;
        this.state.user = data.user;
        localStorage.setItem('token', data.token);
        return { success: true, redirectTo: data.redirectTo };
      } else {
        const error = await response.json();
        return { success: false, error: error.message };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  signOut() {
    this.state.token = null;
    this.state.user = null;
    localStorage.removeItem('token');
  }

  getToken(): string | null {
    return this.state.token;
  }

  getUser(): User | null {
    return this.state.user;
  }

  isAuthenticated(): boolean {
    return !!this.state.token && !!this.state.user;
  }
}

export const authManager = new AuthManager();
