const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDateFix() {
  console.log('='.repeat(70));
  console.log('ATTENDANCE DATE FIX - VERIFICATION TEST');
  console.log('='.repeat(70));
  
  const organizationId = '3245af42-a1a7-423c-b7d0-05e7f7046a20';
  const employeeId = 'ac1b903e-c399-4294-a790-c500bbbb2578';
  
  try {
    // Test 1: Lookup with DATE string
    console.log('\nTest 1: Lookup with DATE string "2026-08-14"');
    const found1 = await prisma.attendance.findUnique({
      where: {
        organizationId_employeeId_date: {
          organizationId,
          employeeId,
          date: '2026-08-14',
        },
      },
    });
    console.log('Result:', found1 ? `FOUND (id: ${found1.id})` : 'NOT FOUND');
    
    // Test 2: Lookup with existing date "2026-08-13"
    console.log('\nTest 2: Lookup with DATE string "2026-08-13"');
    const found2 = await prisma.attendance.findUnique({
      where: {
        organizationId_employeeId_date: {
          organizationId,
          employeeId,
          date: '2026-08-13',
        },
      },
    });
    console.log('Result:', found2 ? `FOUND (id: ${found2.id}, checkIn: ${found2.checkInTime})` : 'NOT FOUND');
    
    // Test 3: Show all records for this employee
    console.log('\nTest 3: All attendance records for this employee');
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
    });
    
    console.log(`Found ${all.length} records:`);
    all.forEach((record, index) => {
      console.log(`${index + 1}. Date: ${record.date.toISOString().split('T')[0]}, CheckIn: ${record.checkInTime ? 'YES' : 'NO'}, CheckOut: ${record.checkOutTime ? 'YES' : 'NO'}, Status: ${record.status}`);
    });
    
    // Test 4: Test the business date function
    console.log('\nTest 4: Business date calculation');
    const testDates = [
      new Date('2026-08-14T04:00:00Z'), // 9:30 AM IST
      new Date('2026-08-14T10:30:00Z'), // 4 PM IST
      new Date('2026-08-13T18:30:00Z'), // 12:00 AM IST (midnight of Aug 14)
      new Date('2026-08-13T18:29:59Z'), // 11:59:59 PM IST (Aug 13)
    ];
    
    // Simulate the business date function
    function getBusinessDate(date) {
      const options = { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' };
      const parts = new Intl.DateTimeFormat('en-CA', options).format(date);
      return parts; // Returns YYYY-MM-DD
    }
    
    testDates.forEach(date => {
      const businessDate = getBusinessDate(date);
      console.log(`  ${date.toISOString()} → ${businessDate}`);
    });
    
    console.log('\n' + '='.repeat(70));
    console.log('EXPECTED BEHAVIOR');
    console.log('='.repeat(70));
    console.log('✓ Date field type: DATE (not DATETIME)');
    console.log('✓ Storage format: "YYYY-MM-DD" string');
    console.log('✓ Lookup uses: Same DATE string');
    console.log('✓ 2026-08-14T04:00:00Z (9:30 AM IST) → Business date: 2026-08-14');
    console.log('✓ 2026-08-13T18:30:00Z (12:00 AM IST Aug 14) → Business date: 2026-08-14');
    console.log('✓ No more P2002 + findUnique null mismatches');
    
  } catch (error) {
    console.error('\nERROR:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

testDateFix();
