const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUUID() {
  console.log('🔍 CHECKING FCS0160 UUID MISMATCH\n');
  
  // Get employee from database
  const dbEmployee = await prisma.employee.findFirst({
    where: { employeeId: 'FCS0160' },
    select: {
      id: true,
      employeeId: true,
      firstName: true,
      lastName: true,
    }
  });
  
  console.log('Database Employee FCS0160:');
  console.log(JSON.stringify(dbEmployee, null, 2));
  
  // Get raw record
  const rawRecord = await prisma.rawAttendanceRecord.findFirst({
    where: { originalIdentifier: 'FCS0160' },
    select: {
      id: true,
      employeeId: true,
      originalIdentifier: true,
      isMatched: true,
    }
  });
  
  console.log('\nRaw Record FCS0160:');
  console.log(JSON.stringify(rawRecord, null, 2));
  
  console.log('\n🔍 COMPARISON:');
  console.log(`DB Employee UUID:  ${dbEmployee?.id}`);
  console.log(`Raw Record UUID:   ${rawRecord?.employeeId}`);
  console.log(`Match: ${dbEmployee?.id === rawRecord?.employeeId ? '✅ YES' : '❌ NO'}`);
  
  // Check if attendance exists for the RAW record's employeeId
  if (rawRecord?.employeeId) {
    const att = await prisma.attendance.findMany({
      where: {
        employeeId: rawRecord.employeeId,
        date: {
          gte: new Date('2026-08-01'),
          lte: new Date('2026-08-31'),
        }
      },
      take: 5,
      select: {
        id: true,
        date: true,
        status: true,
      }
    });
    
    console.log(`\nAttendance for raw record UUID: ${att.length} records`);
    if (att.length > 0) {
      att.forEach(a => {
        console.log(`  - ${a.date.toISOString().split('T')[0]}: ${a.status}`);
      });
    }
  }
  
  await prisma.$disconnect();
}

checkUUID().catch(console.error);
