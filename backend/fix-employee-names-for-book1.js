const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Fix employee names to prepare for Book1(2).xlsx upload
 * 
 * Current State:
 * - FCS0160: Aditya day
 * - FCS0014: Aditya day (DUPLICATE!)
 * - FCS-HR-ADMIN-001: Sumaiyya Tamboli
 * 
 * Excel contains first names:
 * - aditya
 * - sumaiyya
 * - aman
 * - akash
 * - poojakale
 */

async function fixEmployeeNames() {
  console.log('=== FIX EMPLOYEE NAMES FOR Book1(2).xlsx UPLOAD ===\n');

  // Get current employees
  const employees = await prisma.employee.findMany({
    select: {
      id: true,
      employeeId: true,
      firstName: true,
      lastName: true,
      user: {
        select: { email: true }
      }
    }
  });

  console.log('Current Employees:');
  employees.forEach(emp => {
    console.log(`  ${emp.employeeId}: ${emp.firstName} ${emp.lastName} <${emp.user?.email}>`);
  });

  console.log('\n\nQUESTION: Which Aditya employee should be renamed to "Aditya Shastri"?');
  console.log('\nOptions:');
  console.log('  1. FCS0160 (test123@gmail.com)');
  console.log('  2. FCS0014 (aditechstudio@gmail.com)');
  console.log('  3. Rename both to different last names');
  console.log('  4. Skip (manual fix needed)\n');

  console.log('RECOMMENDATION:');
  console.log('  - If FCS0160 is the real "Aditya Shastri", rename it');
  console.log('  - If FCS0014 is the real "Aditya Shastri", rename it');
  console.log('  - Otherwise, MANUALLY verify which is correct\n');

  console.log('To fix FCS0160 → "Aditya Shastri", run:');
  console.log(`  node -e "const {PrismaClient} = require('@prisma/client'); const prisma = new PrismaClient(); prisma.employee.update({ where: { employeeId: 'FCS0160' }, data: { lastName: 'Shastri' } }).then(r => console.log('Updated:', r.employeeId, r.firstName, r.lastName)).finally(() => prisma.\\$disconnect());"\n`);

  console.log('To fix FCS0014 → "Aditya Shastri", run:');
  console.log(`  node -e "const {PrismaClient} = require('@prisma/client'); const prisma = new PrismaClient(); prisma.employee.update({ where: { employeeId: 'FCS0014' }, data: { lastName: 'Shastri' } }).then(r => console.log('Updated:', r.employeeId, r.firstName, r.lastName)).finally(() => prisma.\\$disconnect());"\n`);

  console.log('\n\nMISSING EMPLOYEES:');
  console.log('  The following Excel names have no matching employees:');
  console.log('    - aman');
  console.log('    - akash');
  console.log('    - poojakale');
  console.log('\n  Options:');
  console.log('    1. Create these employees in HRMS before upload');
  console.log('    2. Accept that these rows will be skipped/unmatched');
  console.log('    3. Remove these rows from Excel before upload\n');

  console.log('\n=== NEXT STEPS ===\n');
  console.log('1. Fix the duplicate "Aditya day" employee names (above commands)');
  console.log('2. Optionally add missing employees (aman, akash, poojakale)');
  console.log('3. Upload Book1(2).xlsx through HR portal');
  console.log('4. Run: node diagnose-book1-upload.js');
  console.log('5. Verify attendance appears in employee calendars\n');
}

fixEmployeeNames()
  .catch(e => {
    console.error('Error:', e);
  })
  .finally(() => {
    prisma.$disconnect();
  });
