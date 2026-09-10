const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function applyFix() {
  try {
    console.log('🔍 Checking if CompanyPolicy table has organizationId column...');
    
    // Check if column already exists
    const result = await prisma.$queryRawUnsafe(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'CompanyPolicy' 
      AND COLUMN_NAME = 'organizationId'
    `);
    
    if (result.length > 0) {
      console.log('✅ Column organizationId already exists in CompanyPolicy table');
      console.log('✅ No migration needed');
      return;
    }
    
    console.log('⚠️  Column organizationId does not exist. Applying migration...');
    
    // Read the migration SQL file
    const sqlFile = path.join(__dirname, 'prisma', 'migrations', 'fix_company_policy_add_organizationId.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    // Split by semicolons and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`📝 Executing ${statements.length} SQL statements...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.startsWith('SELECT ')) {
        // Skip SELECT statements used for verification
        continue;
      }
      if (statement.startsWith('SET @')) {
        // Execute variable assignment
        await prisma.$executeRawUnsafe(statement);
        console.log(`✓ Step ${i + 1}: Variable set`);
        continue;
      }
      
      console.log(`⏳ Step ${i + 1}: ${statement.substring(0, 50)}...`);
      await prisma.$executeRawUnsafe(statement);
      console.log(`✓ Step ${i + 1}: Complete`);
    }
    
    console.log('\n✅ Migration applied successfully!');
    console.log('✅ CompanyPolicy table now has organizationId column');
    
    // Verify the change
    const verification = await prisma.$queryRawUnsafe(`
      DESCRIBE CompanyPolicy
    `);
    console.log('\n📋 Updated CompanyPolicy table structure:');
    console.table(verification);
    
  } catch (error) {
    console.error('❌ Error applying migration:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

applyFix();
