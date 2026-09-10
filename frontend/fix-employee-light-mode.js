/**
 * Complete Employee Panel Light Mode Fix Script
 * 
 * This script systematically fixes all hardcoded dark mode classes
 * in the Employee panel to use theme-aware Tailwind classes for proper light mode.
 */

const fs = require('fs');
const path = require('path');

// Define replacement patterns
const replacements = [
  // Dark background fixes
  { from: /bg-neutral-950\/\d+/g, to: 'bg-card' },
  { from: /bg-neutral-900\/\d+/g, to: 'bg-card' },
  { from: /bg-neutral-850/g, to: 'bg-secondary' },
  { from: /bg-neutral-800\/\d+/g, to: 'bg-secondary' },
  { from: /bg-neutral-800(?!\/)(?=\s)/g, to: 'bg-secondary' },
  { from: /bg-neutral-750/g, to: 'bg-secondary' },
  { from: /bg-neutral-700/g, to: 'bg-secondary' },
  { from: /bg-black\/60/g, to: 'bg-background/60' },
  { from: /bg-black\/70/g, to: 'bg-background/70' },
  
  // Border fixes
  { from: /border-neutral-950\/?\d*/g, to: 'border-border' },
  { from: /border-neutral-900\/?\d*/g, to: 'border-border' },
  { from: /border-neutral-850\/?\d*/g, to: 'border-border' },
  { from: /border-neutral-800\/?\d*/g, to: 'border-border' },
  
  // Text color fixes
  { from: /text-neutral-450/g, to: 'text-muted-foreground' },
  { from: /text-neutral-400/g, to: 'text-muted-foreground' },
  { from: /text-neutral-550/g, to: 'text-muted-foreground' },
  { from: /text-neutral-350/g, to: 'text-foreground' },
  { from: /text-neutral-300/g, to: 'text-muted-foreground' },
  { from: /text-neutral-200/g, to: 'text-foreground' },
  
  // Hover state fixes
  { from: /hover:bg-neutral-850/g, to: 'hover:bg-secondary/50' },
  { from: /hover:bg-neutral-800/g, to: 'hover:bg-secondary/50' },
  { from: /hover:bg-neutral-750/g, to: 'hover:bg-secondary/50' },
  
  // Special prose fix
  { from: /prose prose-invert/g, to: 'prose' },
  
  // Table header specific fixes
  { from: /(thead[^>]*>\s*<tr[^>]*className[^>]*=.*?)bg-secondary\/80/g, to: '$1bg-secondary' },
  
  // Gradient text fixes for Employee layout
  { from: /bg-gradient-to-r from-white via-neutral-100 to-neutral-500 bg-clip-text text-transparent/g, to: 'text-foreground' },
];

// Files to process - Employee Panel
const employeePanelFiles = [
  // Main Employee pages
  'src/app/employee/page.tsx',
  'src/app/employee/profile/page.tsx',
  'src/app/employee/profile/edit/page.tsx',
  'src/app/employee/attendance/page.tsx',
  'src/app/employee/my-salary/page.tsx',
  'src/app/employee/documents/page.tsx',
  'src/app/employee/policies/page.tsx',
  'src/app/employee/policies/[id]/page.tsx',
  'src/app/employee/policies/company-policy/page.tsx',
  'src/app/employee/hr-actions/page.tsx',
  'src/app/employee/hr-actions/[id]/page.tsx',
  'src/app/employee/complaints/page.tsx',
  'src/app/employee/complaints/[id]/page.tsx',
  'src/app/employee/complaints/create/page.tsx',
  'src/app/employee/notifications/page.tsx',
  'src/app/employee/announcements/page.tsx',
  'src/app/employee/acknowledge/page.tsx',
  'src/app/employee/settings/page.tsx',
  
  // Layout
  'src/layouts/EmployeeLayout.tsx',
];

function applyReplacements(content) {
  let result = content;
  
  for (const { from, to } of replacements) {
    result = result.replace(from, to);
  }
  
  // Additional fixes for inputs - change bg-card to bg-background in input/textarea/select
  result = result.replace(
    /(<(?:input|textarea|select)[^>]*className[^>]*=(?:[^>]*?))bg-card(\s)/g,
    '$1bg-background$2'
  );
  
  return result;
}

function processFile(filePath) {
  const fullPath = path.join(__dirname, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⏭️  Skipping ${filePath} (not found)`);
    return { success: false, reason: 'not found' };
  }
  
  try {
    const content = fs.readFileSync(fullPath, 'utf8');
    const updated = applyReplacements(content);
    
    if (content === updated) {
      console.log(`✓ ${filePath} (no changes needed)`);
      return { success: true, changed: false };
    }
    
    fs.writeFileSync(fullPath, updated, 'utf8');
    console.log(`✓ ${filePath} (updated)`);
    return { success: true, changed: true };
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return { success: false, reason: error.message };
  }
}

// Main execution
console.log('🎨 Starting Employee Panel light mode fix...\n');

let stats = {
  total: 0,
  updated: 0,
  unchanged: 0,
  failed: 0,
  notFound: 0
};

for (const file of employeePanelFiles) {
  stats.total++;
  const result = processFile(file);
  
  if (!result.success) {
    if (result.reason === 'not found') {
      stats.notFound++;
    } else {
      stats.failed++;
    }
  } else if (result.changed) {
    stats.updated++;
  } else {
    stats.unchanged++;
  }
}

console.log('\n📊 Summary:');
console.log(`   Total files: ${stats.total}`);
console.log(`   ✓ Updated: ${stats.updated}`);
console.log(`   ✓ Unchanged: ${stats.unchanged}`);
console.log(`   ⏭️  Not found: ${stats.notFound}`);
console.log(`   ❌ Failed: ${stats.failed}`);

console.log('\n✅ Employee Panel light mode fix complete!');

