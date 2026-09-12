const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const matched = await prisma.rawAttendanceRecord.findMany({
    where: { isMatched: true },
    select: { originalName: true, employeeId: true, attendanceMonth: true, attendanceYear: true }
  });
  
  console.log(`✅ Found ${matched.length} matched raw records\n`);
  
  for (const raw of matched) {
    console.log(`\n📋 ${raw.originalName} | UUID: ${raw.employeeId} | Period: ${raw.attendanceYear}-${String(raw.attendanceMonth).padStart(2, '0')}`);
    
    // Check if Attendance records exist for this employee in this period
    const startDate = new Date(Date.UTC(raw.attendanceYear, raw.attendanceMonth - 1, 1));
    const endDate = new Date(Date.UTC(raw.attendanceYear, raw.attendanceMonth, 0, 23, 59, 59));
    
    const attendances = await prisma.attendance.findMany({
      where: {
        employeeId: raw.employeeId,
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: { date: 'asc' },
      take: 5
    });
    
    console.log(`   Attendance records: ${attendances.length}`);
    if (attendances.length > 0) {
      attendances.forEach(a => {
        const dateStr = a.date.toISOString().split('T')[0];
        const checkIn = a.checkInTime ? new Date(a.checkInTime).toISOString().substring(11, 16) : 'N/A';
        const checkOut = a.checkOutTime ? new Date(a.checkOutTime).toISOString().substring(11, 16) : 'N/A';
        console.log(`     ${dateStr} | ${a.status} | ${checkIn}-${checkOut} | Source: ${a.source}`);
      });
    } else {
      console.log(`     ❌ NO ATTENDANCE RECORDS CREATED`);
    }
  }
  
  await prisma.$disconnect();
}

check().catch(console.error);
