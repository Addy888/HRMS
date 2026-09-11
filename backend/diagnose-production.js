/**
 * Production Diagnosis Script
 * 
 * Run this on the production server to diagnose file location issues
 * 
 * Usage:
 *   node diagnose-production.js [filename]
 * 
 * Example:
 *   node diagnose-production.js 1786528771881-510697210.pdf
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

const searchFilename = process.argv[2];

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('PRODUCTION SERVER DIAGNOSIS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // 1. Environment Information
  console.log('1. ENVIRONMENT INFORMATION');
  console.log('   Node Version:', process.version);
  console.log('   Platform:', process.platform);
  console.log('   Working Directory:', process.cwd());
  console.log('   UPLOAD_DIR:', process.env.UPLOAD_DIR || 'NOT SET');
  console.log('');

  // 2. Expected Paths
  const uploadDir = process.env.UPLOAD_DIR || './uploads';
  const isAbs = path.isAbsolute(uploadDir);
  const baseUploadPath = isAbs ? uploadDir : path.resolve(process.cwd(), uploadDir);
  
  console.log('2. PATH RESOLUTION');
  console.log('   UPLOAD_DIR env:', uploadDir);
  console.log('   Is absolute:', isAbs);
  console.log('   Resolved base path:', baseUploadPath);
  console.log('   Base path exists:', fs.existsSync(baseUploadPath));
  console.log('');

  // 3. Check Upload Folders
  console.log('3. UPLOAD FOLDERS');
  const folders = ['documents', 'avatars', 'complaints', 'company-policies', 'attendance'];
  for (const folder of folders) {
    const folderPath = path.join(baseUploadPath, folder);
    const exists = fs.existsSync(folderPath);
    console.log(`   ${folder}:`);
    console.log(`      Path: ${folderPath}`);
    console.log(`      Exists: ${exists}`);
    
    if (exists) {
      try {
        const files = fs.readdirSync(folderPath);
        console.log(`      Files: ${files.length}`);
        if (files.length > 0 && files.length <= 5) {
          files.forEach(f => console.log(`         - ${f}`));
        } else if (files.length > 5) {
          files.slice(0, 3).forEach(f => console.log(`         - ${f}`));
          console.log(`         ... and ${files.length - 3} more`);
        }
      } catch (err) {
        console.log(`      Error reading: ${err.message}`);
      }
    }
    console.log('');
  }

  // 4. Database Check
  console.log('4. DATABASE CHECK');
  try {
    const docCount = await prisma.document.count();
    console.log(`   Total documents in DB: ${docCount}`);
    
    if (docCount > 0) {
      const recentDocs = await prisma.document.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          fileName: true,
          fileUrl: true,
          type: true,
          status: true,
          createdAt: true
        }
      });
      
      console.log('   Recent documents:');
      recentDocs.forEach(doc => {
        console.log(`      - ${doc.fileName}`);
        console.log(`        URL: ${doc.fileUrl}`);
        console.log(`        Type: ${doc.type}, Status: ${doc.status}`);
        console.log(`        Created: ${doc.createdAt.toISOString()}`);
        console.log('');
      });
    }
  } catch (err) {
    console.log('   ❌ Database error:', err.message);
  }
  console.log('');

  // 5. Search for Specific File
  if (searchFilename) {
    console.log('5. SEARCHING FOR SPECIFIC FILE');
    console.log(`   Looking for: ${searchFilename}\n`);

    // Check database
    console.log('   A. Database Search:');
    try {
      const doc = await prisma.document.findFirst({
        where: {
          OR: [
            { fileName: { contains: searchFilename } },
            { fileUrl: { contains: searchFilename } }
          ]
        },
        include: {
          employee: {
            select: {
              firstName: true,
              lastName: true,
              employeeId: true
            }
          }
        }
      });

      if (doc) {
        console.log('      ✅ FOUND in database:');
        console.log(`         ID: ${doc.id}`);
        console.log(`         File Name: ${doc.fileName}`);
        console.log(`         File URL: ${doc.fileUrl}`);
        console.log(`         Type: ${doc.type}`);
        console.log(`         Status: ${doc.status}`);
        console.log(`         Employee: ${doc.employee.firstName} ${doc.employee.lastName} (${doc.employee.employeeId})`);
        console.log(`         Created: ${doc.createdAt}`);
      } else {
        console.log('      ❌ NOT FOUND in database');
      }
    } catch (err) {
      console.log('      ❌ Database error:', err.message);
    }
    console.log('');

    // Check filesystem
    console.log('   B. Filesystem Search:');
    const possibleLocations = [
      path.join(baseUploadPath, 'documents', searchFilename),
      path.join(process.cwd(), 'uploads', 'documents', searchFilename),
      path.join('C:', 'xampp', 'htdocs', 'HRMS', 'backend', 'uploads', 'documents', searchFilename),
      path.join('C:', 'Users', 'ADITYA', 'OneDrive', 'Desktop', 'HRMS', 'backend', 'uploads', 'documents', searchFilename),
    ];

    let foundAt = null;
    for (const location of possibleLocations) {
      const exists = fs.existsSync(location);
      console.log(`      ${exists ? '✅' : '❌'} ${location}`);
      if (exists && !foundAt) {
        foundAt = location;
        const stats = fs.statSync(location);
        console.log(`         Size: ${stats.size} bytes`);
        console.log(`         Modified: ${stats.mtime.toISOString()}`);
      }
    }

    if (!foundAt) {
      console.log('');
      console.log('      Searching entire working directory...');
      try {
        const { execSync } = require('child_process');
        const result = execSync(`dir /s /b "${searchFilename.replace(/\\/g, '')}*" 2>nul`, {
          cwd: 'C:\\xampp\\htdocs\\HRMS',
          encoding: 'utf8'
        });
        if (result.trim()) {
          console.log('      ✅ Found in system:');
          result.trim().split('\n').forEach(line => {
            console.log(`         ${line.trim()}`);
          });
        } else {
          console.log('      ❌ Not found anywhere in C:\\xampp\\htdocs\\HRMS');
        }
      } catch (err) {
        console.log('      ❌ Search failed:', err.message);
      }
    }
  }

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('DIAGNOSIS COMPLETE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('RECOMMENDATIONS:');
  console.log('');
  console.log('1. Verify .env file has:');
  console.log('   UPLOAD_DIR=./uploads');
  console.log('');
  console.log('2. Ensure upload folders exist:');
  console.log(`   ${baseUploadPath}\\documents`);
  console.log(`   ${baseUploadPath}\\avatars`);
  console.log(`   ${baseUploadPath}\\complaints`);
  console.log(`   ${baseUploadPath}\\company-policies`);
  console.log(`   ${baseUploadPath}\\attendance`);
  console.log('');
  console.log('3. Check that files are in the correct location');
  console.log('');
  console.log('4. Test the debug endpoint:');
  console.log('   http://192.168.1.14:4000/uploads/_debug/info');
  console.log('');
  console.log('5. Check server logs when accessing a file');
  console.log('');

  await prisma.$disconnect();
}

main().catch(err => {
  console.error('FATAL ERROR:', err);
  process.exit(1);
});
