const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const matched = await prisma.rawAttendanceRecord.findMany({
    where: { isMatched: true },
    take: 10,
    select: { originalName: true, employeeId: true, attendanceMonth: true, attendanceYear: true }
  });
  
  console.log(`✅ Matched raw records: ${matched.length}`);
  matched.forEach(r => {
    console.log(`  ${r.originalName} → Employee UUID: ${r.employeeId} | Period: ${r.attendanceYear}-${String(r.attendanceMonth).padStart(2, '0')}`);
  });
  
  await prisma.$disconnect();
}

check().catch(console.error);
