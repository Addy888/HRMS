/**
 * VERIFY ATTENDANCE MONTH FIX
 * 
 * This script verifies that the attendance month/year mapping is correct.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('========== VERIFY ATTENDANCE MONTH FIX ==========');
  console.log('Verification started at:', new Date().toISOString());
  console.log('');

  // Get all unique import history files
  const importHistories = await prisma.attendanceImportHistory.findMany({
    select: {
      id: true,
      fileName: true,
      uploadedAt: true,
    },
    orderBy: {
      uploadedAt: 'desc',
    },
  });

  console.log(`Found ${importHistories.length} import histories`);
  console.log('');

  for (const history of importHistories) {
    console.log(`📁 File: ${history.fileName}`);
    console.log(`   Uploaded: ${history.uploadedAt.toISOString()}`);

    // Get records for this import
    const records = await prisma.rawAttendanceRecord.findMany({
      where: {
        importHistoryId: history.id,
      },
      select: {
        id: true,
        attendanceMonth: true,
        attendanceYear: true,
        originalIdentifier: true,
      },
      take: 5, // Sample first 5 records
    });

    if (records.length === 0) {
      console.log('   ⚠️ No records found for this import');
      continue;
    }

    // Check if all records have the same month/year
    const uniqueMonths = new Set(records.map(r => r.attendanceMonth));
    const uniqueYears = new Set(records.map(r => r.attendanceYear));

    console.log(`   Records: ${records.length} (showing first 5)`);
    console.log(`   Attendance Month(s): ${Array.from(uniqueMonths).join(', ')}`);
    console.log(`   Attendance Year(s): ${Array.from(uniqueYears).join(', ')}`);

    // Extract expected month/year from filename
    const monthNames = [
      'january', 'february', 'march', 'april', 'may', 'june',
      'july', 'august', 'september', 'october', 'november', 'december'
    ];
    
    const lowerFileName = history.fileName.toLowerCase();
    let expectedMonth: number | null = null;
    let expectedYear: number | null = null;

    for (let i = 0; i < monthNames.length; i++) {
      if (lowerFileName.includes(monthNames[i])) {
        expectedMonth = i + 1;
        break;
      }
    }

    const yearMatch = history.fileName.match(/20\d{2}/);
    if (yearMatch) {
      expectedYear = parseInt(yearMatch[0]);
    }

    if (expectedMonth !== null && expectedYear !== null) {
      console.log(`   Expected: ${monthNames[expectedMonth - 1]} ${expectedYear} (month=${expectedMonth}, year=${expectedYear})`);
      
      // Verify
      const allCorrect = records.every(
        r => r.attendanceMonth === expectedMonth && r.attendanceYear === expectedYear
      );

      if (allCorrect) {
        console.log('   ✅ All records have correct month/year mapping');
      } else {
        console.log('   ❌ Some records have incorrect month/year mapping');
        records.forEach(r => {
          if (r.attendanceMonth !== expectedMonth || r.attendanceYear !== expectedYear) {
            console.log(`      ❌ Record ${r.id}: month=${r.attendanceMonth}, year=${r.attendanceYear}`);
          }
        });
      }
    } else {
      console.log('   ⚠️ Could not determine expected month/year from filename');
    }

    console.log('');
  }

  // Summary by month/year
  console.log('========== SUMMARY BY MONTH/YEAR ==========');
  const monthYearGroups = await prisma.rawAttendanceRecord.groupBy({
    by: ['attendanceMonth', 'attendanceYear'],
    _count: {
      id: true,
    },
    orderBy: [
      { attendanceYear: 'desc' },
      { attendanceMonth: 'desc' },
    ],
  });

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  for (const group of monthYearGroups) {
    const monthName = group.attendanceMonth ? monthNames[group.attendanceMonth - 1] : 'NULL';
    const year = group.attendanceYear || 'NULL';
    console.log(`${monthName} ${year}: ${group._count.id} records`);
  }

  console.log('');
  console.log('Verification completed at:', new Date().toISOString());
  console.log('==========================================');
}

main()
  .catch((e) => {
    console.error('ERROR:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
