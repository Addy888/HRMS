const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * TRACE THE ACTUAL BOOK1(2).XLSX IMPORT
 */

async function traceActualImport() {
  console.log('🔍 TRACING ACTUAL IMPORT: Book1(2).xlsx\n');
  console.log('='.repeat(100) + '\n');
  
  // Find the actual import
  const importHistory = await prisma.attendanceImportHistory.findFirst({
    where: {
      fileName: { contains: 'Book1' }
    },
    orderBy: { uploadedAt: 'desc' },
    select: {
      id: true,
      fileName: true,
      totalRows: true,
      successfulRows: true,
      failedRows: true,
      status: true,
      uploadedAt: true,
      organizationId: true
    }
  });
  
  if (!importHistory) {
    console.log('❌ Import not found for Book1(2).xlsx');
    await prisma.$disconnect();
    return;
  }
  
  console.log('📋 IMPORT HISTORY:');
  console.log(`   File: ${importHistory.fileName}`);
  console.log(`   Total Rows: ${importHistory.totalRows}`);
  console.log(`   Successful: ${importHistory.successfulRows}`);
  console.log(`   Failed: ${importHistory.failedRows}`);
  console.log(`   Status: ${importHistory.status}`);
  console.log(`   Uploaded: ${importHistory.uploadedAt.toISOString()}`);
  console.log(`   Import ID: ${importHistory.id}\n`);
  console.log('='.repeat(100) + '\n');
  
  // Get all raw records from this import
  const rawRecords = await prisma.rawAttendanceRecord.findMany({
    where: { importHistoryId: importHistory.id },
    select: {
      id: true,
      employeeId: true,
      originalName: true,
      isMatched: true,
      attendanceMonth: true,
      attendanceYear: true,
      rawData: true
    }
  });
  
  console.log(`📊 RAW RECORDS: ${rawRecords.length} total\n`);
  
  const matched = rawRecords.filter(r => r.isMatched);
  const unmatched = rawRecords.filter(r => !r.isMatched);
  
  console.log(`   ✅ Matched: ${matched.length}`);
  console.log(`   ❌ Unmatched: ${unmatched.length}\n`);
  console.log('='.repeat(100) + '\n');
  
  // Get all HRMS employees
  const employees = await prisma.employee.findMany({
    where: { organizationId: importHistory.organizationId },
    select: {
      id: true,
      employeeId: true,
      firstName: true,
      lastName: true
    }
  });
  
  console.log(`👥 HRMS EMPLOYEES: ${employees.length}\n`);
  employees.forEach(e => {
    console.log(`   ${e.employeeId.padEnd(25)} | ${e.firstName} ${e.lastName}`);
  });
  console.log('\n' + '='.repeat(100) + '\n');
  
  // Analyze FIRST 20 raw records
  console.log('📋 SAMPLE RAW RECORDS (first 20):\n');
  
  for (let i = 0; i < Math.min(20, rawRecords.length); i++) {
    const raw = rawRecords[i];
    const data = JSON.parse(raw.rawData);
    
    console.log(`${i + 1}. Excel Name: "${raw.originalName}"`);
    console.log(`   Matched: ${raw.isMatched ? '✅ YES' : '❌ NO'}`);
    if (raw.isMatched && raw.employeeId) {
      const emp = employees.find(e => e.id === raw.employeeId);
      if (emp) {
        console.log(`   HRMS Employee: ${emp.employeeId} (${emp.firstName} ${emp.lastName})`);
      }
    }
    
    // Check if Period exists
    const periodCol = Object.keys(data).find(k => /period/i.test(k));
    if (periodCol) {
      console.log(`   Period: ${data[periodCol]}`);
    }
    console.log(`   Month/Year: ${raw.attendanceYear}-${String(raw.attendanceMonth).padStart(2, '0')}`);
    console.log('');
  }
  
  console.log('='.repeat(100) + '\n');
  
  // Check Attendance table for matched records
  console.log('📅 CHECKING ATTENDANCE TABLE:\n');
  
  for (const raw of matched.slice(0, 5)) {
    if (!raw.employeeId) continue;
    
    const startDate = new Date(Date.UTC(raw.attendanceYear, raw.attendanceMonth - 1, 1));
    const endDate = new Date(Date.UTC(raw.attendanceYear, raw.attendanceMonth, 0, 23, 59, 59));
    
    const attendances = await prisma.attendance.findMany({
      where: {
        employeeId: raw.employeeId,
        date: { gte: startDate, lte: endDate }
      }
    });
    
    const emp = employees.find(e => e.id === raw.employeeId);
    console.log(`Employee: ${raw.originalName} → ${emp ? emp.employeeId + ' (' + emp.firstName + ' ' + emp.lastName + ')' : 'NOT FOUND'}`);
    console.log(`   Period: ${raw.attendanceYear}-${String(raw.attendanceMonth).padStart(2, '0')}`);
    console.log(`   Attendance Records: ${attendances.length}`);
    if (attendances.length > 0) {
      const sample = attendances.slice(0, 3);
      sample.forEach(a => {
        console.log(`     ${a.date.toISOString().split('T')[0]} | ${a.status}`);
      });
    } else {
      console.log(`     ❌ NO ATTENDANCE RECORDS CREATED`);
    }
    console.log('');
  }
  
  console.log('='.repeat(100) + '\n');
  
  // Check specific employees
  console.log('🔍 CHECKING SPECIFIC EMPLOYEES:\n');
  
  const testEmployees = [
    'Aditya',
    'Sumaiyya',
    'aditya',
    'sumaiyya'
  ];
  
  for (const name of testEmployees) {
    const normalized = name.toLowerCase().trim();
    
    // Find in raw records
    const rawMatch = rawRecords.find(r => 
      r.originalName.toLowerCase().trim().includes(normalized)
    );
    
    if (rawMatch) {
      console.log(`📋 Excel: "${rawMatch.originalName}"`);
      console.log(`   Matched: ${rawMatch.isMatched ? '✅' : '❌'}`);
      
      if (rawMatch.isMatched && rawMatch.employeeId) {
        const emp = employees.find(e => e.id === rawMatch.employeeId);
        if (emp) {
          console.log(`   HRMS: ${emp.employeeId} (${emp.firstName} ${emp.lastName})`);
          
          // Check attendance
          const startDate = new Date(Date.UTC(rawMatch.attendanceYear, rawMatch.attendanceMonth - 1, 1));
          const endDate = new Date(Date.UTC(rawMatch.attendanceYear, rawMatch.attendanceMonth, 0, 23, 59, 59));
          
          const count = await prisma.attendance.count({
            where: {
              employeeId: rawMatch.employeeId,
              date: { gte: startDate, lte: endDate }
            }
          });
          
          console.log(`   Attendance Records: ${count}`);
        }
      }
      console.log('');
    }
  }
  
  console.log('='.repeat(100) + '\n');
  console.log('🎯 ROOT CAUSE ANALYSIS:\n');
  
  if (matched.length === 0) {
    console.log('❌ PROBLEM: NO employees were matched!');
    console.log('   Reason: Excel names do not match HRMS names');
    console.log('   Excel has: first names only (e.g., "sumaiyya", "aditya")');
    console.log('   HRMS has: full names (e.g., "Sumaiyya Tamboli", "Aditya shastri")');
    console.log('\n   FIX NEEDED: Implement FIRST NAME matching instead of full name matching');
  } else {
    console.log(`✅ ${matched.length} employees matched`);
    console.log(`\nChecking if Attendance records were created...`);
    
    let totalAttendance = 0;
    for (const raw of matched.slice(0, 10)) {
      if (!raw.employeeId) continue;
      const startDate = new Date(Date.UTC(raw.attendanceYear, raw.attendanceMonth - 1, 1));
      const endDate = new Date(Date.UTC(raw.attendanceYear, raw.attendanceMonth, 0, 23, 59, 59));
      const count = await prisma.attendance.count({
        where: {
          employeeId: raw.employeeId,
          date: { gte: startDate, lte: endDate }
        }
      });
      totalAttendance += count;
    }
    
    if (totalAttendance === 0) {
      console.log('❌ PROBLEM: Employees matched but NO Attendance records created!');
      console.log('   Reason: importFlexibleAttendanceRow() is not being called or failing silently');
    } else {
      console.log(`✅ ${totalAttendance} Attendance records found`);
    }
  }
  
  await prisma.$disconnect();
}

traceActualImport().catch(console.error);
