/**
 * Seed Departments and Designations via API
 * Run this with: node seed-departments-api.js
 * 
 * Requirements:
 * 1. Backend must be running on http://localhost:4000
 * 2. You need an HR admin JWT token
 */

const https = require('http');

const API_BASE_URL = 'http://localhost:4000/api/v1';

// Replace with your actual HR admin JWT token
const HR_TOKEN = 'YOUR_JWT_TOKEN_HERE';

// Departments to create
const departments = [
  { name: 'Manager', description: 'Management Department' },
  { name: 'IT', description: 'Information Technology Department' },
  { name: 'Agent', description: 'Agent Department' },
];

// Designations to create
const designations = [
  { name: 'HR Manager', description: 'Human Resources Manager' },
  { name: 'IT Engineer', description: 'Information Technology Engineer' },
  { name: 'Software Developer', description: 'Software Development Professional' },
  { name: 'Agent', description: 'Agent' },
  { name: 'Sales Executive', description: 'Sales Executive' },
  { name: 'Team Leader', description: 'Team Leader' },
  { name: 'Senior Manager', description: 'Senior Management Position' },
];

async function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE_URL);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${HR_TOKEN}`,
      },
    };

    const req = https.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function seedDepartments() {
  console.log('\n🏢 SEEDING DEPARTMENTS...\n');
  
  for (const dept of departments) {
    try {
      const response = await makeRequest('POST', '/departments', dept);
      if (response.status === 201) {
        console.log(`✅ Created: ${dept.name} (${response.data.id})`);
      } else if (response.status === 409) {
        console.log(`ℹ️  Already exists: ${dept.name}`);
      } else {
        console.log(`❌ Error creating ${dept.name}: ${response.status}`, response.data);
      }
    } catch (error) {
      console.error(`❌ Failed to create ${dept.name}:`, error.message);
    }
  }
}

async function seedDesignations() {
  console.log('\n💼 SEEDING DESIGNATIONS...\n');
  
  for (const desig of designations) {
    try {
      const response = await makeRequest('POST', '/designations', desig);
      if (response.status === 201) {
        console.log(`✅ Created: ${desig.name} (${response.data.id})`);
      } else if (response.status === 409) {
        console.log(`ℹ️  Already exists: ${desig.name}`);
      } else {
        console.log(`❌ Error creating ${desig.name}: ${response.status}`, response.data);
      }
    } catch (error) {
      console.error(`❌ Failed to create ${desig.name}:`, error.message);
    }
  }
}

async function verifyData() {
  console.log('\n📊 VERIFYING DATA...\n');
  
  try {
    const deptsResponse = await makeRequest('GET', '/departments');
    console.log('🏢 Departments:');
    deptsResponse.data.forEach(d => console.log(`   - ${d.name} (${d.id})`));
    
    const desigsResponse = await makeRequest('GET', '/designations');
    console.log('\n💼 Designations:');
    desigsResponse.data.forEach(d => console.log(`   - ${d.name} (${d.id})`));
    
    console.log('\n✅ Setup complete!');
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  }
}

async function main() {
  if (HR_TOKEN === 'YOUR_JWT_TOKEN_HERE') {
    console.error('\n❌ ERROR: Please set your HR JWT token in the script!');
    console.log('\nHow to get your token:');
    console.log('1. Login to the application as HR admin');
    console.log('2. Open DevTools (F12) → Application → Local Storage');
    console.log('3. Look for "token" or "authToken"');
    console.log('4. Copy the value and paste it in this script\n');
    process.exit(1);
  }

  console.log('🚀 Starting database seed...');
  console.log('API URL:', API_BASE_URL);
  
  await seedDepartments();
  await seedDesignations();
  await verifyData();
}

main().catch(console.error);
