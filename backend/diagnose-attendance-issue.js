const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function diagnose() {
  console.log('🔍 DIAGNOSING ATTENDANCE ISSUE\n');
  
  // 1. Check employees
  const employees = await prisma.employee.findMany({
    select: { id: true, employeeId: true, firstName: true, lastName: true, organizationId: true }
  });
  
  console.log('📊 EMPLOYEES IN DATABASE:');
  employees.forEach(e => {
    console.log(`  ${e.employeeId} | ${e.firstName} ${e.lastName} | UUID: ${e.id} | Org: ${e.organizationId}`);
  });
  
  // 2. Check import history
  const imports = await prisma.attendanceImportHistory.findMany({
    take: 3,
    orderBy: { uploadedAt: 'desc' },
    select: { id: true, fileName: true, successfulRows: true, failedRows: true, uploadedAt: true }
  });
  
  console.log('\n📜 RECENT IMPORTS:');
  imports.forEach(i => {
    console.log(`  ${i.fileName} | Success: ${i.successfulRows} | Failed: ${i.failedRows} | ${i.uploadedAt.toISOString().split('T')[0]}`);
  });
  
  // 3. Check raw attendance records
  const rawRecords = await prisma.rawAttendanceRecord.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
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
  
  console.log('\n📋 RAW ATTENDANCE RECORDS (last 5):');
  rawRecords.forEach(r => {
    console.log(`  Employee UUID: ${r.employeeId || 'NULL'} | Name: ${r.originalName} | Matched: ${r.isMatched} | Period: ${r.attendanceYear}-${String(r.attendanceMonth).padStart(2, '0')}`);
  });
  
  // 4. Check actual Attendance table
  const attendances = await prisma.attendance.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      employeeId: true,
      date: true,
      checkInTime: true,
      checkOutTime: true,
      status: true,
      source: true,
      organizationId: true
    }
  });
  
  console.log('\n✅ ATTENDANCE TABLE RECORDS (last 10):');
  if (attendances.length === 0) {
    console.log('  ❌ NO ATTENDANCE RECORDS FOUND - THIS IS THE PROBLEM!');
  } else {
    attendances.forEach(a => {
      const dateStr = a.date.toISOString().split('T')[0];
      const checkIn = a.checkInTime ? new Date(a.checkInTime).toISOString().substring(11, 16) : 'N/A';
      const checkOut = a.checkOutTime ? new Date(a.checkOutTime).toISOString().substring(11, 16) : 'N/A';
      console.log(`  ${dateStr} | EmpUUID: ${a.employeeId.substring(0, 13)}... | ${a.status} | ${checkIn}-${checkOut} | Source: ${a.source}`);
    });
  }
  
  // 5. Check for specific employee
  if (employees.length > 0) {
    const testEmployee = employees.find(e => e.firstName.toLowerCase().includes('sumaiyya')) || employees[0];
    console.log(`\n🧪 TESTING WITH EMPLOYEE: ${testEmployee.employeeId} (${testEmployee.firstName} ${testEmployee.lastName})`);
    console.log(`   UUID: ${testEmployee.id}`);
    console.log(`   Org ID: ${testEmployee.organizationId}`);
    
    const empAttendances = await prisma.attendance.findMany({
      where: { employeeId: testEmployee.id },
      orderBy: { date: 'desc' },
      take: 5
    });
    
    console.log(`\n   Attendance records for this employee: ${empAttendances.length}`);
    if (empAttendances.length > 0) {
      empAttendances.forEach(a => {
        console.log(`     ${a.date.toISOString().split('T')[0]} | ${a.status} | Source: ${a.source}`);
      });
    } else {
      console.log('     ❌ NO ATTENDANCE RECORDS FOR THIS EMPLOYEE');
    }
  }
  
  await prisma.$disconnect();
}

diagnose().catch(console.error);
