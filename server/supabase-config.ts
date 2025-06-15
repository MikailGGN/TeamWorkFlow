import { createClient } from "@supabase/supabase-js";

// Configuration utility for Supabase connection
export interface SupabaseConfig {
  useSupabaseClient: boolean;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  databaseUrl?: string;
}

export function getSupabaseConfig(): SupabaseConfig {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  const databaseUrl = process.env.DATABASE_URL;

  // Prefer Supabase client if both URL and key are available
  const useSupabaseClient = !!(supabaseUrl && supabaseAnonKey);

  if (!useSupabaseClient && !databaseUrl) {
    throw new Error(
      "Either SUPABASE_URL + SUPABASE_ANON_KEY or DATABASE_URL must be configured"
    );
  }

  return {
    useSupabaseClient,
    supabaseUrl,
    supabaseAnonKey,
    databaseUrl
  };
}

export function createSupabaseClient() {
  const config = getSupabaseConfig();
  
  if (!config.useSupabaseClient) {
    throw new Error("Supabase client configuration not available");
  }

  return createClient(config.supabaseUrl!, config.supabaseAnonKey!);
}

export function logConnectionMethod() {
  const config = getSupabaseConfig();
  
  if (config.useSupabaseClient) {
    console.log("[FieldForce Pro] Using Supabase client connection");
  } else {
    console.log("[FieldForce Pro] Using direct database connection");
  }
}