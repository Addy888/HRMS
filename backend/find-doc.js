const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findDocument() {
  try {
    const docs = await prisma.document.findMany({
      where: {
        OR: [
          { fileUrl: { contains: '1786528655437-189274371' } },
          { fileName: { contains: '1786528655437-189274371' } },
        ]
      },
      select: {
        id: true,
        fileName: true,
        fileUrl: true,
        type: true,
        status: true,
        employeeId: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    console.log('='.repeat(60));
    console.log('SEARCHING FOR DOCUMENT: 1786528655437-189274371.jpeg');
    console.log('='.repeat(60));
    
    if (docs.length === 0) {
      console.log('❌ NO DATABASE RECORD FOUND for this file');
      console.log('\nShowing recent documents instead:');
      
      const recent = await prisma.document.findMany({
        select: {
          id: true,
          fileName: true,
          fileUrl: true,
          type: true,
          status: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });
      
      recent.forEach(doc => {
        console.log(`\n📄 ${doc.fileUrl}`);
        console.log(`   Type: ${doc.type}`);
        console.log(`   Status: ${doc.status}`);
        console.log(`   Created: ${doc.createdAt}`);
      });
    } else {
      console.log(`✅ FOUND ${docs.length} MATCHING DOCUMENT(S):\n`);
      docs.forEach(doc => {
        console.log(`\n📄 Document ID: ${doc.id}`);
        console.log(`   fileName: ${doc.fileName}`);
        console.log(`   fileUrl: ${doc.fileUrl}`);
        console.log(`   type: ${doc.type}`);
        console.log(`   status: ${doc.status}`);
        console.log(`   employeeId: ${doc.employeeId}`);
        console.log(`   createdAt: ${doc.createdAt}`);
      });
    }
    
    console.log('\n' + '='.repeat(60));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findDocument();
