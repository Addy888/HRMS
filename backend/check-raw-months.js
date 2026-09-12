const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRawMonths() {
  const records = await prisma.rawAttendanceRecord.findMany({
    where: {
      originalIdentifier: { in: ['FCS0160', 'FCS0014'] }
    },
    select: {
      originalIdentifier: true,
      attendanceMonth: true,
      attendanceYear: true,
      importHistory: {
        select: {
          fileName: true,
        }
      }
    }
  });
  
  console.log('Raw Records:');
  records.forEach(r => {
    console.log(`  ${r.originalIdentifier}: Month ${r.attendanceMonth}, Year ${r.attendanceYear}, File: ${r.importHistory.fileName}`);
  });
  
  await prisma.$disconnect();
}

checkRawMonths().catch(console.error);
