const fs = require('fs');
const path = require('path');

// Define the replacements
const replacements = [
  // Modal/Dialog overlays - keep dark for overlay effect
  { from: /className="fixed inset-0 bg-black\/80 backdrop-blur-sm/g, to: 'className="fixed inset-0 bg-black/50 backdrop-blur-sm' },
  { from: /className="fixed inset-0 bg-black\/60 backdrop-blur-sm/g, to: 'className="fixed inset-0 bg-black/50 backdrop-blur-sm' },
  
  // Input fields - change to white background
  { from: /bg-black border border-border rounded-lg text-foreground/g, to: 'bg-background border border-border rounded-lg text-foreground' },
  
  // Table headers - change to light background
  { from: /bg-black\/40 border-b border-border/g, to: 'bg-muted/50 border-b border-border' },
  
  // Content sections with dark background
  { from: /bg-black\/40 rounded-lg p-4 border border-border/g, to: 'bg-muted/30 rounded-lg p-4 border border-border' },
  
  // Pagination buttons
  { from: /bg-black hover:bg-secondary disabled:opacity-30/g, to: 'bg-muted hover:bg-secondary disabled:opacity-30' },
  
  // Generic bg-black replacements (inputs, selects, textareas)
  { from: /className="([^"]*?)bg-black([^"]*?)"/g, to: 'className="$1bg-background$2"' },
];

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  replacements.forEach(({ from, to }) => {
    if (content.match(from)) {
      content = content.replace(from, to);
      modified = true;
    }
  });
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed: ${path.relative(process.cwd(), filePath)}`);
    return true;
  }
  
  return false;
}

function walkDirectory(dir, fileCallback) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      walkDirectory(filePath, fileCallback);
    } else if (stat.isFile() && (file.endsWith('.tsx') || file.endsWith('.ts'))) {
      fileCallback(filePath);
    }
  });
}

// Main execution
const hrAppDir = path.join(__dirname, 'src', 'app', 'hr');
const hrComponentsDir = path.join(__dirname, 'src', 'components');

console.log('🔧 Fixing HR Panel Light Mode...\n');

let filesFixed = 0;

// Fix HR app pages
if (fs.existsSync(hrAppDir)) {
  console.log('📁 Processing HR app pages...');
  walkDirectory(hrAppDir, (filePath) => {
    if (fixFile(filePath)) {
      filesFixed++;
    }
  });
}

// Fix HR-related components
if (fs.existsSync(hrComponentsDir)) {
  console.log('\n📁 Processing HR components...');
  walkDirectory(hrComponentsDir, (filePath) => {
    // Only fix files that are likely HR-related
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('/hr/') || content.includes('HR') || content.includes('bg-black')) {
      if (fixFile(filePath)) {
        filesFixed++;
      }
    }
  });
}

console.log(`\n✅ Light mode fix complete! ${filesFixed} files modified.`);
console.log('\nNext steps:');
console.log('1. Review the changes');
console.log('2. Run: npm run build');
console.log('3. Test the HR panel in light mode');
