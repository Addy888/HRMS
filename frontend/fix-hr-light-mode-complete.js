/**
 * Comprehensive HR Panel Light Mode Fix Script
 * 
 * This script systematically fixes all hardcoded dark mode classes
 * in the HR panel to use theme-aware Tailwind classes for proper light mode support.
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
  
  // Text color fixes (careful with these)
  { from: /text-neutral-450/g, to: 'text-muted-foreground' },
  { from: /text-neutral-400/g, to: 'text-muted-foreground' },
  { from: /text-neutral-550/g, to: 'text-muted-foreground' },
  
  // Hover state fixes
  { from: /hover:bg-neutral-850/g, to: 'hover:bg-secondary/50' },
  { from: /hover:bg-neutral-800/g, to: 'hover:bg-secondary/50' },
  { from: /hover:bg-neutral-750/g, to: 'hover:bg-secondary/50' },
  
  // Input background fixes - change bg-card in inputs to bg-background
  { from: /(\<input[^>]*className[^>]*=.*?)bg-card(\s)/g, to: '$1bg-background$2' },
  { from: /(\<textarea[^>]*className[^>]*=.*?)bg-card(\s)/g, to: '$1bg-background$2' },
  { from: /(\<select[^>]*className[^>]*=.*?)bg-card(\s)/g, to: '$1bg-background$2' },
  
  // Specific prose fix for policy pages
  { from: /prose prose-invert/g, to: 'prose' },
  
  // Table header specific fixes
  { from: /(thead[^>]*>\s*<tr[^>]*className[^>]*=.*?)bg-secondary\/80/g, to: '$1bg-secondary' },
];

// Files to process
const hrPanelFiles = [
  // Main HR pages
  'src/app/hr/page.tsx',
  'src/app/hr/employees/page.tsx',
  'src/app/hr/employees/[id]/page.tsx',
  'src/app/hr/attendance/page.tsx',
  'src/app/hr/attendance/employee/[id]/page.tsx',
  'src/app/hr/attendance/import/history/page.tsx',
  'src/app/hr/departments/page.tsx',
  'src/app/hr/designations/page.tsx',
  'src/app/hr/hr-users/page.tsx',
  'src/app/hr/documents/page.tsx',
  'src/app/hr/policies/page.tsx',
  'src/app/hr/policies/create/page.tsx',
  'src/app/hr/policies/[id]/edit/page.tsx',
  'src/app/hr/policies/tracking/page.tsx',
  'src/app/hr/hr-actions/page.tsx',
  'src/app/hr/hr-actions/create/page.tsx',
  'src/app/hr/hr-actions/[id]/page.tsx',
  'src/app/hr/action-history/page.tsx',
  'src/app/hr/complaints/page.tsx',
  'src/app/hr/complaints/[id]/page.tsx',
  'src/app/hr/announcements/page.tsx',
  
  // Payroll pages
  'src/app/hr/payroll/page.tsx',
  'src/app/hr/payroll/employees/page.tsx',
  'src/app/hr/payroll/history/page.tsx',
  'src/app/hr/payroll/payslips/page.tsx',
  'src/app/hr/payroll/processing/page.tsx',
  'src/app/hr/payroll/reports/page.tsx',
  'src/app/hr/payroll/salary-structure/page.tsx',
  'src/app/hr/payroll/salary-structure/new/page.tsx',
  
  // Shared components
  'src/components/MetricCard.tsx',
  'src/components/CreateEmployeeModal.tsx',
  'src/components/EditEmployeeModal.tsx',
  'src/components/AssignProcessModal.tsx',
  'src/components/BulkAssignProcessModal.tsx',
  'src/components/ProcessPayrollModal.tsx',
  'src/components/PayrollDetailsDrawer.tsx',
  'src/components/PayrollReportDrawer.tsx',
  'src/components/SalaryDetailsDrawer.tsx',
  'src/components/NotificationDrawer.tsx',
  'src/components/NotificationBell.tsx',
  'src/components/NotificationToastProvider.tsx',
  'src/components/SecurePolicyViewer.tsx',
  'src/components/SalaryStructureForm.tsx',
  
  // Layout
  'src/layouts/HRLayout.tsx',
];

function applyReplacements(content) {
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
console.log('🎨 Starting comprehensive HR Panel light mode fix...\n');

let stats = {
  total: 0,
  updated: 0,
  unchanged: 0,
  failed: 0,
  notFound: 0
};

for (const file of hrPanelFiles) {
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

console.log('\n✅ HR Panel light mode fix complete!');

