/**
 * Create complete attendance Excel data with multiple employees
 * Run: npx ts-node create-complete-attendance-data.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('📊 Creating COMPLETE attendance data for ALL employees\n');
  console.log('='.repeat(70));

  // Get organization
  const user = await prisma.user.findUnique({
    where: { email: 'test123@gmail.com' },
    include: { employee: { include: { organization: true } } },
  });

  if (!user || !user.employee) {
    console.log('❌ Employee not found!');
    return;
  }

  const organizationId = user.employee.organizationId;
  console.log(`\n✅ Organization: ${user.employee.organization.name}`);
  console.log(`   Organization ID: ${organizationId}`);

  // Get ALL employees in the organization
  const employees = await prisma.employee.findMany({
    where: { organizationId },
    include: { department: true },
    take: 50, // Get up to 50 employees
  });

  console.log(`\n✅ Found ${employees.length} employees in organization`);

  // Get HR user for import history
  const hrUser = await prisma.user.findFirst({
    where: {
      organizationId,
      role: { name: { in: ['HR', 'HR_ADMIN', 'HR_USER'] } },
    },
  });

  if (!hrUser) {
    console.log('❌ No HR user found!');
    return;
  }

  console.log(`\n✅ Using HR user: ${hrUser.email}`);

  // Delete old test data
  console.log('\n🗑️  Cleaning up old test data...');
  await prisma.rawAttendanceRecord.deleteMany({
    where: {
      organizationId,
      importHistory: {
        fileName: { contains: 'complete-attendance-september' },
      },
    },
  });

  await prisma.attendanceImportHistory.deleteMany({
    where: {
      organizationId,
      fileName: { contains: 'complete-attendance-september' },
    },
  });

  console.log('✅ Old data cleaned');

  // Create import history
  console.log('\n💾 Creating import history...');
  const columns = [
    'Agent ID',
    'Agent Name',
    'Designation',
    'Process',
    'Shift Start',
    '01 Sat',
    '02 Sun',
    '03 Mon',
    '04 Tue',
    '05 Wed',
    '06 Thu',
    '07 Fri',
    '08 Sat',
    '09 Sun',
    '10 Mon',
    '11 Tue',
    '12 Wed',
    '13 Thu',
    '14 Fri',
    '15 Sat',
    '16 Sun',
    '17 Mon',
    '18 Tue',
    '19 Wed',
    '20 Thu',
    '21 Fri',
    '22 Sat',
    '23 Sun',
    '24 Mon',
    '25 Tue',
    '26 Wed',
    '27 Thu',
    '28 Fri',
    '29 Sat',
    '30 Sun',
    '31 Mon',
    'Total 1',
    'Total H',
    'Total A',
    'WO',
    'Late Login Days - All Working Days',
    'Wk 03-09 Aug',
    'Wk 10-16 Aug',
    'Wk 17-23 Aug',
    'Wk 24-30 Aug',
    'Total HD',
    'Late Login Days - Full Weeks',
  ];

  const importHistory = await prisma.attendanceImportHistory.create({
    data: {
      organizationId,
      fileName: 'complete-attendance-september-2026.xlsx',
      uploadedBy: hrUser.id,
      totalRows: employees.length,
      successfulRows: employees.length,
      failedRows: 0,
      duplicateRows: 0,
      status: 'COMPLETED',
      originalColumns: JSON.stringify(columns),
      completedAt: new Date(),
    },
  });

  console.log(`✅ Import history created: ${importHistory.id}`);

  // Create attendance data for each employee
  console.log(`\n📋 Creating attendance records for ${employees.length} employees...\n`);

  let created = 0;
  for (const emp of employees) {
    // Generate realistic attendance data
    const attendanceData: any = {
      'Agent ID': emp.employeeId,
      'Agent Name': `${emp.firstName} ${emp.lastName}`,
      'Designation': 'Agent',
      'Process': emp.department?.name || 'General',
      'Shift Start': '10:00 AM',
    };

    // Add day-wise attendance (P=Present, WO=Week Off, A=Absent)
    const days = [
      '01 Sat', '02 Sun', '03 Mon', '04 Tue', '05 Wed', '06 Thu', '07 Fri',
      '08 Sat', '09 Sun', '10 Mon', '11 Tue', '12 Wed', '13 Thu', '14 Fri',
      '15 Sat', '16 Sun', '17 Mon', '18 Tue', '19 Wed', '20 Thu', '21 Fri',
      '22 Sat', '23 Sun', '24 Mon', '25 Tue', '26 Wed', '27 Thu', '28 Fri',
      '29 Sat', '30 Sun', '31 Mon',
    ];

    let presentDays = 0;
    let weekOffs = 0;

    days.forEach((day) => {
      const dayOfWeek = day.split(' ')[1]; // Sat, Sun, Mon, etc.
      if (dayOfWeek === 'Sun' || dayOfWeek === 'Mon') {
        attendanceData[day] = 'WO';
        weekOffs++;
      } else {
        // Random attendance: 90% present, 10% absent
        const isPresent = Math.random() > 0.1;
        attendanceData[day] = isPresent ? 'P' : 'A';
        if (isPresent) presentDays++;
      }
    });

    // Add totals
    attendanceData['Total 1'] = presentDays.toString();
    attendanceData['Total H'] = (presentDays * 8).toString();
    attendanceData['Total A'] = (days.length - presentDays - weekOffs).toString();
    attendanceData['WO'] = weekOffs.toString();
    attendanceData['Late Login Days - All Working Days'] = Math.floor(Math.random() * 3).toString();
    attendanceData['Wk 03-09 Aug'] = '6/6';
    attendanceData['Wk 10-16 Aug'] = '6/6';
    attendanceData['Wk 17-23 Aug'] = '5/6';
    attendanceData['Wk 24-30 Aug'] = '5/6';
    attendanceData['Total HD'] = '0';
    attendanceData['Late Login Days - Full Weeks'] = '0';

    // Create raw attendance record
    await prisma.rawAttendanceRecord.create({
      data: {
        organizationId,
        importHistoryId: importHistory.id,
        employeeId: emp.id,
        originalIdentifier: emp.employeeId,
        originalName: `${emp.firstName} ${emp.lastName}`,
        rawData: JSON.stringify(attendanceData),
        attendanceMonth: 9,
        attendanceYear: 2026,
        isMatched: true,
        matchedAt: new Date(),
        matchingNote: 'Complete attendance data',
      },
    });

    created++;
    console.log(`   ✓ ${created}/${employees.length} - ${emp.employeeId}: ${emp.firstName} ${emp.lastName}`);
  }

  console.log(`\n✅ Created ${created} attendance records!`);

  // Verify
  console.log('\n='.repeat(70));
  console.log('\n🔍 VERIFICATION:\n');

  const verifyRecords = await prisma.rawAttendanceRecord.findMany({
    where: {
      organizationId,
      attendanceMonth: 9,
      attendanceYear: 2026,
    },
  });

  console.log(`✅ Total records in database: ${verifyRecords.length}`);
  console.log(`✅ Columns: ${columns.length}`);
  console.log(`✅ Employees covered: ${employees.length}`);

  console.log('\n' + '='.repeat(70));
  console.log('\n🎯 COMPLETE! Now:');
  console.log('   1. Restart backend: cd backend && npm run start:dev');
  console.log('   2. Restart frontend: cd frontend && npm run dev');
  console.log('   3. Login as ANY employee (e.g., test123@gmail.com)');
  console.log('   4. Go to: Employee Portal → Attendance');
  console.log('   5. Scroll down to: "Uploaded Attendance"');
  console.log(`   6. You will see COMPLETE Excel with ${employees.length} employees!\n`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
