const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Test script to verify NAME-ONLY matching logic
 * Tests: normalization, single match, no match, ambiguous duplicate names
 */

function normalizeName(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

async function testNameMatching() {
  console.log('🧪 TESTING NAME-ONLY MATCHING LOGIC\n');
  
  // Get all employees
  const employees = await prisma.employee.findMany({
    select: {
      id: true,
      employeeId: true,
      firstName: true,
      lastName: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  
  console.log(`📊 Found ${employees.length} employees in database\n`);
  
  // Group employees by normalized name
  const employeesByNormalizedName = new Map();
  
  for (const emp of employees) {
    const fullName = `${emp.firstName} ${emp.lastName}`;
    const normalized = normalizeName(fullName);
    
    if (!employeesByNormalizedName.has(normalized)) {
      employeesByNormalizedName.set(normalized, []);
    }
    employeesByNormalizedName.get(normalized).push(emp);
    
    console.log(`Employee: ${emp.employeeId.padEnd(25)} | Name: "${fullName.padEnd(30)}" | Normalized: "${normalized}"`);
  }
  
  console.log('\n' + '='.repeat(100) + '\n');
  
  // Check for duplicate names
  console.log('🔍 CHECKING FOR DUPLICATE NAMES:\n');
  let duplicatesFound = false;
  
  for (const [normalizedName, emps] of employeesByNormalizedName.entries()) {
    if (emps.length > 1) {
      duplicatesFound = true;
      const ids = emps.map(e => e.employeeId).join(', ');
      console.log(`⚠️  DUPLICATE: "${normalizedName}" has ${emps.length} employees: ${ids}`);
    }
  }
  
  if (!duplicatesFound) {
    console.log('✅ No duplicate names found - all names are unique!');
  }
  
  console.log('\n' + '='.repeat(100) + '\n');
  
  // Test matching with sample Excel names
  console.log('🧪 TESTING SAMPLE EXCEL NAMES:\n');
  
  const testCases = [
    'Sumaiyya Tamboli',
    'SUMAIYYA TAMBOLI',
    '  sumaiyya tamboli  ',
    'Sumaiyya  Tamboli',  // Extra spaces
    'Aditya day',          // Potentially duplicate
    'NonExistent Person',
  ];
  
  for (const testName of testCases) {
    const normalized = normalizeName(testName);
    const matches = employeesByNormalizedName.get(normalized) || [];
    
    console.log(`\nTest: "${testName}"`);
    console.log(`  Normalized: "${normalized}"`);
    
    if (matches.length === 0) {
      console.log(`  ❌ Result: NO MATCH - Employee not found`);
    } else if (matches.length === 1) {
      console.log(`  ✅ Result: SINGLE MATCH - ${matches[0].employeeId} (${matches[0].firstName} ${matches[0].lastName})`);
    } else {
      const ids = matches.map(e => e.employeeId).join(', ');
      console.log(`  ⚠️  Result: AMBIGUOUS - ${matches.length} employees found: ${ids}`);
      console.log(`  🚫 Action: REJECT - Cannot determine which employee`);
    }
  }
  
  console.log('\n' + '='.repeat(100) + '\n');
  console.log('✅ NAME-ONLY MATCHING TEST COMPLETE');
  
  await prisma.$disconnect();
}

testNameMatching().catch(console.error);
