/**
 * Fix Remaining Dark Mode Issues in Employee Panel
 * Specifically targets bg-black and bg-neutral-900 instances
 */

const fs = require('fs');
const path = require('path');

const replacements = [
  // Fix bg-black instances
  { from: /bg-black\/40/g, to: 'bg-card' },
  { from: /bg-black\/50/g, to: 'bg-card' },
  { from: /bg-black(?!\/)(?=\s)/g, to: 'bg-background' },
  
  // Fix remaining bg-neutral-900
  { from: /bg-neutral-900(?!\/)(?=\s)/g, to: 'bg-secondary' },
  
  // Fix hover states with neutral-855
  { from: /hover:bg-neutral-855/g, to: 'hover:bg-secondary/50' },
];

const filesToFix = [
  'src/app/employee/attendance/page.tsx',
  'src/app/employee/complaints/page.tsx',
  'src/app/employee/complaints/[id]/page.tsx',
];

function applyFixes(content) {
  let result = content;
  
  for (const { from, to } of replacements) {
    result = result.replace(from, to);
  }
  
  return result;
}

function processFile(filePath) {
  const fullPath = path.join(__dirname, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⏭️  Skipping ${filePath} (not found)`);
    return false;
  }
  
  try {
    const content = fs.readFileSync(fullPath, 'utf8');
    const updated = applyFixes(content);
    
    if (content === updated) {
      console.log(`✓ ${filePath} (no changes)`);
      return false;
    }
    
    fs.writeFileSync(fullPath, updated, 'utf8');
    console.log(`✅ ${filePath} (FIXED)`);
    return true;
  } catch (error) {
    console.error(`❌ ${filePath}:`, error.message);
    return false;
  }
}

console.log('🔧 Fixing remaining dark mode issues in Employee Panel...\n');

let fixed = 0;
for (const file of filesToFix) {
  if (processFile(file)) fixed++;
}

console.log(`\n✅ Fixed ${fixed} files with remaining dark backgrounds`);
