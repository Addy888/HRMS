import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('\n📊 CURRENT DEPARTMENTS:');
  console.log('='.repeat(60));
  const departments = await prisma.department.findMany({
    orderBy: { name: 'asc' }
  });
  departments.forEach(d => {
    console.log(`ID: ${d.id}`);
    console.log(`Name: ${d.name}`);
    console.log(`Description: ${d.description || 'N/A'}`);
    console.log('-'.repeat(60));
  });

  console.log('\n📊 CURRENT DESIGNATIONS:');
  console.log('='.repeat(60));
  const designations = await prisma.designation.findMany({
    orderBy: { name: 'asc' }
  });
  designations.forEach(d => {
    console.log(`ID: ${d.id}`);
    console.log(`Name: ${d.name}`);
    console.log(`Description: ${d.description || 'N/A'}`);
    console.log('-'.repeat(60));
  });

  console.log('\n📊 RECENT EMPLOYEES:');
  console.log('='.repeat(60));
  const employees = await prisma.employee.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: {
      department: true,
      designation: true,
    }
  });
  employees.forEach(e => {
    console.log(`Employee ID: ${e.employeeId}`);
    console.log(`Name: ${e.firstName} ${e.lastName}`);
    console.log(`Department: ${e.department?.name || 'N/A'}`);
    console.log(`Designation: ${e.designation?.name || 'N/A'}`);
    console.log('-'.repeat(60));
  });

  console.log(`\nTotal Departments: ${departments.length}`);
  console.log(`Total Designations: ${designations.length}`);
  console.log(`Total Employees: ${employees.length}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
