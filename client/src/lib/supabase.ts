import { createClient } from "@supabase/supabase-js";

// Client-side Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

// Create Supabase client for client-side use
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Fallback database operations using API routes when Supabase client is not available
export const dbApi = {
  async get(endpoint: string) {
    const response = await fetch(`/api${endpoint}`);
    if (!response.ok) throw new Error(`API request failed: ${response.statusText}`);
    return response.json();
  },

  async post(endpoint: string, data: any) {
    const response = await fetch(`/api${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error(`API request failed: ${response.statusText}`);
    return response.json();
  },

  async put(endpoint: string, data: any) {
    const response = await fetch(`/api${endpoint}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error(`API request failed: ${response.statusText}`);
    return response.json();
  },

  async delete(endpoint: string) {
    const response = await fetch(`/api${endpoint}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error(`API request failed: ${response.statusText}`);
    return response.json();
  }
};