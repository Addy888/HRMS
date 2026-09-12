const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function traceCurrentImport() {
  try {
    console.log('=== TRACING CURRENT AUGUST IMPORT ===\n');
    
    // Find the August import with PARTIAL status
    const augustImport = await prisma.attendanceImportHistory.findFirst({
      where: {
        fileName: { contains: 'August_2026' },
        status: 'PARTIAL'
      },
      orderBy: { uploadedAt: 'desc' },
      select: {
        id: true,
        fileName: true,
        uploadedAt: true,
        totalRows: true,
        successfulRows: true,
        failedRows: true,
        status: true,
      }
    });
    
    if (!augustImport) {
      console.log('❌ No PARTIAL August 2026 import found');
      
      // Check any August import
      const anyAugust = await prisma.attendanceImportHistory.findFirst({
        where: { fileName: { contains: 'August' } },
        orderBy: { uploadedAt: 'desc' },
        select: {
          id: true,
          fileName: true,
          uploadedAt: true,
          totalRows: true,
          successfulRows: true,
          failedRows: true,
          status: true,
        }
      });
      
      if (anyAugust) {
        console.log('Found this August import instead:');
        console.log(JSON.stringify(anyAugust, null, 2));
        return;
      }
      
      console.log('No August import found at all');
      return;
    }
    
    console.log('✅ Found August Import:');
    console.log(`   File: ${augustImport.fileName}`);
    console.log(`   Upload Date: ${augustImport.uploadedAt}`);
    console.log(`   Total: ${augustImport.totalRows}`);
    console.log(`   Successful: ${augustImport.successfulRows}`);
    console.log(`   Failed: ${augustImport.failedRows}`);
    console.log(`   Status: ${augustImport.status}\n`);
    
    // Get records from this import
    const records = await prisma.rawAttendanceRecord.findMany({
      where: { importHistoryId: augustImport.id },
      select: {
        id: true,
        originalIdentifier: true,
        originalName: true,
        employeeId: true,
        isMatched: true,
        matchingNote: true,
        attendanceMonth: true,
        attendanceYear: true,
        attendanceDate: true,
        rawData: true,
      },
      take: 30
    });
    
    console.log(`Total records in this import: ${records.length}\n`);
    
    const matched = records.filter(r => r.isMatched);
    const unmatched = records.filter(r => !r.isMatched);
    
    console.log(`Matched: ${matched.length}`);
    console.log(`Unmatched: ${unmatched.length}\n`);
    
    if (matched.length > 0) {
      console.log('=== MATCHED RECORDS (Successful) ===\n');
      
      for (let i = 0; i < Math.min(5, matched.length); i++) {
        const r = matched[i];
        console.log(`${i + 1}. Original ID: ${r.originalIdentifier}`);
        console.log(`   Original Name: ${r.originalName}`);
        console.log(`   Employee UUID: ${r.employeeId}`);
        console.log(`   Month/Year: ${r.attendanceMonth}/${r.attendanceYear}`);
        console.log(`   Date: ${r.attendanceDate}`);
        
        // Get employee details
        if (r.employeeId) {
          const emp = await prisma.employee.findUnique({
            where: { id: r.employeeId },
            select: {
              employeeId: true,
              firstName: true,
              lastName: true,
              user: {
                select: {
                  email: true
                }
              }
            }
          });
          
          if (emp) {
            console.log(`   → Employee: ${emp.employeeId} - ${emp.firstName} ${emp.lastName}`);
            console.log(`   → Email: ${emp.user?.email}`);
          }
        }
        
        // Parse raw data to see attendance details
        try {
          const data = JSON.parse(r.rawData);
          const keys = Object.keys(data);
          console.log(`   → Raw Data Keys: ${keys.slice(0, 5).join(', ')}`);
          
          // Look for status/date fields
          if (data['Status']) console.log(`   → Status: ${data['Status']}`);
          if (data['Date']) console.log(`   → Date: ${data['Date']}`);
          if (data['Check In']) console.log(`   → Check In: ${data['Check In']}`);
          if (data['Check Out']) console.log(`   → Check Out: ${data['Check Out']}`);
        } catch (e) {
          console.log(`   → Could not parse raw data`);
        }
        
        console.log('');
      }
    }
    
    if (unmatched.length > 0) {
      console.log('\n=== UNMATCHED RECORDS (Failed) ===\n');
      
      // Group by matching note
      const failureReasons = {};
      unmatched.forEach(r => {
        const reason = r.matchingNote || 'No matching note';
        if (!failureReasons[reason]) failureReasons[reason] = [];
        failureReasons[reason].push(r.originalIdentifier);
      });
      
      Object.entries(failureReasons).forEach(([reason, ids]) => {
        console.log(`${reason}: ${ids.length} records`);
        console.log(`   Examples: ${ids.slice(0, 3).join(', ')}`);
      });
    }
    
    // Check the currently logged in user priticothe972@gmail.com
    console.log('\n=== CHECKING USER priticothe972@gmail.com ===\n');
    
    const pritiUser = await prisma.user.findFirst({
      where: { email: { contains: 'priticothe972' } },
      select: {
        id: true,
        email: true,
        employee: {
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
          }
        }
      }
    });
    
    if (pritiUser) {
      console.log('Found user:');
      console.log(`   Email: ${pritiUser.email}`);
      if (pritiUser.employee) {
        console.log(`   Employee ID: ${pritiUser.employee.employeeId}`);
        console.log(`   Name: ${pritiUser.employee.firstName} ${pritiUser.employee.lastName}`);
        console.log(`   UUID: ${pritiUser.employee.id}`);
        
        // Check if this employee has any matched records
        const employeeRecords = await prisma.rawAttendanceRecord.count({
          where: {
            importHistoryId: augustImport.id,
            employeeId: pritiUser.employee.id,
            isMatched: true
          }
        });
        
        console.log(`\n   ✅ This employee has ${employeeRecords} matched records in this import`);
      } else {
        console.log('   ❌ No employee record linked to this user');
      }
    } else {
      console.log('❌ User priticothe972@gmail.com not found');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

traceCurrentImport();
