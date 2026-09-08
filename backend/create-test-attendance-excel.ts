/**
 * Create a test Excel file for attendance upload
 * Run: npx ts-node create-test-attendance-excel.ts
 */

import * as XLSX from 'xlsx';
import * as fs from 'fs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('📊 Creating test attendance Excel file\n');

  // Get the test employee
  const employee = await prisma.employee.findFirst({
    where: {
      user: {
        email: 'test123@gmail.com',
      },
    },
    include: {
      user: true,
      department: true,
    },
  });

  if (!employee) {
    console.log('❌ Employee test123@gmail.com not found!');
    return;
  }

  console.log('✅ Found employee:');
  console.log(`   Employee ID: ${employee.employeeId}`);
  console.log(`   Name: ${employee.firstName} ${employee.lastName}`);
  console.log(`   Department: ${employee.department?.name || 'N/A'}`);

  // Create sample attendance data in the format described
  const attendanceData = [
    {
      'Agent ID': employee.employeeId,
      'Agent Name': `${employee.firstName} ${employee.lastName}`,
      'Designation': 'Employee',
      'Process': employee.department?.name || 'VTP',
      'Shift Start': '10:00 AM',
      '01 Sat': 'P',
      '02 Sun': 'WO',
      '03 Mon': 'WO',
      '04 Tue': 'P',
      '05 Wed': 'P',
      '06 Thu': 'P',
      '07 Fri': 'P',
      '08 Sat': 'P',
      '09 Sun': 'WO',
      '10 Mon': 'WO',
      '11 Tue': 'P',
      '12 Wed': 'P',
      '13 Thu': 'P',
      '14 Fri': 'P',
      '15 Sat': 'P',
      '16 Sun': 'WO',
      '17 Mon': 'WO',
      '18 Tue': 'P',
      '19 Wed': 'P',
      '20 Thu': 'P',
      '21 Fri': 'P',
      '22 Sat': 'P',
      '23 Sun': 'WO',
      '24 Mon': 'WO',
      '25 Tue': 'P',
      '26 Wed': 'P',
      '27 Thu': 'P',
      '28 Fri': 'P',
      '29 Sat': 'P',
      '30 Sun': 'WO',
      '31 Mon': 'WO',
      'Total 1': '22',
      'Total H': '176',
      'Total A': '0',
      'WO': '9',
      'Late Login Days - All Working Days': '0',
      'Wk 03-09 Aug': '6/6',
      'Wk 10-16 Aug': '6/6',
      'Wk 17-23 Aug': '5/6',
      'Wk 24-30 Aug': '5/6',
      'Total HD': '0',
      'Late Login Days - Full Weeks': '0',
    },
  ];

  // Create workbook and worksheet
  const worksheet = XLSX.utils.json_to_sheet(attendanceData);

  // Set column widths
  const columnWidths = Object.keys(attendanceData[0]).map(() => ({ wch: 12 }));
  worksheet['!cols'] = columnWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance');

  // Write to file
  const fileName = 'test-attendance-upload.xlsx';
  XLSX.writeFile(workbook, fileName);

  console.log(`\n✅ Test Excel file created: ${fileName}`);
  console.log('\nNow you can:');
  console.log('1. Login as HR');
  console.log('2. Go to HR → Attendance → Upload Excel');
  console.log(`3. Upload the file: ${fileName}`);
  console.log('4. Login as test123@gmail.com');
  console.log('5. Go to Employee Portal → Attendance');
  console.log('6. See "Uploaded Attendance" section with the data!\n');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
