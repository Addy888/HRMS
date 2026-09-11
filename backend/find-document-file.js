const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('SEARCHING FOR DOCUMENT: 1786528771881-510697210.pdf');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Check process.cwd()
  console.log('Current Working Directory:', process.cwd());
  console.log('Expected Upload Base Path:', path.join(process.cwd(), 'uploads'));
  console.log('');

  // Query database for this specific file
  const doc = await prisma.document.findFirst({
    where: {
      OR: [
        { fileName: { contains: '1786528771881-510697210' } },
        { fileUrl: { contains: '1786528771881-510697210' } }
      ]
    },
    select: {
      id: true,
      fileName: true,
      fileUrl: true,
      type: true,
      status: true,
      createdAt: true,
      employee: {
        select: {
          firstName: true,
          lastName: true,
          employeeId: true
        }
      }
    }
  });

  if (!doc) {
    console.log('❌ NO DATABASE RECORD FOUND for this filename');
    console.log('\nChecking recent documents instead...\n');
    
    const recentDocs = await prisma.document.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fileName: true,
        fileUrl: true,
        type: true,
        createdAt: true
      }
    });
    
    console.log('RECENT DOCUMENTS IN DATABASE:');
    recentDocs.forEach(d => {
      console.log(`  - ${d.fileName}`);
      console.log(`    URL: ${d.fileUrl}`);
      console.log(`    Created: ${d.createdAt}`);
      console.log('');
    });
  } else {
    console.log('✅ DATABASE RECORD FOUND:');
    console.log(JSON.stringify(doc, null, 2));
    console.log('');

    // Try to locate the physical file
    const possiblePaths = [
      path.join(process.cwd(), 'uploads', 'documents', '1786528771881-510697210.pdf'),
      path.join('C:', 'xampp', 'htdocs', 'HRMS', 'backend', 'uploads', 'documents', '1786528771881-510697210.pdf'),
      path.join('C:', 'xampp', 'htdocs', 'HRMS', 'uploads', 'documents', '1786528771881-510697210.pdf'),
    ];

    console.log('CHECKING PHYSICAL FILE LOCATIONS:');
    possiblePaths.forEach(p => {
      const exists = fs.existsSync(p);
      console.log(`  ${exists ? '✅' : '❌'} ${p}`);
      if (exists) {
        const stats = fs.statSync(p);
        console.log(`     Size: ${stats.size} bytes, Modified: ${stats.mtime}`);
      }
    });
  }

  // List actual files in various upload directories
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('ACTUAL FILES IN UPLOAD DIRECTORIES:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const checkDirs = [
    path.join(process.cwd(), 'uploads', 'documents'),
    path.join('C:', 'xampp', 'htdocs', 'HRMS', 'backend', 'uploads', 'documents'),
    path.join('C:', 'xampp', 'htdocs', 'HRMS', 'uploads', 'documents'),
  ];

  for (const dir of checkDirs) {
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir);
      console.log(`📁 ${dir} (${files.length} files)`);
      files.slice(0, 10).forEach(f => console.log(`   - ${f}`));
      if (files.length > 10) console.log(`   ... and ${files.length - 10} more`);
      console.log('');
    } else {
      console.log(`❌ ${dir} (does not exist)`);
      console.log('');
    }
  }

  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
