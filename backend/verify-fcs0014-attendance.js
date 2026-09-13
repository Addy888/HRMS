const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  const orgId = '3245af42-a1a7-423c-b7d0-05e7f7046a20';

  try {
    const employee = await prisma.employee.findFirst({
      where: { organizationId: orgId, employeeId: 'FCS0014' },
      select: { id: true, employeeId: true, firstName: true, lastName: true },
    });

    console.log('EMPLOYEE');
    console.log(JSON.stringify(employee, null, 2));

    if (!employee) {
      console.log('NO_EMPLOYEE_FOUND');
      return;
    }

    const rows = await prisma.attendance.findMany({
      where: {
        organizationId: orgId,
        employeeId: employee.id,
        date: { gte: new Date('2026-09-01T00:00:00Z'), lt: new Date('2026-10-01T00:00:00Z') },
      },
      select: {
        id: true,
        employeeId: true,
        date: true,
        status: true,
        checkInTime: true,
        checkOutTime: true,
        source: true,
      },
      orderBy: { date: 'asc' },
    });

    console.log('COUNT=' + rows.length);
    for (const row of rows) {
      console.log(JSON.stringify({
        id: row.id,
        date: row.date.toISOString().split('T')[0],
        status: row.status,
        checkInTime: row.checkInTime ? row.checkInTime.toISOString() : null,
        checkOutTime: row.checkOutTime ? row.checkOutTime.toISOString() : null,
        source: row.source,
      }));
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
