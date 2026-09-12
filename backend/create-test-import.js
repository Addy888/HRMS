const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * CREATE TEST RAW ATTENDANCE RECORD for Sumaiyya Tamboli
 * This simulates what would be created when HR uploads an Excel file
 */

async function createTestImport() {
  console.log('🧪 CREATING TEST IMPORT FOR SUMAIYYA TAMBOLI\n');
  
  // Get Sumaiyya's employee record
  const employee = await prisma.employee.findFirst({
    where: { employeeId: 'FCS-HR-ADMIN-001' },
    select: { 
      id: true, 
      employeeId: true, 
      firstName: true, 
      lastName: true,
      organizationId: true 
    }
  });
  
  if (!employee) {
    console.log('❌ Employee FCS-HR-ADMIN-001 not found');
    await prisma.$disconnect();
    return;
  }
  
  console.log(`✅ Found employee: ${employee.firstName} ${employee.lastName}`);
  console.log(`   UUID: ${employee.id}`);
  console.log(`   Org: ${employee.organizationId}\n`);
  
  // Get a real user for uploadedBy
  const user = await prisma.user.findFirst({
    where: { organizationId: employee.organizationId },
    select: { id: true }
  });
  
  if (!user) {
    console.log('❌ No user found in organization');
    await prisma.$disconnect();
    return;
  }
  
  // Create test import history
  const importHistory = await prisma.attendanceImportHistory.create({
    data: {
      organizationId: employee.organizationId,
      fileName: 'TEST_September_2026_Sumaiyya.xlsx',
      uploadedBy: user.id,
      totalRows: 1,
      successfulRows: 0,
      failedRows: 0,
      status: 'PROCESSING'
    }
  });
  
  console.log(`✅ Created import history: ${importHistory.id}\n`);
  
  // Create test Excel data structure matching real format
  const testExcelData = {
    'Agent ID': 'TEST-001',
    'Agent Name': 'Sumaiyya Tamboli', // EXACT MATCH
    'Designation': 'HR Admin',
    'Process': 'HR',
    'Shift Start': '10:00 AM',
    '01 Sat': 'P',
    '02 Sun': 'WO',
    '03 Mon': 'WO',
    '04 Tue': 'P',
    '05 Wed': 'P',
    '06 Thu': 'P',
    '07 Fri': 'P',
    '08 Sat': 'P',
    '09 Sun': 'WO',
    '10 Mon': 'WO',
    '11 Tue': 'P',
    '12 Wed': 'P',
    '13 Thu': 'H', // Half day
    '14 Fri': 'P',
    '15 Sat': 'P',
    '16 Sun': 'WO',
    '17 Mon': 'WO',
    '18 Tue': 'P',
    '19 Wed': 'L', // Late
    '20 Thu': 'P',
    '21 Fri': 'P',
    '22 Sat': 'P',
    '23 Sun': 'WO',
    '24 Mon': 'WO',
    '25 Tue': 'P',
    '26 Wed': 'P',
    '27 Thu': 'P',
    '28 Fri': 'A', // Absent
    '29 Sat': 'P',
    '30 Sun': 'WO'
  };
  
  // Create raw attendance record
  const rawRecord = await prisma.rawAttendanceRecord.create({
    data: {
      organizationId: employee.organizationId,
      importHistoryId: importHistory.id,
      employeeId: employee.id, // MATCHED
      originalIdentifier: 'TEST-001',
      originalName: 'Sumaiyya Tamboli',
      rawData: JSON.stringify(testExcelData),
      attendanceMonth: 9, // September
      attendanceYear: 2026,
      isMatched: true,
      matchedAt: new Date(),
      matchingNote: 'Test import - exact name match'
    }
  });
  
  console.log(`✅ Created raw attendance record: ${rawRecord.id}`);
  console.log(`   Matched: ${rawRecord.isMatched}`);
  console.log(`   Period: ${rawRecord.attendanceYear}-${String(rawRecord.attendanceMonth).padStart(2, '0')}\n`);
  
  console.log('📊 Test data structure:');
  console.log('   - 30 days of September 2026');
  console.log('   - Mix of statuses: P (Present), WO (Week Off), H (Half Day), L (Late), A (Absent)');
  console.log('   - Employee UUID matches HRMS database');
  console.log('   - Organization ID matches\n');
  
  console.log('🔄 NOW RUN THE IMPORT PROCESSOR TO CREATE ATTENDANCE RECORDS\n');
  console.log('Next step: node test-process-raw-record.js');
  
  await prisma.$disconnect();
}

createTestImport().catch(console.error);
