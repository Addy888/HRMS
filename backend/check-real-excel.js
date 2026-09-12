const XLSX = require('xlsx');
const path = require('path');

const file = 'uploads/attendance/be0640ae-2828-4929-a4db-e1cfddb89214.xlsx';
console.log('Reading:', file);

const wb = XLSX.readFile(file);
const ws = wb.Sheets[wb.SheetNames[0]];

// Get as JSON with header:1 (array format)
const data = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: '' });

console.log('\n=== FIRST 20 ROWS ===');
for (let i = 0; i < Math.min(20, data.length); i++) {
  console.log(`Row ${i}:`, data[i].slice(0, 15));
}

// Look for Period
for (let i = 0; i < Math.min(10, data.length); i++) {
  const row = data[i];
  const rowStr = JSON.stringify(row);
  if (rowStr.includes('Period') || rowStr.includes('period')) {
    console.log('\n=== FOUND PERIOD ROW ===');
    console.log(`Row ${i}:`, row);
  }
}

// Look for employee blocks
console.log('\n=== LOOKING FOR EMPLOYEE BLOCKS ===');
for (let i = 0; i < Math.min(50, data.length); i++) {
  const row = data[i];
  if (row[0] && row[0].toString().toLowerCase().includes('no')) {
    console.log(`Row ${i} (No):`, row.slice(0, 15));
    if (i + 1 < data.length) {
      console.log(`Row ${i + 1} (punches?):`, data[i + 1].slice(0, 15));
    }
  }
}
