/**
 * DOCUMENT RESTORATION SCRIPT
 * 
 * This script creates database records for orphaned physical files
 * that exist in the uploads/documents folder but have no DB entry.
 * 
 * IMPORTANT: This should only be run once after database reset/migration
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const path = require('path');
const fs = require('fs');

// File extension to document type mapping
const EXT_TO_DOC_TYPE = {
  'pdf': 'RESUME', // Default PDFs to RESUME
  'png': 'PHOTO',
  'jpg': 'PHOTO',
  'jpeg': 'PHOTO',
};

// Category mapping
const getCategoryForType = (type) => {
  const categories = {
    PERSONAL: ['PHOTO', 'RESUME', 'CV'],
    GOVERNMENT: ['AADHAAR', 'PAN', 'PASSPORT', 'DRIVING_LICENSE'],
    EDUCATIONAL: ['10TH_MARKSHEET', '12TH_MARKSHEET', 'DIPLOMA_CERTIFICATE', 'GRADUATION_DEGREE'],
    PROFESSIONAL: ['OFFER_LETTER', 'EXPERIENCE_LETTER', 'RELIEVING_LETTER', 'SALARY_SLIP'],
  };
  
  for (const [category, types] of Object.entries(categories)) {
    if (types.includes(type)) return category;
  }
  return 'OTHER';
};

async function restoreDocuments() {
  console.log('\n' + '='.repeat(80));
  console.log('🔄 DOCUMENT RESTORATION SCRIPT');
  console.log('='.repeat(80));
  
  // Get upload configuration
  const uploadDir = process.env.UPLOAD_DIR || './uploads';
  const baseUploadPath = path.isAbsolute(uploadDir)
    ? uploadDir
    : path.resolve(process.cwd(), uploadDir);
  const documentsPath = path.join(baseUploadPath, 'documents');
  
  console.log(`\n📁 Scanning: ${documentsPath}`);
  
  if (!fs.existsSync(documentsPath)) {
    console.log('❌ Documents folder does not exist!');
    process.exit(1);
  }
  
  // Get physical files
  const physicalFiles = fs.readdirSync(documentsPath);
  console.log(`   Found ${physicalFiles.length} physical file(s)`);
  
  // Get existing DB records
  const existingDocs = await prisma.document.findMany({
    select: { fileUrl: true }
  });
  
  const dbFilenames = existingDocs.map(doc => {
    const parts = doc.fileUrl.split('/');
    return parts[parts.length - 1];
  });
  
  console.log(`   Found ${existingDocs.length} database record(s)`);
  
  // Find orphaned files
  const orphanedFiles = physicalFiles.filter(file => !dbFilenames.includes(file));
  
  if (orphanedFiles.length === 0) {
    console.log('\n✅ No orphaned files found. All files have database records.');
    await prisma.$disconnect();
    return;
  }
  
  console.log(`\n⚠️  Found ${orphanedFiles.length} orphaned file(s) without database records`);
  console.log('\n❓ RESTORATION OPTIONS:');
  console.log('   1. Skip restoration (exit)');
  console.log('   2. Create placeholder records for ALL orphaned files');
  console.log('   3. Delete orphaned files (DESTRUCTIVE)');
  
  // For automated execution, we'll skip interactive input
  // You can manually uncomment option 2 or 3 below
  
  console.log('\n⚠️  MANUAL ACTION REQUIRED:');
  console.log('   - Uncomment the desired option in restore-documents.js');
  console.log('   - Option 2: Create database records for orphaned files');
  console.log('   - Option 3: Delete orphaned files');
  console.log('\n   Files will NOT be modified in this run.');
  
  // OPTION 2: Create placeholder records (UNCOMMENT TO ENABLE)
  /*
  console.log('\n🔧 Creating placeholder database records...');
  
  // Get a default employee to assign these documents to
  const defaultEmployee = await prisma.employee.findFirst({
    orderBy: { createdAt: 'asc' }
  });
  
  if (!defaultEmployee) {
    console.log('❌ No employees found in database. Cannot create document records.');
    console.log('   Please create at least one employee first.');
    await prisma.$disconnect();
    return;
  }
  
  console.log(`   Using default employee: ${defaultEmployee.firstName} ${defaultEmployee.lastName} (ID: ${defaultEmployee.id})`);
  
  let restored = 0;
  for (const filename of orphanedFiles) {
    try {
      const ext = path.extname(filename).toLowerCase().replace('.', '');
      const docType = EXT_TO_DOC_TYPE[ext] || 'RESUME';
      const categoryName = getCategoryForType(docType);
      
      // Get or create category
      let category = await prisma.documentCategory.findUnique({
        where: { name: categoryName }
      });
      
      if (!category) {
        category = await prisma.documentCategory.create({
          data: { name: categoryName }
        });
      }
      
      // Create document record
      const fileUrl = `/uploads/documents/${filename}`;
      await prisma.document.create({
        data: {
          employeeId: defaultEmployee.id,
          organizationId: defaultEmployee.organizationId,
          type: docType,
          fileUrl: fileUrl,
          fileName: filename,
          status: 'PENDING',
          categoryId: category.id,
        }
      });
      
      restored++;
      console.log(`   ✅ Restored: ${filename} -> ${docType}`);
    } catch (error) {
      console.log(`   ❌ Failed to restore ${filename}: ${error.message}`);
    }
  }
  
  console.log(`\n✅ Restoration complete: ${restored}/${orphanedFiles.length} files`);
  */
  
  // OPTION 3: Delete orphaned files (UNCOMMENT TO ENABLE - DESTRUCTIVE!)
  /*
  console.log('\n🗑️  Deleting orphaned files...');
  
  let deleted = 0;
  for (const filename of orphanedFiles) {
    try {
      const filePath = path.join(documentsPath, filename);
      fs.unlinkSync(filePath);
      deleted++;
      console.log(`   🗑️  Deleted: ${filename}`);
    } catch (error) {
      console.log(`   ❌ Failed to delete ${filename}: ${error.message}`);
    }
  }
  
  console.log(`\n✅ Deletion complete: ${deleted}/${orphanedFiles.length} files removed`);
  */
  
  console.log('\n' + '='.repeat(80));
  await prisma.$disconnect();
}

restoreDocuments().catch(console.error);
