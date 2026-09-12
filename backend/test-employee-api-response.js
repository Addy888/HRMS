// Test what the employee API would return with the fixed code
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testEmployeeAPIResponse() {
  console.log('='.repeat(80));
  console.log('TESTING EMPLOYEE API RESPONSE (Simulating Super Admin Query)');
  console.log('='.repeat(80));

  try {
    const where = {};

    const employees = await prisma.employee.findMany({
      where,
      select: {
        id: true,
        employeeId: true,
        firstName: true,
        lastName: true,
        phone: true,
        monthlySalary: true, // ← Direct salary field on employee
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            email: true,
            isActive: true,
            role: {
              select: {
                name: true,
              },
            },
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        designation: {
          select: {
            id: true,
            name: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        salaryStructures: {
          where: {
            isActive: true,
          },
          orderBy: {
            effectiveFrom: 'desc',
          },
          take: 1,
          select: {
            basicSalary: true,
            grossSalary: true,
            netSalary: true,
            ctc: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Transform (same as backend service)
    const response = employees.map((emp) => {
      const activeSalary = emp.salaryStructures?.[0];
      
      // Use salaryStructure if exists, otherwise fall back to monthlySalary field
      const totalSalary = activeSalary?.grossSalary || emp.monthlySalary || 0;
      const basicSalary = activeSalary?.basicSalary || emp.monthlySalary || 0;
      
      return {
        id: emp.id,
        employeeId: emp.employeeId,
        firstName: emp.firstName,
        lastName: emp.lastName,
        fullName: `${emp.firstName} ${emp.lastName}`,
        email: emp.user?.email || '',
        phone: emp.phone || '',
        departmentId: emp.department?.id || null,
        departmentName: emp.department?.name || null,
        designationId: emp.designation?.id || null,
        designationTitle: emp.designation?.name || null,
        organizationId: emp.organization?.id || null,
        organizationName: emp.organization?.name || null,
        isActive: emp.user?.isActive || false,
        totalSalary,
        basicSalary,
        netSalary: activeSalary?.netSalary || totalSalary,
        ctc: activeSalary?.ctc || totalSalary,
        createdAt: emp.createdAt,
        updatedAt: emp.updatedAt,
      };
    });

    console.log('\n📊 API RESPONSE SIMULATION:\n');
    response.forEach((emp, index) => {
      console.log(`${index + 1}. ${emp.fullName} (${emp.employeeId})`);
      console.log(`   Email: ${emp.email}`);
      console.log(`   Department: ${emp.departmentName || 'N/A'}`);
      console.log(`   Designation: ${emp.designationTitle || 'N/A'}`);
      console.log(`   Active: ${emp.isActive ? 'YES' : 'NO'}`);
      console.log(`   💰 Total Salary: ₹${emp.totalSalary?.toLocaleString('en-IN') || 0}`);
      console.log(`   💰 Basic Salary: ₹${emp.basicSalary?.toLocaleString('en-IN') || 0}`);
      console.log('');
    });

    console.log('='.repeat(80));
    console.log('✅ API Response ready! The Super Admin page should now show salaries.');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ ERROR:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testEmployeeAPIResponse();
