/**
 * SIMULATE EMPLOYEE VIEWING AUGUST 2026 ATTENDANCE
 * This simulates exactly what happens when employee opens /employee/attendance
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function simulateEmployeeView() {
  console.log('🎭 SIMULATING EMPLOYEE VIEW - AUGUST 2026\n');
  console.log('='.repeat(70));
  
  // Step 1: Simulate employee login (FCS0014)
  const employeeId = 'FCS0014';
  console.log(`\n1️⃣ Employee Login: ${employeeId}`);
  
  const employee = await prisma.employee.findFirst({
    where: { employeeId },
    select: {
      id: true,
      employeeId: true,
      firstName: true,
      lastName: true,
      organizationId: true,
    }
  });
  
  if (!employee) {
    console.log('❌ Employee not found!');
    await prisma.$disconnect();
    return;
  }
  
  console.log(`   ✅ Found: ${employee.firstName} ${employee.lastName}`);
  console.log(`   UUID: ${employee.id}`);
  console.log(`   Organization: ${employee.organizationId}`);
  
  // Step 2: Employee selects August 2026
  const month = 8;
  const year = 2026;
  console.log(`\n2️⃣ Employee Selects: August 2026 (month=${month}, year=${year})`);
  
  // Step 3: Backend API query (exactly as in attendance.service.ts)
  const startDate = new Date(year, month - 1, 1); // JS month 0-indexed
  const endDate = new Date(year, month, 0); // Last day of month
  
  console.log(`   Query Date Range:`);
  console.log(`     Start: ${startDate.toISOString()}`);
  console.log(`     End:   ${endDate.toISOString()}`);
  
  const attendances = await prisma.attendance.findMany({
    where: {
      employeeId: employee.id,
      date: {
        gte: startDate,
        lte: endDate,
      }
    },
    include: {
      shift: true,
    },
    orderBy: { date: 'asc' },
  });
  
  console.log(`\n3️⃣ Database Query Results: ${attendances.length} records found`);
  
  if (attendances.length === 0) {
    console.log('   ❌ NO ATTENDANCE DATA - CALENDAR WILL BE BLANK!');
    await prisma.$disconnect();
    return;
  }
  
  // Step 4: Display calendar preview
  console.log(`\n4️⃣ Calendar Preview (First 10 Days):`);
  console.log('   ' + '-'.repeat(66));
  console.log('   | Date       | Status       | Check In  | Check Out | Hours   |');
  console.log('   ' + '-'.repeat(66));
  
  attendances.slice(0, 10).forEach(a => {
    const date = new Date(a.date).toISOString().split('T')[0];
    const checkIn = a.checkInTime ? new Date(a.checkInTime).toISOString().substring(11, 16) : '---';
    const checkOut = a.checkOutTime ? new Date(a.checkOutTime).toISOString().substring(11, 16) : '---';
    const hours = a.workingHours ? a.workingHours.toFixed(1) : '0';
    const status = a.status.padEnd(12);
    
    console.log(`   | ${date} | ${status} | ${checkIn}     | ${checkOut}     | ${hours.padStart(5)} |`);
  });
  console.log('   ' + '-'.repeat(66));
  
  // Step 5: Calculate summary (as frontend does)
  const totalPresent = attendances.filter(a => a.status === 'PRESENT').length;
  const totalLate = attendances.filter(a => a.status === 'LATE').length;
  const totalHalfDay = attendances.filter(a => a.status === 'HALF_DAY').length;
  const totalAbsent = attendances.filter(a => a.status === 'ABSENT').length;
  const totalWeekOff = attendances.filter(a => a.status === 'WEEK_OFF').length;
  
  const workingDays = attendances.filter(a => 
    !['HOLIDAY', 'WEEK_OFF'].includes(a.status)
  ).length;
  
  const attendancePercentage = workingDays > 0 
    ? ((totalPresent + totalLate + totalHalfDay * 0.5) / workingDays * 100).toFixed(1)
    : 0;
  
  console.log(`\n5️⃣ Monthly Summary:`);
  console.log(`   Total Present:    ${totalPresent}`);
  console.log(`   Total Late:       ${totalLate}`);
  console.log(`   Total Half Day:   ${totalHalfDay}`);
  console.log(`   Total Absent:     ${totalAbsent}`);
  console.log(`   Total Week Off:   ${totalWeekOff}`);
  console.log(`   Working Days:     ${workingDays}`);
  console.log(`   Attendance %:     ${attendancePercentage}%`);
  
  console.log('\n' + '='.repeat(70));
  console.log('✅ EMPLOYEE WILL SEE POPULATED CALENDAR!\n');
  
  await prisma.$disconnect();
}

simulateEmployeeView().catch(console.error);
