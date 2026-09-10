const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkStructure() {
  try {
    console.log('🔍 Checking CompanyPolicy table structure...\n');
    
    // Get table structure
    const columns = await prisma.$queryRawUnsafe(`
      DESCRIBE CompanyPolicy
    `);
    
    console.log('📋 CompanyPolicy Table Columns:');
    console.table(columns);
    
    // Check if the table name is case-sensitive
    const tables = await prisma.$queryRawUnsafe(`
      SHOW TABLES LIKE '%ompany%olicy%'
    `);
    
    console.log('\n📋 Tables matching pattern:');
    console.table(tables);
    
    // Try the exact case from the error message
    try {
      const companypolicy = await prisma.$queryRawUnsafe(`
        DESCRIBE companypolicy
      `);
      console.log('\n📋 companypolicy (lowercase) Table Columns:');
      console.table(companypolicy);
    } catch (e) {
      console.log('\n⚠️  Table "companypolicy" (lowercase) not found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkStructure();
