const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkNames() {
  console.log('🔍 CHECKING NAME MISMATCH BETWEEN EXCEL AND HRMS\n');
  
  // Get HRMS employee names
  const employees = await prisma.employee.findMany({
    select: { employeeId: true, firstName: true, lastName: true }
  });
  
  console.log('📊 HRMS EMPLOYEE NAMES:');
  const hrmsNames = employees.map(e => {
    const fullName = `${e.firstName} ${e.lastName}`;
    const normalized = fullName.toLowerCase().trim().replace(/\s+/g, ' ');
    console.log(`  ${e.employeeId.padEnd(20)} | "${fullName.padEnd(30)}" | Normalized: "${normalized}"`);
    return { employeeId: e.employeeId, fullName, normalized };
  });
  
  // Get Excel names from raw attendance records
  const rawRecords = await prisma.rawAttendanceRecord.findMany({
    where: { isMatched: false },
    take: 10,
    select: { originalName: true, isMatched: true }
  });
  
  console.log('\n📋 EXCEL NAMES (Unmatched):');
  rawRecords.forEach(r => {
    const normalized = r.originalName.toLowerCase().trim().replace(/\s+/g, ' ');
    console.log(`  Excel: "${r.originalName.padEnd(30)}" | Normalized: "${normalized}"`);
    
    // Try to find match in HRMS
    const match = hrmsNames.find(h => h.normalized === normalized);
    if (match) {
      console.log(`    ✅ SHOULD MATCH: ${match.employeeId} (${match.fullName})`);
    } else {
      console.log(`    ❌ NO MATCH FOUND IN HRMS`);
    }
  });
  
  await prisma.$disconnect();
}

checkNames().catch(console.error);
