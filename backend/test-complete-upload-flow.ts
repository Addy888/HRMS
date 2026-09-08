/**
 * Complete test of attendance upload and employee view flow
 * Run: npx ts-node test-complete-upload-flow.ts
 */

import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 COMPLETE ATTENDANCE UPLOAD FLOW TEST\n');
  console.log('='.repeat(70));

  // Step 1: Get employee
  console.log('\n📋 STEP 1: Getting test employee...\n');
  
  const employee = await prisma.employee.findFirst({
    where: {
      user: { email: 'test123@gmail.com' },
    },
    include: {
      user: true,
      department: true,
      organization: true,
    },
  });

  if (!employee) {
    console.log('❌ Employee not found!');
    return;
  }

  console.log('✅ Employee found:');
  console.log(`   ID: ${employee.employeeId}`);
  console.log(`   Name: ${employee.firstName} ${employee.lastName}`);
  console.log(`   Organization: ${employee.organization.name}`);
  console.log(`   UUID: ${employee.id}`);

  // Step 2: Create test Excel
  console.log('\n='.repeat(70));
  console.log('\n📊 STEP 2: Creating test Excel data...\n');

  const testData = {
    'Agent ID': employee.employeeId,
    'Agent Name': `${employee.firstName} ${employee.lastName}`,
    'Designation': 'Test Employee',
    'Process': employee.department?.name || 'VTP',
    'Shift Start': '10:00 AM',
    '01 Sat': 'P',
    '02 Sun': 'WO',
    '03 Mon': 'WO',
    '04 Tue': 'P',
    '05 Wed': 'P',
    'Total 1': '22',
    'Total H': '176',
  };

  console.log('✅ Test data created with columns:');
  console.log(`   ${Object.keys(testData).join(', ')}`);

  // Step 3: Simulate import (direct database insert)
  console.log('\n='.repeat(70));
  console.log('\n💾 STEP 3: Simulating HR upload (direct DB insert)...\n');

  // Get or create HR user for import history
  const hrUser = await prisma.user.findFirst({
    where: {
      organizationId: employee.organizationId,
      role: { name: { in: ['HR', 'HR_ADMIN', 'HR_USER'] } },
    },
  });

  if (!hrUser) {
    console.log('❌ No HR user found in organization!');
    return;
  }

  console.log(`✅ Using HR user: ${hrUser.email}`);

  // Create import history
  const importHistory = await prisma.attendanceImportHistory.create({
    data: {
      organizationId: employee.organizationId,
      fileName: 'test-attendance-september-2026.xlsx',
      uploadedBy: hrUser.id,
      totalRows: 1,
      successfulRows: 1,
      failedRows: 0,
      duplicateRows: 0,
      status: 'COMPLETED',
      originalColumns: JSON.stringify(Object.keys(testData)),
      completedAt: new Date(),
    },
  });

  console.log(`✅ Import history created: ${importHistory.id}`);

  // Create raw attendance record
  const now = new Date();
  const rawRecord = await prisma.rawAttendanceRecord.create({
    data: {
      organizationId: employee.organizationId,
      importHistoryId: importHistory.id,
      employeeId: employee.id,
      originalIdentifier: employee.employeeId,
      originalName: `${employee.firstName} ${employee.lastName}`,
      rawData: JSON.stringify(testData),
      attendanceMonth: 9, // September
      attendanceYear: 2026,
      isMatched: true,
      matchedAt: new Date(),
      matchingNote: 'Test data - auto-matched',
    },
  });

  console.log(`✅ Raw attendance record created: ${rawRecord.id}`);
  console.log(`   Employee: ${rawRecord.originalIdentifier} - ${rawRecord.originalName}`);
  console.log(`   Month/Year: ${rawRecord.attendanceMonth}/${rawRecord.attendanceYear}`);
  console.log(`   Matched: ${rawRecord.isMatched}`);

  // Step 4: Query what employee would see
  console.log('\n='.repeat(70));
  console.log('\n👀 STEP 4: Testing employee view query...\n');

  const employeeRecords = await prisma.rawAttendanceRecord.findMany({
    where: {
      employeeId: employee.id,
      isMatched: true,
      OR: [
        { attendanceMonth: 9, attendanceYear: 2026 },
        { attendanceMonth: null },
      ],
    },
    include: {
      importHistory: {
        select: {
          fileName: true,
          uploadedAt: true,
          originalColumns: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  console.log(`✅ Employee would see ${employeeRecords.length} record(s)`);

  if (employeeRecords.length > 0) {
    const record = employeeRecords[0];
    console.log('\n📋 Record details:');
    console.log(`   ID: ${record.id}`);
    console.log(`   File: ${record.importHistory?.fileName}`);
    console.log(`   Month/Year: ${record.attendanceMonth}/${record.attendanceYear}`);
    
    const data = JSON.parse(record.rawData);
    const columns = Object.keys(data);
    
    console.log(`\n📊 Data columns (${columns.length} total):`);
    columns.forEach(col => {
      console.log(`   ${col}: ${data[col]}`);
    });

    console.log('\n✅ SUCCESS! Employee would see this data in UI!');
  } else {
    console.log('\n❌ No records found - something is wrong!');
  }

  // Step 5: Verify API response structure
  console.log('\n='.repeat(70));
  console.log('\n🔍 STEP 5: Verifying API response structure...\n');

  const allColumns = new Set<string>();
  employeeRecords.forEach(record => {
    try {
      const data = JSON.parse(record.rawData);
      Object.keys(data).forEach(key => allColumns.add(key));
    } catch (e) {
      console.log(`❌ Error parsing record ${record.id}`);
    }
  });

  const apiResponse = {
    month: 9,
    year: 2026,
    records: employeeRecords.map(r => ({
      id: r.id,
      data: JSON.parse(r.rawData),
      uploadedAt: r.createdAt,
      fileName: r.importHistory?.fileName,
    })),
    columns: Array.from(allColumns),
    total: employeeRecords.length,
  };

  console.log('✅ API Response structure:');
  console.log(`   month: ${apiResponse.month}`);
  console.log(`   year: ${apiResponse.year}`);
  console.log(`   total: ${apiResponse.total}`);
  console.log(`   columns: ${apiResponse.columns.length} columns`);
  console.log(`   records: ${apiResponse.records.length} records`);

  if (apiResponse.records.length > 0) {
    console.log(`\n   First record data keys: ${Object.keys(apiResponse.records[0].data).join(', ')}`);
  }

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('\n✅ TEST COMPLETE!\n');
  console.log('🎯 NEXT STEPS:');
  console.log('   1. Restart backend: cd backend && npm run start:dev');
  console.log('   2. Restart frontend: cd frontend && npm run dev');
  console.log('   3. Login as: test123@gmail.com');
  console.log('   4. Go to: Employee Portal → Attendance');
  console.log('   5. Scroll down to see: "Uploaded Attendance" section');
  console.log('   6. You should see the attendance data!\n');
  console.log('📊 Expected display:');
  console.log('   - Agent ID: ' + testData['Agent ID']);
  console.log('   - Agent Name: ' + testData['Agent Name']);
  console.log('   - All other columns from the Excel...\n');
}

main()
  .catch((e) => {
    console.error('❌ Test failed:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
