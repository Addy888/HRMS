const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Simulate the business date function
function getAttendanceBusinessDate(inputDate) {
  const sourceDate = inputDate ? new Date(inputDate) : new Date();
  
  // Convert to IST
  const istDate = new Date(sourceDate.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  
  // Extract date components
  const year = istDate.getFullYear();
  const month = istDate.getMonth();
  const day = istDate.getDate();
  
  // Create Date at midnight UTC for this calendar date
  const businessDate = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
  
  return businessDate;
}

async function finalTest() {
  console.log('='.repeat(70));
  console.log('FINAL ATTENDANCE DATE FIX TEST');
  console.log('='.repeat(70));
  
  const organizationId = '3245af42-a1a7-423c-b7d0-05e7f7046a20';
  const employeeId = 'ac1b903e-c399-4294-a790-c500bbbb2578';
  
  try {
    // Test the business date function
    console.log('\n1. BUSINESS DATE CALCULATION TEST:');
    const testTimestamps = [
      new Date('2026-08-14T04:00:00Z'), // 9:30 AM IST on Aug 14
      new Date('2026-08-13T18:30:00Z'), // 12:00 AM IST on Aug 14 (midnight)
      new Date('2026-08-13T18:29:59Z'), // 11:59:59 PM IST on Aug 13
    ];
    
    testTimestamps.forEach(ts => {
      const bd = getAttendanceBusinessDate(ts);
      console.log(`  ${ts.toISOString()} → ${bd.toISOString()} (DATE: ${bd.toISOString().split('T')[0]})`);
    });
    
    // Test with current time
    console.log('\n2. CURRENT TIME TEST:');
    const now = new Date();
    const currentBusinessDate = getAttendanceBusinessDate(now);
    console.log(`  Server time: ${now.toISOString()}`);
    console.log(`  IST time: ${now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
    console.log(`  Business date: ${currentBusinessDate.toISOString()}`);
    console.log(`  DATE value: ${currentBusinessDate.toISOString().split('T')[0]}`);
    
    // Test lookup with the business date
    console.log('\n3. DATABASE LOOKUP TEST:');
    console.log(`  Looking for attendance with business date: ${currentBusinessDate.toISOString()}`);
    
    const found = await prisma.attendance.findUnique({
      where: {
        organizationId_employeeId_date: {
          organizationId,
          employeeId,
          date: currentBusinessDate,
        },
      },
    });
    
    if (found) {
      console.log(`  ✓ FOUND record:`);
      console.log(`    ID: ${found.id}`);
      console.log(`    Date (stored): ${found.date.toISOString()}`);
      console.log(`    CheckIn: ${found.checkInTime ? 'YES' : 'NO'}`);
      console.log(`    CheckOut: ${found.checkOutTime ? 'YES' : 'NO'}`);
      console.log(`    Status: ${found.status}`);
    } else {
      console.log(`  ✗ NOT FOUND`);
    }
    
    // Show all records for this employee
    console.log('\n4. ALL ATTENDANCE RECORDS:');
    const all = await prisma.attendance.findMany({
      where: {
        employeeId,
        organizationId,
      },
      select: {
        id: true,
        date: true,
        checkInTime: true,
        checkOutTime: true,
        status: true,
      },
      orderBy: {
        date: 'desc',
      },
      take: 5,
    });
    
    console.log(`  Found ${all.length} records:`);
    all.forEach((record, index) => {
      const dateStr = record.date.toISOString().split('T')[0];
      console.log(`  ${index + 1}. ${dateStr} - CheckIn: ${record.checkInTime ? 'YES' : 'NO'}, CheckOut: ${record.checkOutTime ? 'YES' : 'NO'}, Status: ${record.status}`);
    });
    
    // Test with specific dates that were problematic
    console.log('\n5. TEST SPECIFIC DATES:');
    
    const testDates = [
      { label: '2026-08-13', date: new Date(Date.UTC(2026, 7, 13, 0, 0, 0, 0)) },
      { label: '2026-08-14', date: new Date(Date.UTC(2026, 7, 14, 0, 0, 0, 0)) },
    ];
    
    for (const test of testDates) {
      const result = await prisma.attendance.findUnique({
        where: {
          organizationId_employeeId_date: {
            organizationId,
            employeeId,
            date: test.date,
          },
        },
        select: {
          id: true,
          date: true,
          checkInTime: true,
          status: true,
        },
      });
      
      console.log(`  ${test.label}: ${result ? `FOUND (${result.status})` : 'NOT FOUND'}`);
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('EXPECTED BEHAVIOR:');
    console.log('='.repeat(70));
    console.log('✓ Database column: DATE (not DATETIME)');
    console.log('✓ Prisma type: DateTime (but uses DATE for storage)');
    console.log('✓ Business date: Date object at midnight UTC');
    console.log('✓ IST 14 Aug 2026 → UTC 2026-08-14T00:00:00.000Z → DB stores: 2026-08-14');
    console.log('✓ Lookup uses same Date object → Matches database DATE');
    console.log('✓ No more P2002 + findUnique null mismatches');
    
  } catch (error) {
    console.error('\nERROR:', error.message);
    if (error.code) console.error('Error code:', error.code);
  } finally {
    await prisma.$disconnect();
  }
}

finalTest();
