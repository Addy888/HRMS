const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const allRecords = await prisma.rawAttendanceRecord.findMany({
    take: 20,
    orderBy: { createdAt: 'desc' },
    select: { rawData: true, originalName: true, isMatched: true }
  });
  
  console.log(`🔍 Checking ${allRecords.length} records for punch time format...\n`);
  
  for (const record of allRecords) {
    const data = JSON.parse(record.rawData);
    const columns = Object.keys(data);
    
    // Check if any column value contains time format (HH:MM or HH:MM\nHH:MM)
    let hasPunchTimes = false;
    let samplePunchTime = null;
    
    for (const col of columns) {
      const value = String(data[col]);
      if (/\d{1,2}:\d{2}/.test(value)) {
        hasPunchTimes = true;
        samplePunchTime = { column: col, value: value };
        break;
      }
    }
    
    if (hasPunchTimes) {
      console.log(`✅ FOUND PUNCH TIMES: ${record.originalName} (Matched: ${record.isMatched})`);
      console.log(`   Column: "${samplePunchTime.column}" = "${samplePunchTime.value}"`);
      console.log(`   All columns:`, columns.slice(0, 15).join(', '));
      console.log('');
    }
  }
  
  await prisma.$disconnect();
}

check().catch(console.error);
