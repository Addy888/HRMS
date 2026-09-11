const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const path = require('path');
const fs = require('fs');

async function debugStorage() {
  console.log('\n' + '='.repeat(80));
  console.log('🔍 DOCUMENT STORAGE DEBUG REPORT');
  console.log('='.repeat(80));
  
  // 1. Environment Configuration
  console.log('\n📋 ENVIRONMENT CONFIGURATION:');
  console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
  console.log(`   UPLOAD_DIR: ${process.env.UPLOAD_DIR || 'not set'}`);
  console.log(`   process.cwd(): ${process.cwd()}`);
  
  // 2. Resolved Upload Paths
  const uploadDir = process.env.UPLOAD_DIR || './uploads';
  const baseUploadPath = path.isAbsolute(uploadDir)
    ? uploadDir
    : path.resolve(process.cwd(), uploadDir);
  const documentsPath = path.join(baseUploadPath, 'documents');
  
  console.log('\n📁 RESOLVED PATHS:');
  console.log(`   Base upload path: ${baseUploadPath}`);
  console.log(`   Documents folder: ${documentsPath}`);
  console.log(`   Base exists: ${fs.existsSync(baseUploadPath)}`);
  console.log(`   Documents exists: ${fs.existsSync(documentsPath)}`);
  
  // 3. Physical Files on Disk
  console.log('\n📦 PHYSICAL FILES IN documents/ FOLDER:');
  if (fs.existsSync(documentsPath)) {
    const files = fs.readdirSync(documentsPath);
    console.log(`   Total files: ${files.length}`);
    if (files.length > 0) {
      console.log('\n   Recent files (max 10):');
      files.slice(0, 10).forEach((file, idx) => {
        const filePath = path.join(documentsPath, file);
        const stats = fs.statSync(filePath);
        console.log(`   ${idx + 1}. ${file}`);
        console.log(`      Size: ${stats.size} bytes`);
        console.log(`      Modified: ${stats.mtime.toISOString()}`);
      });
    } else {
      console.log('   ⚠️  Folder is EMPTY');
    }
  } else {
    console.log('   ❌ Documents folder does NOT exist!');
  }
  
  // 4. Database Records
  console.log('\n💾 DATABASE RECORDS:');
  try {
    const docs = await prisma.document.findMany({
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
    
    console.log(`   Total documents in DB (last 10): ${docs.length}`);
    
    if (docs.length > 0) {
      console.log('\n   Recent documents:');
      docs.forEach((doc, idx) => {
        console.log(`   ${idx + 1}. ${doc.fileName}`);
        console.log(`      URL: ${doc.fileUrl}`);
        console.log(`      Type: ${doc.type}`);
        console.log(`      Status: ${doc.status}`);
        console.log(`      Created: ${doc.createdAt.toISOString()}`);
        
        // Check if physical file exists
        const expectedPath = path.join(baseUploadPath, doc.fileUrl.replace('/uploads/', ''));
        const exists = fs.existsSync(expectedPath);
        console.log(`      Physical file exists: ${exists ? '✅' : '❌'}`);
        if (!exists) {
          console.log(`      Expected at: ${expectedPath}`);
        }
      });
    } else {
      console.log('   ⚠️  No documents in database');
    }
  } catch (error) {
    console.log(`   ❌ Database error: ${error.message}`);
  }
  
  // 5. Orphaned Files (files on disk not in DB)
  console.log('\n🔎 ORPHANED FILES CHECK:');
  if (fs.existsSync(documentsPath)) {
    const physicalFiles = fs.readdirSync(documentsPath);
    const docs = await prisma.document.findMany({
      select: { fileUrl: true }
    });
    
    const dbFilenames = docs.map(doc => {
      const parts = doc.fileUrl.split('/');
      return parts[parts.length - 1];
    });
    
    const orphanedFiles = physicalFiles.filter(file => !dbFilenames.includes(file));
    
    if (orphanedFiles.length > 0) {
      console.log(`   Found ${orphanedFiles.length} orphaned file(s):`);
      orphanedFiles.slice(0, 5).forEach(file => {
        console.log(`   - ${file}`);
      });
      if (orphanedFiles.length > 5) {
        console.log(`   ... and ${orphanedFiles.length - 5} more`);
      }
    } else {
      console.log('   ✅ No orphaned files found');
    }
  }
  
  // 6. Missing Files (DB records without physical files)
  console.log('\n❌ MISSING FILES CHECK:');
  const allDocs = await prisma.document.findMany({
    select: { id: true, fileName: true, fileUrl: true }
  });
  
  const missingFiles = [];
  for (const doc of allDocs) {
    const expectedPath = path.join(baseUploadPath, doc.fileUrl.replace('/uploads/', ''));
    if (!fs.existsSync(expectedPath)) {
      missingFiles.push({ ...doc, expectedPath });
    }
  }
  
  if (missingFiles.length > 0) {
    console.log(`   Found ${missingFiles.length} missing file(s):`);
    missingFiles.slice(0, 5).forEach(doc => {
      console.log(`   - ${doc.fileName}`);
      console.log(`     URL: ${doc.fileUrl}`);
      console.log(`     Expected at: ${doc.expectedPath}`);
    });
    if (missingFiles.length > 5) {
      console.log(`   ... and ${missingFiles.length - 5} more`);
    }
  } else {
    console.log('   ✅ All database records have corresponding files');
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('📝 SUMMARY:');
  console.log(`   - Physical files: ${fs.existsSync(documentsPath) ? fs.readdirSync(documentsPath).length : 0}`);
  console.log(`   - Database records: ${allDocs.length}`);
  console.log(`   - Missing files: ${missingFiles.length}`);
  console.log(`   - Storage path: ${documentsPath}`);
  console.log('='.repeat(80) + '\n');
  
  await prisma.$disconnect();
}

debugStorage().catch(console.error);
