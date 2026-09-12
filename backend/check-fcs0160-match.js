const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkMatching() {
  console.log('🔍 CHECKING FCS0160 MATCHING\n');
  
  // Check if FCS0160 is in the raw records
  const raw = await prisma.rawAttendanceRecord.findFirst({
    where: {
      originalIdentifier: 'FCS0160'
    },
    select: {
      id: true,
      originalIdentifier: true,
      originalName: true,
      employeeId: true,
      isMatched: true,
      matchingNote: true,
    }
  });
  
  console.log('FCS0160 in Raw Records:');
  console.log(JSON.stringify(raw, null, 2));
  
  // Check all raw records to find what identifiers exist
  const allIds = await prisma.rawAttendanceRecord.findMany({
    select: {
      originalIdentifier: true,
      originalName: true,
      isMatched: true,
    },
    take: 20,
  });
  
  console.log('\n\nAll Identifiers in Import:');
  allIds.forEach(r => {
    console.log(`  ${r.originalIdentifier || 'N/A'} - ${r.originalName} (Matched: ${r.isMatched})`);
  });
  
  await prisma.$disconnect();
}

checkMatching().catch(console.error);
