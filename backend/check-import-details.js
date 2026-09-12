const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkImportDetails() {
  console.log('🔍 CHECKING IMPORT DETAILS\n');
  
  // Get the latest import
  const latestImport = await prisma.attendanceImportHistory.findFirst({
    orderBy: { uploadedAt: 'desc' },
    select: {
      id: true,
      fileName: true,
      uploadedAt: true,
      totalRows: true,
      successfulRows: true,
      failedRows: true,
      status: true,
      errorReport: true,
      originalColumns: true,
    }
  });
  
  console.log('Latest Import:');
  console.log(JSON.stringify(latestImport, null, 2));
  
  if (!latestImport) {
    console.log('No imports found!');
    await prisma.$disconnect();
    return;
  }
  
  // Check raw records for this import
  const rawRecords = await prisma.rawAttendanceRecord.findMany({
    where: {
      importHistoryId: latestImport.id
    },
    take: 10,
    select: {
      id: true,
      originalIdentifier: true,
      originalName: true,
      employeeId: true,
      isMatched: true,
      matchingNote: true,
      attendanceMonth: true,
      attendanceYear: true,
      rawData: true,
    }
  });
  
  console.log(`\nRaw Records for this import: ${rawRecords.length}`);
  if (rawRecords.length > 0) {
    console.log('\nSample Records:');
    rawRecords.slice(0, 3).forEach((r, i) => {
      console.log(`\n${i + 1}. ${r.originalIdentifier} - ${r.originalName}`);
      console.log(`   Employee UUID: ${r.employeeId}`);
      console.log(`   Matched: ${r.isMatched}`);
      console.log(`   Month/Year: ${r.attendanceMonth}/${r.attendanceYear}`);
      console.log(`   Matching Note: ${r.matchingNote}`);
      
      // Parse raw data to see structure
      try {
        const data = JSON.parse(r.rawData);
        const keys = Object.keys(data);
        console.log(`   Raw Data Keys: ${keys.slice(0, 10).join(', ')}...`);
      } catch (e) {
        console.log(`   Raw Data: [Parse Error]`);
      }
    });
  }
  
  // Check if Attendance records were created from this import
  const attendanceFromImport = await prisma.attendance.findMany({
    where: {
      remarks: {
        contains: latestImport.fileName.substring(0, 20) // Match part of filename
      }
    },
    take: 5,
    select: {
      id: true,
      date: true,
      status: true,
      employeeId: true,
      remarks: true,
    }
  });
  
  console.log(`\n\nAttendance records created from this import: ${attendanceFromImport.length}`);
  if (attendanceFromImport.length > 0) {
    attendanceFromImport.forEach(a => {
      console.log(`  - ${a.date.toISOString().split('T')[0]}: ${a.status}`);
    });
  } else {
    console.log('  ❌ NO Attendance records created!');
  }
  
  await prisma.$disconnect();
}

checkImportDetails().catch(console.error);
