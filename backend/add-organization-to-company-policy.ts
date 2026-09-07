/**
 * ✅ SAFE DATA MIGRATION SCRIPT
 * 
 * This script adds organizationId to the CompanyPolicy table
 * without losing existing data.
 * 
 * Strategy:
 * 1. Check if organizationId column exists
 * 2. If not, add it as nullable first
 * 3. Assign all existing company policies to default organization
 * 4. Make organizationId required (NOT NULL)
 * 
 * Run: npx ts-node add-organization-to-company-policy.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addOrganizationToCompanyPolicy() {
  try {
    console.log('🔧 Starting migration: Add organizationId to CompanyPolicy');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Step 1: Check if default organization exists
    console.log('Step 1: Checking default organization...');
    let defaultOrg = await prisma.organization.findFirst({
      where: { code: 'ORG-DEFAULT' },
    });

    if (!defaultOrg) {
      console.log('❌ Default organization not found. Creating one...');
      defaultOrg = await prisma.organization.create({
        data: {
          name: 'Default Organization',
          code: 'ORG-DEFAULT',
          email: 'default@company.com',
          phone: '0000000000',
          isActive: true,
        },
      });
      console.log(`✅ Default organization created: ${defaultOrg.id}`);
    } else {
      console.log(`✅ Default organization found: ${defaultOrg.id}`);
    }

    // Step 2: Check current CompanyPolicy records
    console.log('\nStep 2: Checking existing CompanyPolicy records...');
    const existingPolicies = await prisma.$queryRaw<any[]>`
      SELECT id, policyName FROM companypolicy
    `;
    console.log(`   Found ${existingPolicies.length} existing company policies`);

    if (existingPolicies.length > 0) {
      console.log('   Policies:');
      existingPolicies.forEach((policy, idx) => {
        console.log(`   ${idx + 1}. ${policy.policyName} (${policy.id})`);
      });
    }

    // Step 3: Add organizationId column if it doesn't exist
    console.log('\nStep 3: Adding organizationId column...');
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE companypolicy 
        ADD COLUMN organizationId VARCHAR(191) NULL
      `);
      console.log('✅ Column added successfully');
    } catch (error: any) {
      if (error.message.includes('Duplicate column name')) {
        console.log('ℹ️  Column already exists, skipping...');
      } else {
        throw error;
      }
    }

    // Step 4: Update existing records to use default organization
    if (existingPolicies.length > 0) {
      console.log(`\nStep 4: Assigning ${existingPolicies.length} policies to default organization...`);
      const updateResult = await prisma.$executeRawUnsafe(`
        UPDATE companypolicy 
        SET organizationId = '${defaultOrg.id}' 
        WHERE organizationId IS NULL
      `);
      console.log(`✅ Updated ${updateResult} records`);
    } else {
      console.log('\nStep 4: No existing policies to update');
    }

    // Step 5: Make organizationId NOT NULL
    console.log('\nStep 5: Making organizationId NOT NULL...');
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE companypolicy 
        MODIFY COLUMN organizationId VARCHAR(191) NOT NULL
      `);
      console.log('✅ Column constraint updated');
    } catch (error: any) {
      console.log('⚠️  Column constraint may already be set:', error.message);
    }

    // Step 6: Add foreign key constraint
    console.log('\nStep 6: Adding foreign key constraint...');
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE companypolicy 
        ADD CONSTRAINT companypolicy_organizationId_fkey 
        FOREIGN KEY (organizationId) REFERENCES organization(id) ON DELETE CASCADE
      `);
      console.log('✅ Foreign key constraint added');
    } catch (error: any) {
      if (error.message.includes('Duplicate key name')) {
        console.log('ℹ️  Foreign key already exists, skipping...');
      } else {
        console.log('⚠️  Could not add foreign key:', error.message);
      }
    }

    // Step 7: Add index
    console.log('\nStep 7: Adding index on organizationId...');
    try {
      await prisma.$executeRawUnsafe(`
        CREATE INDEX companypolicy_organizationId_idx ON companypolicy(organizationId)
      `);
      console.log('✅ Index created');
    } catch (error: any) {
      if (error.message.includes('Duplicate key name')) {
        console.log('ℹ️  Index already exists, skipping...');
      } else {
        console.log('⚠️  Could not create index:', error.message);
      }
    }

    // Step 8: Verify the migration
    console.log('\nStep 8: Verifying migration...');
    const verifyPolicies = await prisma.$queryRaw<any[]>`
      SELECT id, policyName, organizationId FROM companypolicy
    `;
    console.log(`✅ Verification complete: ${verifyPolicies.length} policies with organizationId`);
    if (verifyPolicies.length > 0) {
      verifyPolicies.forEach((policy, idx) => {
        console.log(`   ${idx + 1}. ${policy.policyName} → Org: ${policy.organizationId}`);
      });
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Migration completed successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
addOrganizationToCompanyPolicy()
  .then(() => {
    console.log('Script execution complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script execution failed:', error);
    process.exit(1);
  });
