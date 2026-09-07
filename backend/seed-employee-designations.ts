/**
 * 📝 SEED EMPLOYEE DESIGNATIONS
 * 
 * This script creates proper employee designations (NOT system roles).
 * These are job titles/positions that can be assigned to employees.
 * 
 * Run: npx ts-node seed-employee-designations.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedEmployeeDesignations() {
  try {
    console.log('📝 Seeding employee designations...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Get all organizations
    const organizations = await prisma.organization.findMany({
      where: { isActive: true },
    });

    if (organizations.length === 0) {
      console.log('❌ No active organizations found!');
      return;
    }

    // ✅ EMPLOYEE DESIGNATIONS (Job Titles/Positions)
    // These are proper employee job designations, NOT system authentication roles
    const employeeDesignations = [
      { name: 'Agent', description: 'Field Agent / Customer Service Agent' },
      { name: 'Manager', description: 'Department Manager' },
      { name: 'Team Leader', description: 'Team Lead / Supervisor' },
      { name: 'Senior Executive', description: 'Senior Executive' },
      { name: 'Executive', description: 'Executive' },
      { name: 'Developer', description: 'Software Developer' },
      { name: 'Senior Developer', description: 'Senior Software Developer' },
      { name: 'IT Engineer', description: 'IT Support Engineer' },
      { name: 'HR Executive', description: 'HR Executive' },
      { name: 'HR Manager', description: 'HR Manager' },
      { name: 'Accountant', description: 'Accountant' },
      { name: 'Sales Executive', description: 'Sales Executive' },
      { name: 'Marketing Executive', description: 'Marketing Executive' },
      { name: 'Business Analyst', description: 'Business Analyst' },
      { name: 'Project Manager', description: 'Project Manager' },
      { name: 'QA Engineer', description: 'Quality Assurance Engineer' },
      { name: 'DevOps Engineer', description: 'DevOps Engineer' },
      { name: 'Data Analyst', description: 'Data Analyst' },
      { name: 'UI/UX Designer', description: 'UI/UX Designer' },
      { name: 'Technical Writer', description: 'Technical Writer' },
    ];

    let totalCreated = 0;
    let totalSkipped = 0;

    for (const org of organizations) {
      console.log(`\n📋 Processing Organization: ${org.name} (${org.code})\n`);

      for (const desg of employeeDesignations) {
        const existing = await prisma.designation.findFirst({
          where: {
            organizationId: org.id,
            name: desg.name,
          },
        });

        if (existing) {
          console.log(`   ⏭️  Skipped: ${desg.name} (already exists)`);
          totalSkipped++;
        } else {
          await prisma.designation.create({
            data: {
              organizationId: org.id,
              name: desg.name,
              description: desg.description,
            },
          });
          console.log(`   ✅ Created: ${desg.name}`);
          totalCreated++;
        }
      }
    }

    // Summary
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ SEEDING COMPLETE!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`\n📊 Statistics:`);
    console.log(`   • Organizations processed: ${organizations.length}`);
    console.log(`   • Designations created: ${totalCreated}`);
    console.log(`   • Designations skipped: ${totalSkipped}`);
    console.log(`\n✅ Employee designations are now available in the system!`);
    console.log(`✅ HR can now assign these designations when creating employees.`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding
seedEmployeeDesignations()
  .then(() => {
    console.log('Script execution complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script execution failed:', error);
    process.exit(1);
  });
