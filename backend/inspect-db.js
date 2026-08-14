const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function inspectDatabase() {
  console.log('='.repeat(60));
  console.log('STEP 2: INSPECT ACTUAL DATABASE');
  console.log('='.repeat(60));
  
  try {
    // Get table structure
    console.log('\n1. ATTENDANCE TABLE STRUCTURE:');
    const result = await prisma.$queryRaw`
      SHOW CREATE TABLE Attendance
    `;
    console.log(JSON.stringify(result, null, 2));
    
    // Get column details
    console.log('\n2. ATTENDANCE COLUMNS:');
    const columns = await prisma.$queryRaw`
      DESCRIBE Attendance
    `;
    console.log(JSON.stringify(columns, null, 2));
    
    console.log('\n='.repeat(60));
    console.log('STEP 3: FIND EXISTING CONFLICTING RECORD');
    console.log('='.repeat(60));
    
    const organizationId = '3245af42-a1a7-423c-b7d0-05e7f7046a20';
    const employeeId = 'ac1b903e-c399-4294-a790-c500bbbb2578';
    
    console.log('\nSearching for employee:', employeeId);
    console.log('Organization:', organizationId);
    
    // Find all attendance records for this employee
    const allRecords = await prisma.$queryRaw`
      SELECT 
        id,
        organizationId,
        employeeId,
        date,
        checkInTime,
        checkOutTime,
        status,
        createdAt
      FROM Attendance
      WHERE employeeId = ${employeeId}
        AND organizationId = ${organizationId}
      ORDER BY date DESC
      LIMIT 10
    `;
    
    console.log('\nAll attendance records:');
    console.log(JSON.stringify(allRecords, null, 2));
    
    // Check around August 13-14, 2026
    console.log('\n3. RECORDS AROUND 2026-08-13/14:');
    const augustRecords = await prisma.$queryRaw`
      SELECT 
        id,
        date,
        checkInTime,
        status
      FROM Attendance
      WHERE employeeId = ${employeeId}
        AND date >= '2026-08-12'
        AND date <= '2026-08-15'
      ORDER BY date
    `;
    
    console.log(JSON.stringify(augustRecords, null, 2));
    
    // Test the actual query that's failing
    console.log('\n4. TEST LOOKUP WITH DATETIME:');
    const testDate = new Date('2026-08-13T18:30:00.000Z');
    console.log('Looking up with date:', testDate.toISOString());
    
    const foundWithDateTime = await prisma.attendance.findUnique({
      where: {
        organizationId_employeeId_date: {
          organizationId,
          employeeId,
          date: testDate,
        },
      },
    });
    
    console.log('Found with DateTime lookup:', foundWithDateTime ? 'YES' : 'NULL');
    if (foundWithDateTime) {
      console.log('Record:', JSON.stringify(foundWithDateTime, null, 2));
    }
    
    // Test with date string
    console.log('\n5. TEST LOOKUP WITH DATE STRING:');
    const foundWithRaw = await prisma.$queryRaw`
      SELECT *
      FROM Attendance
      WHERE organizationId = ${organizationId}
        AND employeeId = ${employeeId}
        AND date = '2026-08-13'
      LIMIT 1
    `;
    
    console.log('Found with raw date string:', foundWithRaw.length > 0 ? 'YES' : 'NO');
    if (foundWithRaw.length > 0) {
      console.log('Record:', JSON.stringify(foundWithRaw[0], null, 2));
    }
    
    // Test with date string 2026-08-14
    console.log('\n6. TEST LOOKUP WITH 2026-08-14:');
    const foundAug14 = await prisma.$queryRaw`
      SELECT *
      FROM Attendance
      WHERE organizationId = ${organizationId}
        AND employeeId = ${employeeId}
        AND date = '2026-08-14'
      LIMIT 1
    `;
    
    console.log('Found with 2026-08-14:', foundAug14.length > 0 ? 'YES' : 'NO');
    if (foundAug14.length > 0) {
      console.log('Record:', JSON.stringify(foundAug14[0], null, 2));
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

inspectDatabase();
