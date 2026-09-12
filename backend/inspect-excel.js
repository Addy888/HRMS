const XLSX = require('xlsx');

const file = 'uploads/attendance/be0640ae-2828-4929-a4db-e1cfddb89214.xlsx';
const wb = XLSX.readFile(file);
const ws = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: '' });

console.log('=== INSPECTING BIOMETRIC EXCEL ===\n');

// Find employees with "aditya" in name
for (let i = 0; i < data.length - 1; i++) {
  const row = data[i];
  const rowStr = JSON.stringify(row).toLowerCase();
  
  if (rowStr.includes('no :') && rowStr.includes('name :')) {
    let bioNo = '', name = '';
    
    for (let j = 0; j < row.length; j++) {
      if ((row[j] || '').toString().toLowerCase() === 'no :' && j + 2 < row.length) {
        bioNo = (row[j + 2] || '').toString().trim();
      }
      if ((row[j] || '').toString().toLowerCase() === 'name :' && j + 2 < row.length) {
        name = (row[j + 2] || '').toString().trim();
      }
    }
    
    if (name.toLowerCase().includes('aditya') || bioNo === '2' || bioNo === '14') {
      console.log(`Row ${i}: No: ${bioNo}, Name: ${name}`);
      
      // Show punch data from next row
      const punchRow = data[i + 1];
      console.log(`Punch Row ${i + 1}:`, punchRow.slice(0, 15));
      console.log('');
    }
  }
}
