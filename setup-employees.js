const { supabaseStorage } = require('./server/supabase.ts');

async function setupEmployees() {
  try {
    console.log('Setting up employees table with initial data...');
    
    // Create FAE employee
    const faeEmployee = await supabaseStorage.createEmployee({
      email: 'fae@company.com',
      fullName: 'John Doe - Field Area Executive',
      role: 'FAE',
      department: 'Field Operations',
      phone: '+1234567890',
      status: 'active'
    });
    console.log('Created FAE employee:', faeEmployee.email);

    // Create Admin employee
    const adminEmployee = await supabaseStorage.createEmployee({
      email: 'admin@company.com',
      fullName: 'Jane Smith - Administrator',
      role: 'ADMIN',
      department: 'Administration',
      phone: '+1234567891',
      status: 'active'
    });
    console.log('Created Admin employee:', adminEmployee.email);

    console.log('Employees setup completed successfully!');
  } catch (error) {
    console.error('Error setting up employees:', error);
  }
}

setupEmployees();