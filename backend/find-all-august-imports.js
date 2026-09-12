const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findAllAugustImports() {
  try {
    console.log('=== ALL AUGUST IMPORTS ===\n');
    
    const imports = await prisma.attendanceImportHistory.findMany({
      where: {
        OR: [
          { fileName: { contains: 'August' } },
          { fileName: { contains: 'august' } },
          { fileName: { contains: 'AUGUST' } }
        ]
      },
      orderBy: { uploadedAt: 'desc' },
      select: {
        id: true,
        fileName: true,
        uploadedAt: true,
        totalRows: true,
        successfulRows: true,
        failedRows: true,
        duplicateRows: true,
        status: true,
      }
    });
    
    if (imports.length === 0) {
      console.log('No August imports found');
      
      // Show all imports
      const allImports = await prisma.attendanceImportHistory.findMany({
        orderBy: { uploadedAt: 'desc' },
        take: 10,
        select: {
          fileName: true,
          uploadedAt: true,
          totalRows: true,
          successfulRows: true,
          failedRows: true,
          status: true,
        }
      });
      
      console.log('\nAll recent imports:');
      allImports.forEach((imp, i) => {
        console.log(`${i + 1}. ${imp.fileName} - ${imp.status} (${imp.successfulRows}/${imp.totalRows})`);
      });
      
      return;
    }
    
    imports.forEach((imp, i) => {
      console.log(`${i + 1}. ${imp.fileName}`);
      console.log(`   Uploaded: ${imp.uploadedAt}`);
      console.log(`   Total: ${imp.totalRows}, Success: ${imp.successfulRows}, Failed: ${imp.failedRows}, Duplicates: ${imp.duplicateRows}`);
      console.log(`   Status: ${imp.status}`);
      console.log(`   ID: ${imp.id}\n`);
    });
    
    // Check priticothe972@gmail.com user
    console.log('=== CHECKING priticothe972@gmail.com ===\n');
    
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { contains: 'priticothe972' } },
          { email: { contains: 'priti' } }
        ]
      },
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
    
    if (user) {
      console.log(`Found: ${user.email}`);
      if (user.employee) {
        console.log(`Employee: ${user.employee.employeeId} - ${user.employee.firstName} ${user.employee.lastName}`);
        console.log(`UUID: ${user.employee.id}\n`);
        
        // Check records for this employee in ANY August import
        for (const imp of imports) {
          const count = await prisma.rawAttendanceRecord.count({
            where: {
              importHistoryId: imp.id,
              employeeId: user.employee.id,
              attendanceMonth: 8,
              attendanceYear: 2026,
            }
          });
          
          if (count > 0) {
            console.log(`✅ Has ${count} records in: ${imp.fileName}`);
          }
        }
      } else {
        console.log('❌ No employee record');
      }
    } else {
      console.log('❌ User not found');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findAllAugustImports();
