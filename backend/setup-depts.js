require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Setting up required departments and designations...\n');

  // Setup departments
  const departments = [
    { name: 'Manager', description: 'Management Department' },
    { name: 'IT', description: 'Information Technology Department' },
    { name: 'Agent', description: 'Agent Department' },
  ];

  for (const dept of departments) {
    try {
      const existing = await prisma.department.findUnique({
        where: { name: dept.name }
      });
      
      if (!existing) {
        const created = await prisma.department.create({
          data: dept
        });
        console.log(`✅ Created department: ${dept.name} (${created.id})`);
      } else {
        console.log(`ℹ️  Department already exists: ${dept.name} (${existing.id})`);
      }
    } catch (error) {
      console.error(`❌ Error with department ${dept.name}:`, error.message);
    }
  }

  console.log('\n');

  // Setup designations
  const designations = [
    { name: 'HR Manager', description: 'Human Resources Manager' },
    { name: 'IT Engineer', description: 'Information Technology Engineer' },
    { name: 'Software Developer', description: 'Software Development Professional' },
    { name: 'Agent', description: 'Agent' },
    { name: 'Sales Executive', description: 'Sales Executive' },
    { name: 'Team Leader', description: 'Team Leader' },
    { name: 'Senior Manager', description: 'Senior Management Position' },
  ];

  for (const desig of designations) {
    try {
      const existing = await prisma.designation.findUnique({
        where: { name: desig.name }
      });
      
      if (!existing) {
        const created = await prisma.designation.create({
          data: desig
        });
        console.log(`✅ Created designation: ${desig.name} (${created.id})`);
      } else {
        console.log(`ℹ️  Designation already exists: ${desig.name} (${existing.id})`);
      }
    } catch (error) {
      console.error(`❌ Error with designation ${desig.name}:`, error.message);
    }
  }

  console.log('\n📊 CURRENT STATE:\n');

  // Show all departments
  const allDepts = await prisma.department.findMany({
    orderBy: { name: 'asc' }
  });
  console.log('🏢 DEPARTMENTS:');
  allDepts.forEach(d => console.log(`   - ${d.name} (${d.id})`));

  console.log('\n💼 DESIGNATIONS:');
  const allDesigs = await prisma.designation.findMany({
    orderBy: { name: 'asc' }
  });
  allDesigs.forEach(d => console.log(`   - ${d.name} (${d.id})`));

  console.log('\n✅ Setup complete!');
}

main()
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
