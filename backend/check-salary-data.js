// Diagnostic script to check actual salary data in database
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSalaryData() {
  console.log('='.repeat(80));
  console.log('CHECKING SALARY DATA IN DATABASE');
  console.log('='.repeat(80));

  try {
    // Check total employees
    const totalEmployees = await prisma.employee.count();
    console.log(`\n📊 Total Employees: ${totalEmployees}`);

    // Check total salary structures
    const totalSalaryStructures = await prisma.salaryStructure.count();
    console.log(`📊 Total Salary Structures: ${totalSalaryStructures}`);

    // Check active salary structures
    const activeSalaryStructures = await prisma.salaryStructure.count({
      where: { isActive: true }
    });
    console.log(`✅ Active Salary Structures: ${activeSalaryStructures}`);

    // Get sample employees with salary data
    console.log('\n' + '='.repeat(80));
    console.log('SAMPLE EMPLOYEES WITH SALARY DATA:');
    console.log('='.repeat(80));

    const employeesWithSalary = await prisma.employee.findMany({
      take: 10,
      include: {
        salaryStructures: {
          where: { isActive: true },
          orderBy: { effectiveFrom: 'desc' },
          take: 1
        },
        department: { select: { name: true } },
        designation: { select: { name: true } },
        user: { select: { email: true, isActive: true } }
      }
    });

    employeesWithSalary.forEach((emp, index) => {
      const salary = emp.salaryStructures[0];
      console.log(`\n${index + 1}. ${emp.firstName} ${emp.lastName} (${emp.employeeId})`);
      console.log(`   Email: ${emp.user?.email || 'N/A'}`);
      console.log(`   Department: ${emp.department?.name || 'N/A'}`);
      console.log(`   Designation: ${emp.designation?.name || 'N/A'}`);
      console.log(`   Active: ${emp.user?.isActive ? 'YES' : 'NO'}`);
      
      if (salary) {
        console.log(`   💰 Salary Structure Found:`);
        console.log(`      Basic Salary: ₹${salary.basicSalary?.toLocaleString('en-IN') || 0}`);
        console.log(`      HRA: ₹${salary.hra?.toLocaleString('en-IN') || 0}`);
        console.log(`      Conveyance: ₹${salary.conveyance?.toLocaleString('en-IN') || 0}`);
        console.log(`      Medical: ₹${salary.medicalAllowance?.toLocaleString('en-IN') || 0}`);
        console.log(`      Special: ₹${salary.specialAllowance?.toLocaleString('en-IN') || 0}`);
        console.log(`      Other: ₹${salary.otherAllowances?.toLocaleString('en-IN') || 0}`);
        console.log(`      Gross Salary: ₹${salary.grossSalary?.toLocaleString('en-IN') || 0}`);
        console.log(`      Net Salary: ₹${salary.netSalary?.toLocaleString('en-IN') || 0}`);
        console.log(`      CTC: ₹${salary.ctc?.toLocaleString('en-IN') || 0}`);
        console.log(`      Is Active: ${salary.isActive ? 'YES' : 'NO'}`);
        console.log(`      Effective From: ${salary.effectiveFrom}`);
      } else {
        console.log(`   ❌ NO SALARY STRUCTURE FOUND`);
      }
    });

    // Check employees WITHOUT salary
    console.log('\n' + '='.repeat(80));
    console.log('EMPLOYEES WITHOUT SALARY STRUCTURES:');
    console.log('='.repeat(80));

    const employeesWithoutSalary = await prisma.employee.findMany({
      where: {
        salaryStructures: {
          none: {}
        }
      },
      take: 10,
      select: {
        employeeId: true,
        firstName: true,
        lastName: true,
        createdAt: true
      }
    });

    if (employeesWithoutSalary.length === 0) {
      console.log('✅ All employees have salary structures!');
    } else {
      console.log(`⚠️  ${employeesWithoutSalary.length} employees without salary structures found:`);
      employeesWithoutSalary.forEach((emp, index) => {
        console.log(`${index + 1}. ${emp.firstName} ${emp.lastName} (${emp.employeeId}) - Created: ${emp.createdAt}`);
      });
    }

    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('SUMMARY:');
    console.log('='.repeat(80));
    const employeesWithSalaryCount = totalEmployees - employeesWithoutSalary.length;
    const percentageWithSalary = totalEmployees > 0 
      ? ((employeesWithSalaryCount / totalEmployees) * 100).toFixed(1)
      : 0;
    
    console.log(`Total Employees: ${totalEmployees}`);
    console.log(`Employees WITH Salary: ${employeesWithSalaryCount} (${percentageWithSalary}%)`);
    console.log(`Employees WITHOUT Salary: ${employeesWithoutSalary.length}`);
    console.log(`Total Salary Structures: ${totalSalaryStructures}`);
    console.log(`Active Salary Structures: ${activeSalaryStructures}`);

  } catch (error) {
    console.error('❌ ERROR:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSalaryData();
