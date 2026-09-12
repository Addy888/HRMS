const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkFCS0014August() {
  try {
    const employeeUUID = '9f302c43-ba62-4b69-af2e-c6e19a638eec';
    
    const count = await prisma.rawAttendanceRecord.count({
      where: {
        employeeId: employeeUUID,
        attendanceMonth: 8,
        attendanceYear: 2026,
      }
    });
    
    console.log(`FCS0014 (aditechstudio@gmail.com) August 2026 records: ${count}`);
    
    if (count > 0) {
      console.log('\n✅ Records exist! The frontend fix should now display them.');
      console.log('\nTo test:');
      console.log('1. Log in as: aditechstudio@gmail.com');
      console.log('2. Go to: Employee Portal → Attendance');
      console.log('3. Select: August 2026');
      console.log('4. The imported attendance should now appear.');
    } else {
      console.log('\n❌ No August records for FCS0014');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkFCS0014August();
