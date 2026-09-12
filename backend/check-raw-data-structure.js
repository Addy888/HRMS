const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const matched = await prisma.rawAttendanceRecord.findFirst({
    where: { 
      isMatched: true,
      originalName: 'Sumiya Tamboli'
    },
    select: { rawData: true, originalName: true }
  });
  
  if (!matched) {
    console.log('No matched record found for Sumiya Tamboli');
    return;
  }
  
  console.log('📋 RAW DATA FOR: Sumiya Tamboli\n');
  console.log('Full rawData string length:', matched.rawData.length);
  
  const data = JSON.parse(matched.rawData);
  const columns = Object.keys(data);
  
  console.log('\nColumns found:', columns.length);
  console.log('\nFirst 20 columns:');
  columns.slice(0, 20).forEach((col, idx) => {
    const value = data[col];
    const preview = typeof value === 'string' ? value.substring(0, 50) : value;
    console.log(`  ${idx + 1}. "${col}" = "${preview}"`);
  });
  
  // Check for Period
  const periodCol = columns.find(c => c.toLowerCase().includes('period'));
  if (periodCol) {
    console.log(`\n✅ Found Period column: "${periodCol}"`);
    console.log(`   Value: "${data[periodCol]}"`);
  } else {
    console.log('\n❌ NO Period column found!');
  }
  
  // Check for day columns
  const dayColumns = columns.filter(c => /^\d+$/.test(c));
  console.log(`\n📅 Day columns found: ${dayColumns.length}`);
  if (dayColumns.length > 0) {
    console.log('First 5 day columns:');
    dayColumns.slice(0, 5).forEach(day => {
      console.log(`  Day ${day}: "${data[day]}"`);
    });
  }
  
  await prisma.$disconnect();
}

check().catch(console.error);
