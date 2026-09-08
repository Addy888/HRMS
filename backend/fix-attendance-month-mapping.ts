/**
 * FIX ATTENDANCE MONTH MAPPING
 * 
 * This script fixes the attendanceMonth/attendanceYear mapping for existing uploaded attendance records.
 * The bug: Records were being associated with upload month instead of the actual attendance period month.
 * 
 * Example:
 * - File: August_2026_Monthly_Attendance_FINAL(1) (1).xlsx
 * - Uploaded on: September 8, 2026
 * - Current (wrong): attendanceMonth=9, attendanceYear=2026 (September)
 * - Correct: attendanceMonth=8, attendanceYear=2026 (August)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('========== FIX ATTENDANCE MONTH MAPPING ==========');
  console.log('Started at:', new Date().toISOString());
  console.log('');

  // Fetch all raw attendance records
  const records = await prisma.rawAttendanceRecord.findMany({
    include: {
      importHistory: {
        select: {
          fileName: true,
          uploadedAt: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  console.log(`Found ${records.length} raw attendance records`);
  console.log('');

  if (records.length === 0) {
    console.log('No records to fix. Exiting.');
    return;
  }

  const monthNames = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december'
  ];

  let fixedCount = 0;
  let alreadyCorrectCount = 0;
  let noFileNameCount = 0;
  let couldNotDetectCount = 0;

  for (const record of records) {
    const fileName = record.importHistory?.fileName;
    
    if (!fileName) {
      console.log(`⚠️ Record ${record.id}: No filename available`);
      noFileNameCount++;
      continue;
    }

    // Extract month/year from filename
    let detectedMonth: number | null = null;
    let detectedYear: number | null = null;

    const lowerFileName = fileName.toLowerCase();

    // Strategy 1: Find month name in filename
    for (let i = 0; i < monthNames.length; i++) {
      if (lowerFileName.includes(monthNames[i])) {
        detectedMonth = i + 1; // 1-12
        break;
      }
    }

    // Strategy 2: Find year in filename (pattern: 2024, 2025, 2026, etc.)
    const yearMatch = fileName.match(/20\d{2}/);
    if (yearMatch) {
      detectedYear = parseInt(yearMatch[0]);
    }

    // Check if detection succeeded
    if (detectedMonth === null || detectedYear === null) {
      console.log(`⚠️ Record ${record.id}: Could not detect month/year from filename "${fileName}"`);
      console.log(`   Detected: month=${detectedMonth}, year=${detectedYear}`);
      couldNotDetectCount++;
      continue;
    }

    // Check if already correct
    if (record.attendanceMonth === detectedMonth && record.attendanceYear === detectedYear) {
      console.log(`✅ Record ${record.id}: Already correct (${monthNames[detectedMonth - 1]} ${detectedYear})`);
      alreadyCorrectCount++;
      continue;
    }

    // Fix the record
    console.log(`🔧 Fixing Record ${record.id}:`);
    console.log(`   File: ${fileName}`);
    console.log(`   OLD: attendanceMonth=${record.attendanceMonth}, attendanceYear=${record.attendanceYear}`);
    console.log(`   NEW: attendanceMonth=${detectedMonth}, attendanceYear=${detectedYear}`);

    await prisma.rawAttendanceRecord.update({
      where: { id: record.id },
      data: {
        attendanceMonth: detectedMonth,
        attendanceYear: detectedYear,
      },
    });

    console.log(`   ✅ Updated successfully`);
    console.log('');
    fixedCount++;
  }

  console.log('');
  console.log('========== SUMMARY ==========');
  console.log(`Total records: ${records.length}`);
  console.log(`Fixed: ${fixedCount}`);
  console.log(`Already correct: ${alreadyCorrectCount}`);
  console.log(`No filename: ${noFileNameCount}`);
  console.log(`Could not detect: ${couldNotDetectCount}`);
  console.log('');
  console.log('Completed at:', new Date().toISOString());
  console.log('========================================');
}

main()
  .catch((e) => {
    console.error('ERROR:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
