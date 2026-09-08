/**
 * TEST FRONTEND QUERY
 * 
 * Simulates the exact query that the frontend makes to verify the fix works end-to-end.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testQuery(month: number, year: number, label: string) {
  console.log(`\n========== ${label} ==========`);
  console.log(`Query: month=${month}, year=${year}`);
  
  // This is the EXACT query from attendance.controller.ts
  const records = await prisma.rawAttendanceRecord.findMany({
    where: {
      // organizationId would be added in real query
      OR: [
        { 
          attendanceMonth: month, 
          attendanceYear: year 
        },
        { 
          attendanceMonth: null 
        },
      ],
    },
    include: {
      importHistory: {
        select: {
          fileName: true,
          uploadedAt: true,
        },
      },
    },
    orderBy: [
      { createdAt: 'desc' },
    ],
  });

  console.log(`\nFound ${records.length} total records`);

  // Group by file
  const fileGroups = new Map<string, number>();
  records.forEach(r => {
    const fileName = r.importHistory?.fileName || 'UNKNOWN';
    fileGroups.set(fileName, (fileGroups.get(fileName) || 0) + 1);
  });

  console.log('\nGrouped by file:');
  for (const [fileName, count] of fileGroups.entries()) {
    console.log(`  📄 ${fileName}: ${count} records`);
  }

  // Show month/year distribution
  const monthYearGroups = new Map<string, number>();
  records.forEach(r => {
    const key = r.attendanceMonth && r.attendanceYear 
      ? `${r.attendanceMonth}/${r.attendanceYear}`
      : 'NULL';
    monthYearGroups.set(key, (monthYearGroups.get(key) || 0) + 1);
  });

  console.log('\nGrouped by month/year:');
  for (const [key, count] of monthYearGroups.entries()) {
    console.log(`  📅 ${key}: ${count} records`);
  }
}

async function main() {
  console.log('========================================');
  console.log('TESTING FRONTEND ATTENDANCE QUERIES');
  console.log('========================================');

  // Test 1: Query August 2026 (should show August file)
  await testQuery(8, 2026, 'TEST 1: August 2026');

  // Test 2: Query September 2026 (should show September files only)
  await testQuery(9, 2026, 'TEST 2: September 2026');

  // Test 3: Query October 2026 (should be empty or show October files if any)
  await testQuery(10, 2026, 'TEST 3: October 2026');

  console.log('\n========================================');
  console.log('FINAL VERIFICATION');
  console.log('========================================');

  // Count records per month
  const augustCount = await prisma.rawAttendanceRecord.count({
    where: { attendanceMonth: 8, attendanceYear: 2026 },
  });

  const septemberCount = await prisma.rawAttendanceRecord.count({
    where: { attendanceMonth: 9, attendanceYear: 2026 },
  });

  const nullCount = await prisma.rawAttendanceRecord.count({
    where: { attendanceMonth: null },
  });

  console.log(`\n✅ August 2026: ${augustCount} records`);
  console.log(`✅ September 2026: ${septemberCount} records`);
  console.log(`⚠️  NULL month: ${nullCount} records`);

  // Expected results
  console.log('\n========================================');
  console.log('EXPECTED RESULTS:');
  console.log('========================================');
  console.log('✅ August 2026 query → Shows "August_2026_Monthly_Attendance_FINAL(1) (1).xlsx" with 69 records');
  console.log('✅ September 2026 query → Shows September files only (not August file)');
  console.log('✅ NULL month records appear in ALL queries (as fallback for undetected files)');
  console.log('========================================\n');
}

main()
  .catch((e) => {
    console.error('ERROR:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
