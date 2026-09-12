const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkBiometricData() {
  console.log('🔍 CHECKING BIOMETRIC DATA FLOW\n');
  
  // Check employee FCS0160
  const emp = await prisma.employee.findFirst({
    where: { employeeId: 'FCS0160' },
    select: {
      id: true,
      employeeId: true,
      firstName: true,
      lastName: true,
      organizationId: true,
    }
  });
  
  console.log('1. Employee FCS0160:');
  console.log(JSON.stringify(emp, null, 2));
  
  if (!emp) {
    console.log('❌ Employee not found!');
    await prisma.$disconnect();
    return;
  }
  
  // Check August 2026 attendance
  const augustAtt = await prisma.attendance.findMany({
    where: {
      employeeId: emp.id,
      date: {
        gte: new Date('2026-08-01T00:00:00.000Z'),
        lte: new Date('2026-08-31T23:59:59.999Z'),
      }
    },
    take: 10,
    select: {
      id: true,
      date: true,
      status: true,
      checkInTime: true,
      checkOutTime: true,
      source: true,
      remarks: true,
    },
    orderBy: { date: 'asc' }
  });
  
  console.log(`\n2. August 2026 Attendance Records: ${augustAtt.length}`);
  if (augustAtt.length > 0) {
    console.log('Sample records:');
    augustAtt.slice(0, 3).forEach(a => {
      console.log(`  - ${a.date.toISOString().split('T')[0]}: ${a.status} (${a.source})`);
    });
  } else {
    console.log('  ❌ No attendance records found!');
  }
  
  // Check RawAttendanceRecord for August
  const rawRecords = await prisma.rawAttendanceRecord.findMany({
    where: {
      employeeId: emp.id,
      OR: [
        { attendanceMonth: 8, attendanceYear: 2026 },
        { attendanceMonth: null }
      ]
    },
    take: 5,
    select: {
      id: true,
      originalIdentifier: true,
      attendanceMonth: true,
      attendanceYear: true,
      isMatched: true,
      matchingNote: true,
      createdAt: true,
    }
  });
  
  console.log(`\n3. Raw Attendance Records: ${rawRecords.length}`);
  if (rawRecords.length > 0) {
    console.log('Sample raw records:');
    rawRecords.forEach(r => {
      console.log(`  - ID: ${r.originalIdentifier}, Month: ${r.attendanceMonth}, Year: ${r.attendanceYear}, Matched: ${r.isMatched}`);
    });
  } else {
    console.log('  ℹ️ No raw records found');
  }
  
  // Check import history
  const imports = await prisma.attendanceImportHistory.findMany({
    where: {
      organizationId: emp.organizationId,
    },
    take: 5,
    select: {
      id: true,
      fileName: true,
      uploadedAt: true,
      totalRows: true,
      successfulRows: true,
      failedRows: true,
      status: true,
    },
    orderBy: { uploadedAt: 'desc' }
  });
  
  console.log(`\n4. Import History: ${imports.length} imports`);
  imports.forEach(imp => {
    console.log(`  - ${imp.fileName} (${imp.uploadedAt.toISOString().split('T')[0]}): ${imp.successfulRows}/${imp.totalRows} successful`);
  });
  
  await prisma.$disconnect();
}

checkBiometricData().catch(console.error);
