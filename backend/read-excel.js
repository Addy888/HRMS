const XLSX = require('xlsx');

// Read the biometric Excel file
const fileName = process.argv[2] || 'test-attendance-upload.xlsx';
console.log('Reading file:', fileName);
const wb = XLSX.readFile(fileName);
const sheetName = wb.SheetNames[0];
const ws = wb.Sheets[sheetName];

// Get data with raw values
const data = XLSX.utils.sheet_to_json(ws, { 
  header: 1, 
  raw: false, 
  defval: '' 
});

console.log('=== FILE INFO ===');
console.log('Sheet Name:', sheetName);
console.log('Total Rows:', data.length);

console.log('\n=== FIRST 5 ROWS OF EXCEL ===');
console.log(JSON.stringify(data.slice(0, 5), null, 2));

console.log('\n=== COLUMN NAMES (Row 1) ===');
console.log(JSON.stringify(data[0], null, 2));

console.log('\n=== CHECKING FOR PERIOD INFO ===');
// Look for Period row (might be in row 0 or nearby)
for (let i = 0; i < Math.min(5, data.length); i++) {
  const row = data[i];
  if (Array.isArray(row)) {
    const firstCell = row[0];
    if (firstCell && (firstCell.includes('Period') || firstCell.includes('period'))) {
      console.log(`Found Period in row ${i + 1}:`, row);
    }
  }
}
