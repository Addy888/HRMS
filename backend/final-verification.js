const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
  console.log('🔍 FINAL VERIFICATION - CHECK IF FIX WORKED\n');
  
  const sumaiyya = await prisma.employee.findFirst({
    where: { employeeId: 'FCS-HR-ADMIN-001' },
    select: { id: true, employeeId: true, firstName: true, lastName: true, organizationId: true }
  });
  
  if (!sumaiyya) {
    console.log('❌ Sumaiyya Tamboli employee not found');
    await prisma.$disconnect();
    return;
  }
  
  console.log(`📊 EMPLOYEE: ${sumaiyya.employeeId} (${sumaiyya.firstName} ${sumaiyya.lastName})`);
  console.log(`   UUID: ${sumaiyya.id}`);
  console.log(`   Org ID: ${sumaiyya.organizationId}\n`);
  
  // Check September 2026 attendance
  const septStart = new Date('2026-09-01T00:00:00.000Z');
  const septEnd = new Date('2026-09-30T23:59:59.999Z');
  
  const attendance = await prisma.attendance.findMany({
    where: {
      employeeId: sumaiyya.id,
      date: { gte: septStart, lte: septEnd }
    },
    orderBy: { date: 'asc' }
  });
  
  console.log(`📅 SEPTEMBER 2026 ATTENDANCE: ${attendance.length} records\n`);
  
  if (attendance.length > 0) {
    console.log('✅ SUCCESS - Attendance records found!\n');
    console.log('Sample records (first 5):');
    attendance.slice(0, 5).forEach(a => {
      const dateStr = a.date.toISOString().split('T')[0];
      const checkIn = a.checkInTime ? new Date(a.checkInTime).toISOString().substring(11, 16) : 'N/A';
      const checkOut = a.checkOutTime ? new Date(a.checkOutTime).toISOString().substring(11, 16) : 'N/A';
      console.log(`  ${dateStr} | ${a.status.padEnd(10)} | ${checkIn} - ${checkOut} | Hours: ${a.workingHours || 0} | Source: ${a.source}`);
    });
  } else {
    console.log('❌ NO ATTENDANCE RECORDS - Employee calendar will be BLANK');
    console.log('\nPOSSIBLE CAUSES:');
    console.log('1. No Excel file uploaded for this employee');
    console.log('2. Employee name in Excel does not match "Sumaiyya Tamboli"');
    console.log('3. Excel upload failed or incomplete');
    console.log('\nNEXT STEPS:');
    console.log('1. Upload a NEW Excel file with "Sumaiyya Tamboli" in the Name column');
    console.log('2. Ensure filename contains "september" and "2026"');
    console.log('3. Check Import History after upload');
  }
  
  await prisma.$disconnect();
}

verify().catch(console.error);
