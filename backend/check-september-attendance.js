const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSeptemberAttendance() {
  console.log('=== CHECKING SEPTEMBER 2026 ATTENDANCE ===\n');

  const orgId = '3245af42-a1a7-423c-b7d0-05e7f7046a20';

  // Get all attendance records for September 2026
  const records = await prisma.attendance.findMany({
    where: {
      organizationId: orgId,
      date: {
        gte: new Date('2026-09-01'),
        lt: new Date('2026-10-01'),
      },
    },
    include: {
      employee: {
        select: {
          employeeId: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: [
      { employee: { employeeId: 'asc' } },
      { date: 'asc' },
    ],
  });

  console.log(`Total September 2026 records: ${records.length}\n`);

  if (records.length === 0) {
    console.log('NO ATTENDANCE RECORDS FOUND FOR SEPTEMBER 2026\n');
  } else {
    // Group by employee
    const byEmployee = {};
    for (const record of records) {
      const empCode = record.employee.employeeId;
      if (!byEmployee[empCode]) {
        byEmployee[empCode] = [];
      }
      byEmployee[empCode].push(record);
    }

    // Display grouped
    for (const [empCode, empRecords] of Object.entries(byEmployee)) {
      const emp = empRecords[0].employee;
      console.log(`Employee: ${empCode} (${emp.firstName} ${emp.lastName})`);
      console.log(`UUID: ${empRecords[0].employeeId}`);
      console.log(`Records: ${empRecords.length}\n`);

      for (const rec of empRecords) {
        const dateStr = rec.date.toISOString().split('T')[0];
        const checkIn = rec.checkInTime
          ? rec.checkInTime.toISOString().substring(11, 16)
          : 'N/A';
        const checkOut = rec.checkOutTime
          ? rec.checkOutTime.toISOString().substring(11, 16)
          : 'N/A';

        console.log(
          `  ${dateStr}: ${rec.status.padEnd(10)} | Source: ${rec.source.padEnd(10)} | In: ${checkIn} | Out: ${checkOut} | Hours: ${rec.workingHours || 0}`,
        );
      }
      console.log('');
    }
  }

  // Specific check for FCS0014
  console.log('=== SPECIFIC CHECK: FCS0014 ===\n');
  const fcs14 = await prisma.employee.findFirst({
    where: { employeeId: 'FCS0014' },
    select: { id: true, employeeId: true, firstName: true, lastName: true },
  });

  if (!fcs14) {
    console.log('FCS0014 NOT FOUND IN DATABASE\n');
  } else {
    console.log(`UUID: ${fcs14.id}`);
    console.log(`Name: ${fcs14.firstName} ${fcs14.lastName}\n`);

    const fcs14Records = await prisma.attendance.findMany({
      where: {
        employeeId: fcs14.id,
        date: { gte: new Date('2026-09-01'), lt: new Date('2026-10-01') },
      },
      orderBy: { date: 'asc' },
    });

    console.log(`September 2026 records: ${fcs14Records.length}\n`);

    for (const rec of fcs14Records) {
      const dateStr = rec.date.toISOString().split('T')[0];
      const checkIn = rec.checkInTime
        ? rec.checkInTime.toISOString().substring(11, 16)
        : 'N/A';
      const checkOut = rec.checkOutTime
        ? rec.checkOutTime.toISOString().substring(11, 16)
        : 'N/A';

      console.log(
        `${dateStr}: ${rec.status.padEnd(10)} | Source: ${rec.source.padEnd(10)} | In: ${checkIn} | Out: ${checkOut}`,
      );
    }
  }

  await prisma.$disconnect();
}

checkSeptemberAttendance().catch(console.error);
