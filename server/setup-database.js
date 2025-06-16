const { createClient } = require('@supabase/supabase-js');

// Database schema setup for Supabase
async function setupDatabase() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase credentials');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    // Create roles table
    console.log('Creating roles table...');
    await supabase.rpc('create_roles_table');
    
    // Create user_roles table
    console.log('Creating user_roles table...');
    await supabase.rpc('create_user_roles_table');
    
    // Create employees table
    console.log('Creating employees table...');
    await supabase.rpc('create_employees_table');

    console.log('Database setup completed successfully!');
  } catch (error) {
    console.error('Database setup failed:', error);
  }
}

setupDatabase();