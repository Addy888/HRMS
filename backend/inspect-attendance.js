const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspect() {
  const employeeUUID = '9f302c43-ba62-4b69-af2e-c6e19a638eec';
  const orgId = '3245af42-a1a7-423c-b7d0-05e7f7046a20';
  
  console.log('=== INSPECTING ATTENDANCE RECORDS ===');
  console.log('Employee UUID:', employeeUUID);
  console.log('Organization:', orgId);
  
  const records = await prisma.attendance.findMany({
    where: {
      employeeId: employeeUUID,
      organizationId: orgId,
      date: {
        gte: new Date('2026-09-01'),
        lt: new Date('2026-10-01')
      }
    },
    select: {
      id: true,
      date: true,
      status: true,
      checkInTime: true,
      checkOutTime: true,
      workingHours: true,
      source: true
    },
    orderBy: { date: 'asc' }
  });
  
  console.log(`\nFound ${records.length} records for September 2026`);
  if (records.length > 0) {
    records.forEach(r => {
      console.log(`- ${r.date.toISOString().split('T')[0]}: ${r.status} (source: ${r.source})`);
    });
  }
  
  await prisma.$disconnect();
}

inspect().catch(console.error);
