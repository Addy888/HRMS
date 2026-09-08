/**
 * Test script to verify uploaded attendance data flow
 * Run: npx ts-node test-uploaded-attendance.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 CHECKING UPLOADED ATTENDANCE DATA FLOW\n');
  console.log('='.repeat(70));

  // Step 1: Find the test employee
  console.log('\n📋 STEP 1: Finding employee with email test123@gmail.com\n');
  
  const user = await prisma.user.findUnique({
    where: { email: 'test123@gmail.com' },
    include: {
      employee: {
        include: {
          organization: true,
          department: true,
        },
      },
      role: true,
    },
  });

  if (!user) {
    console.log('❌ ERROR: User test123@gmail.com not found!');
    console.log('   Please verify this user exists in the database.');
    return;
  }

  console.log('✅ Found user:');
  console.log(`   Email: ${user.email}`);
  console.log(`   Role: ${user.role.name}`);
  console.log(`   Has employee profile: ${!!user.employee}`);

  if (!user.employee) {
    console.log('\n❌ ERROR: User has no employee profile!');
    console.log('   This user needs an employee record to see uploaded attendance.');
    return;
  }

  const employee = user.employee;
  console.log(`\n✅ Found employee:`);
  console.log(`   Employee ID: ${employee.employeeId}`);
  console.log(`   Name: ${employee.firstName} ${employee.lastName}`);
  console.log(`   Organization: ${employee.organization.name}`);
  console.log(`   Department: ${employee.department?.name || 'None'}`);
  console.log(`   Employee UUID: ${employee.id}`);

  // Step 2: Check for uploaded attendance records
  console.log('\n' + '='.repeat(70));
  console.log('\n📊 STEP 2: Checking for uploaded attendance records\n');

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  console.log(`   Current month: ${currentMonth}`);
  console.log(`   Current year: ${currentYear}`);

  const rawRecords = await prisma.rawAttendanceRecord.findMany({
    where: {
      employeeId: employee.id,
      isMatched: true,
      OR: [
        { 
          attendanceMonth: currentMonth, 
          attendanceYear: currentYear 
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
          originalColumns: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  console.log(`\n✅ Found ${rawRecords.length} raw attendance records for this employee`);

  if (rawRecords.length === 0) {
    console.log('\n⚠️  No uploaded attendance found for this employee!');
    console.log('\n   Possible reasons:');
    console.log('   1. HR has not uploaded any Excel attendance file yet');
    console.log('   2. The uploaded Excel does not contain this employee');
    console.log('   3. Employee matching failed during import');
    
    // Check ALL raw records for this organization
    console.log('\n   Checking ALL raw attendance records in organization...\n');
    
    const allOrgRecords = await prisma.rawAttendanceRecord.findMany({
      where: {
        organizationId: employee.organizationId,
      },
      include: {
        employee: {
          select: {
            employeeId: true,
            firstName: true,
            lastName: true,
          },
        },
        importHistory: {
          select: {
            fileName: true,
            uploadedAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    console.log(`   Total records in organization: ${allOrgRecords.length}`);
    
    if (allOrgRecords.length > 0) {
      console.log('\n   Recent upload records:');
      allOrgRecords.slice(0, 5).forEach((record, i) => {
        console.log(`\n   Record ${i + 1}:`);
        console.log(`     ID: ${record.id}`);
        console.log(`     Original Identifier: ${record.originalIdentifier}`);
        console.log(`     Original Name: ${record.originalName}`);
        console.log(`     Matched: ${record.isMatched}`);
        console.log(`     Employee: ${record.employee?.employeeId || 'NOT MATCHED'} - ${record.employee?.firstName || ''} ${record.employee?.lastName || ''}`);
        console.log(`     File: ${record.importHistory?.fileName || 'N/A'}`);
        console.log(`     Month/Year: ${record.attendanceMonth || 'NULL'}/${record.attendanceYear || 'NULL'}`);
        
        try {
          const data = JSON.parse(record.rawData);
          const columns = Object.keys(data);
          console.log(`     Excel columns (first 5): ${columns.slice(0, 5).join(', ')}`);
        } catch (e) {
          console.log(`     Raw data parse error`);
        }
      });

      console.log('\n   🔧 ACTION REQUIRED:');
      console.log(`   The employee identifier in Excel must match: ${employee.employeeId}`);
      console.log(`   Check if Excel contains "Agent ID", "Employee ID", or similar column`);
      console.log(`   with value: ${employee.employeeId}`);
    } else {
      console.log('\n   ❌ No attendance has been uploaded by HR yet!');
      console.log('   Action: HR needs to upload an Excel file via HR -> Attendance -> Upload Excel');
    }
  } else {
    console.log('\n✅ SUCCESS! Found uploaded attendance data:');
    
    rawRecords.forEach((record, i) => {
      console.log(`\n   Record ${i + 1}:`);
      console.log(`     ID: ${record.id}`);
      console.log(`     File: ${record.importHistory?.fileName || 'N/A'}`);
      console.log(`     Uploaded: ${record.importHistory?.uploadedAt || 'N/A'}`);
      console.log(`     Month/Year: ${record.attendanceMonth}/${record.attendanceYear}`);
      
      try {
        const data = JSON.parse(record.rawData);
        const columns = Object.keys(data);
        console.log(`     Total columns: ${columns.length}`);
        console.log(`     Column names (first 10):`);
        columns.slice(0, 10).forEach(col => {
          console.log(`       - ${col}: ${data[col]}`);
        });
      } catch (e) {
        console.log(`     ❌ Error parsing raw data: ${e.message}`);
      }
    });

    console.log('\n✅ Data should be visible in Employee Portal!');
    console.log('   If not visible, check:');
    console.log('   1. Frontend server is running (npm run dev in frontend folder)');
    console.log('   2. Backend server is running (npm run start:dev in backend folder)');
    console.log('   3. Browser console for API errors (F12 -> Console tab)');
    console.log('   4. Network tab for API response (F12 -> Network tab)');
  }

  console.log('\n' + '='.repeat(70));
  console.log('\n✅ Test complete!');
}

main()
  .catch((e) => {
    console.error('❌ Test failed:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
