import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyWeekOffFix() {
  console.log('🔍 Verifying Week Off Configuration...\n');

  try {
    // Check WeekOff table
    const weekOffs = await prisma.weekOff.findMany({
      where: { isActive: true },
    });

    console.log('✅ Active Week Offs:');
    weekOffs.forEach((wo) => {
      console.log(`   - ${wo.dayOfWeek} (Effective from: ${wo.effectiveFrom})`);
    });

    if (weekOffs.length === 1 && weekOffs[0].dayOfWeek === 'MONDAY') {
      console.log('✅ CORRECT: Only MONDAY is set as week off\n');
    } else {
      console.log('❌ ERROR: Week off configuration is incorrect\n');
    }

    // Check for any Sunday WEEK_OFF attendance records with checkInTime
    const sundayWeekOffRecords = await prisma.attendance.findMany({
      where: {
        status: 'WEEK_OFF',
        checkInTime: { not: null },
      },
      select: {
        id: true,
        date: true,
        status: true,
        checkInTime: true,
        checkOutTime: true,
        employee: {
          select: {
            employeeId: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { date: 'desc' },
      take: 10,
    });

    console.log(`📊 WEEK_OFF records with check-in time: ${sundayWeekOffRecords.length}`);
    
    if (sundayWeekOffRecords.length > 0) {
      console.log('❌ ERROR: Found WEEK_OFF records with check-in times:');
      sundayWeekOffRecords.forEach((record) => {
        const dayOfWeek = new Date(record.date).getDay(); // 0 = Sunday, 1 = Monday
        const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek];
        console.log(`   - ${record.employee.employeeId} ${record.employee.firstName} ${record.employee.lastName}`);
        console.log(`     Date: ${record.date.toISOString().split('T')[0]} (${dayName})`);
        console.log(`     Status: ${record.status}`);
        console.log(`     Check-in: ${record.checkInTime?.toISOString()}`);
        console.log(`     Check-out: ${record.checkOutTime?.toISOString() || 'N/A'}`);
        console.log('');
      });
    } else {
      console.log('✅ CORRECT: No WEEK_OFF records with check-in times\n');
    }

    // Check all Sunday attendance records
    console.log('📅 Checking recent Sunday attendance records...');
    const sundayRecords = await prisma.$queryRaw`
      SELECT 
        a.id,
        a.date,
        a.status,
        a.checkInTime,
        a.checkOutTime,
        e.employeeId,
        e.firstName,
        e.lastName
      FROM Attendance a
      JOIN Employee e ON a.employeeId = e.id
      WHERE DAYOFWEEK(CONVERT_TZ(a.date, '+00:00', '+05:30')) = 1
      ORDER BY a.date DESC
      LIMIT 10
    ` as any[];

    if (sundayRecords.length > 0) {
      console.log(`Found ${sundayRecords.length} Sunday records:`);
      sundayRecords.forEach((record: any) => {
        console.log(`   - ${record.employeeId} ${record.firstName} ${record.lastName}`);
        console.log(`     Date: ${record.date.toISOString().split('T')[0]}`);
        console.log(`     Status: ${record.status}`);
        console.log(`     Check-in: ${record.checkInTime?.toISOString() || 'N/A'}`);
        console.log(`     Check-out: ${record.checkOutTime?.toISOString() || 'N/A'}`);
        console.log('');
      });
    } else {
      console.log('   No Sunday attendance records found\n');
    }

    // Check Monday WEEK_OFF records
    console.log('📅 Checking recent Monday WEEK_OFF records...');
    const mondayWeekOffRecords = await prisma.$queryRaw`
      SELECT 
        a.id,
        a.date,
        a.status,
        a.checkInTime,
        a.checkOutTime,
        e.employeeId,
        e.firstName,
        e.lastName
      FROM Attendance a
      JOIN Employee e ON a.employeeId = e.id
      WHERE DAYOFWEEK(CONVERT_TZ(a.date, '+00:00', '+05:30')) = 2
        AND a.status = 'WEEK_OFF'
      ORDER BY a.date DESC
      LIMIT 5
    ` as any[];

    if (mondayWeekOffRecords.length > 0) {
      console.log(`✅ Found ${mondayWeekOffRecords.length} Monday WEEK_OFF records (correct):`);
      mondayWeekOffRecords.forEach((record: any) => {
        console.log(`   - ${record.employeeId}: ${record.date.toISOString().split('T')[0]} - WEEK_OFF`);
      });
    } else {
      console.log('   No Monday WEEK_OFF records found yet\n');
    }

    console.log('\n✅ Verification complete!');
  } catch (error) {
    console.error('❌ Error during verification:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyWeekOffFix();
