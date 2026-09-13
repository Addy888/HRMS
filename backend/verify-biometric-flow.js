const fs = require('fs');
const XLSX = require('xlsx');
const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  const orgId = '3245af42-a1a7-423c-b7d0-05e7f7046a20';

  const file = fs.readFileSync('./test-attendance-upload.xlsx');
  const workbook = XLSX.read(file, { type: 'buffer' });
  const ws = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: '' });

  const employees = [];
  for (let i = 0; i < data.length - 1; i++) {
    const row = data[i] || [];
    const rowText = row.map(cell => (cell ?? '').toString().trim().toLowerCase()).join(' ');
    if (!rowText.includes('no :') && !rowText.includes('no:') && !rowText.includes('name :') && !rowText.includes('name:')) continue;

    let biometricNo = '';
    const noIndex = row.findIndex(cell => ['no :', 'no:', 'no'].includes((cell ?? '').toString().trim().toLowerCase()));
    if (noIndex >= 0) {
      for (let j = noIndex + 1; j < row.length; j++) {
        const candidate = String(row[j] ?? '').trim();
        const cleaned = candidate.replace(/[^0-9]/g, '');
        if (cleaned) { biometricNo = cleaned; break; }
      }
    }

    let name = '';
    for (let j = 0; j < row.length; j++) {
      const val = String(row[j] ?? '').trim();
      const norm = val.toLowerCase().replace(/\s+/g, ' ');
      if (norm === 'name :' || norm === 'name:' || norm === 'name') {
        for (let k = j + 1; k < row.length; k++) {
          const cand = String(row[k] ?? '').trim();
          if (!cand || /^\d+$/.test(cand)) continue;
          name = cand;
          break;
        }
      }
    }

    const nextRow = data[i + 1] || [];
    const punchMap = new Map();
    for (let col = 0; col < nextRow.length; col++) {
      const cell = String(nextRow[col] ?? '').trim();
      const values = cell.replace(/\r/g, '\n')
        .split(/\n+/)
        .flatMap(part => part.split(/\s+/))
        .map(v => v.trim())
        .filter(v => /^\d{1,2}:\d{2}$/.test(v));
      if (values.length) punchMap.set(col > 1 ? col - 1 : col + 1, values);
    }

    employees.push({ biometricNo, name, days: punchMap.size });
  }

  console.log('RAW_EMPLOYEE_COUNT=' + employees.length);
  console.log(JSON.stringify(employees.slice(0, 10), null, 2));

  const dbEmployees = await prisma.employee.findMany({
    where: { organizationId: orgId },
    select: { id: true, employeeId: true, firstName: true, lastName: true },
  });

  const norm = (v) => (v || '').toLowerCase().trim().replace(/\s+/g, ' ');
  const matches = [];
  let ambiguous = 0;
  let unmatched = 0;
  for (const emp of employees) {
    const name = emp.name || '';
    const candidates = dbEmployees.filter(e => norm(e.firstName) === norm(name));
    if (candidates.length === 1) {
      matches.push({ excelName: name, employeeId: candidates[0].employeeId, firstName: candidates[0].firstName, id: candidates[0].id });
    } else if (candidates.length > 1) {
      ambiguous++;
    } else {
      unmatched++;
    }
  }

  console.log('MATCHED=' + matches.length);
  console.log('AMBIGUOUS=' + ambiguous);
  console.log('UNMATCHED=' + unmatched);
  console.log(JSON.stringify(matches.slice(0, 12), null, 2));

  const sample = matches[0];
  if (sample) {
    const rows = await prisma.attendance.findMany({
      where: {
        organizationId: orgId,
        employeeId: sample.id,
        date: { gte: new Date('2026-09-01T00:00:00Z'), lt: new Date('2026-10-01T00:00:00Z') },
      },
      select: { id: true, employeeId: true, date: true, status: true, source: true, checkInTime: true, checkOutTime: true },
      orderBy: { date: 'asc' },
      take: 10,
    });
    console.log('ATTENDANCE_COUNT=' + rows.length);
    console.log(JSON.stringify(rows, null, 2));
  }

  await prisma.$disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });
