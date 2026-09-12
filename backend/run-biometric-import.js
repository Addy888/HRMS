const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const XLSX = require('xlsx');

const prisma = new PrismaClient();

const orgId = '3245af42-a1a7-423c-b7d0-05e7f7046a20';
const userId = 'ff74b9de-6a62-4118-9838-23dd335fb903';

// Parse biometric Excel
function parseBiometricExcel(filePath) {
  const wb = XLSX.readFile(filePath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: '' });

  // Extract Period
  let period = null;
  for (let i = 0; i < 10; i++) {
    for (const cell of data[i] || []) {
      const match = cell.toString().match(/(\d{4})\/(\d{2})\/(\d{2})\s*~\s*(\d{2})\/(\d{2})/);
      if (match) {
        period = {
          startYear: parseInt(match[1]),
          startMonth: parseInt(match[2]),
          startDay: parseInt(match[3]),
          endMonth: parseInt(match[4]),
          endDay: parseInt(match[5]),
        };
        break;
      }
    }
    if (period) break;
  }

  if (!period) throw new Error('Period not found');

  // Extract employees
  const employees = [];
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
      
      // Parse punches from next row
      const punchRow = data[i + 1];
      const punches = new Map();
      
      for (let col = 2; col < Math.min(14, punchRow.length); col++) {
        const dayNum = col - 1;
        const cell = (punchRow[col] || '').toString().trim();
        
        if (cell) {
          const times = cell.split(/[\r\n]+/).map(t => t.trim()).filter(t => /^\d{1,2}:\d{2}$/.test(t));
          if (times.length > 0) {
            punches.set(dayNum, times);
          }
        }
      }
      
      employees.push({ bioNo, name, punches });
    }
  }

  return { period, employees };
}

async function importBiometric() {
  console.log('=== BIOMETRIC IMPORT START ===');
  
  const file = 'uploads/attendance/be0640ae-2828-4929-a4db-e1cfddb89214.xlsx';
  const { period, employees } = parseBiometricExcel(file);
  
  console.log(`Period: ${period.startYear}-${period.startMonth}-${period.startDay} to ${period.endMonth}-${period.endDay}`);
  console.log(`Employees: ${employees.length}`);
  
  // Get DB employees
  const dbEmployees = await prisma.employee.findMany({
    where: { organizationId: orgId },
    select: { id: true, employeeId: true, firstName: true, lastName: true }
  });
  
  console.log(`DB Employees: ${dbEmployees.length}`);
  
  let created = 0, updated = 0, skipped = 0;
  
  for (const emp of employees) {
    let dbEmp = null;
    let matchMethod = '';

    // Strategy 1: Match by name (firstName only, normalized)
    if (emp.name) {
      const normName = emp.name.toLowerCase().trim();
      const matches = dbEmployees.filter(
        (e) => e.firstName.toLowerCase().trim() === normName,
      );

      if (matches.length === 1) {
        dbEmp = matches[0];
        matchMethod = 'NAME';
      } else if (matches.length > 1) {
        console.log(
          `[BIOMETRIC-MATCH] AMBIGUOUS: No: ${emp.bioNo}, Name: ${emp.name} - ${matches.length} employees with firstName match`,
        );
        matchMethod = 'AMBIGUOUS_NAME';
      }
    }

    // Strategy 2: If name match failed or ambiguous, try biometric number -> employee code
    if (!dbEmp && emp.bioNo) {
      const employeeCode = `FCS${emp.bioNo.padStart(4, '0')}`;
      const codeMatch = dbEmployees.find((e) => e.employeeId === employeeCode);
      if (codeMatch) {
        dbEmp = codeMatch;
        matchMethod = 'BIOMETRIC_NO';
        console.log(
          `[BIOMETRIC-MATCH] FALLBACK: No: ${emp.bioNo} -> Code: ${employeeCode}`,
        );
      }
    }

    // If still no match, skip
    if (!dbEmp) {
      console.log(
        `[BIOMETRIC-SKIP] No: ${emp.bioNo}, Name: ${emp.name} - No match (${matchMethod || 'NO_STRATEGY'})`,
      );
      skipped++;
      continue;
    }
    
    console.log(`[BIOMETRIC-MATCH] No: ${emp.bioNo}, Name: ${emp.name} -> UUID: ${dbEmp.id}, Code: ${dbEmp.employeeId} (Method: ${matchMethod})`);
    
    // Import punches
    for (const [dayNum, times] of emp.punches) {
      if (dayNum < period.startDay || dayNum > period.endDay) continue;
      if (times.length === 0) continue;
      
      const date = new Date(Date.UTC(period.startYear, period.startMonth - 1, dayNum, 0, 0, 0));
      const checkIn = parseTime(period.startYear, period.startMonth, dayNum, times[0]);
      const checkOut = times.length > 1 ? parseTime(period.startYear, period.startMonth, dayNum, times[times.length - 1]) : null;
      
      const workingHours = checkIn && checkOut ? (checkOut - checkIn) / (1000 * 60 * 60) : 0;
      const lateBy = calculateLate(checkIn);
      const status = calculateStatus(checkIn, checkOut, workingHours, lateBy);
      
      const existing = await prisma.attendance.findUnique({
        where: {
          organizationId_employeeId_date: {
            organizationId: orgId,
            employeeId: dbEmp.id,
            date,
          }
        }
      });
      
      const data = {
        organizationId: orgId,
        employeeId: dbEmp.id,
        date,
        checkInTime: checkIn,
        checkOutTime: checkOut,
        workingHours,
        status,
        lateBy,
        source: 'BIOMETRIC',
        isManualEntry: false,
        approvedBy: userId,
        approvedAt: new Date(),
        remarks: `Biometric No: ${emp.bioNo}`,
      };
      
      if (existing) {
        if (existing.source === 'BIOMETRIC') {
          await prisma.attendance.update({ where: { id: existing.id }, data });
          updated++;
          console.log(`[BIOMETRIC-SAVE] UPDATED: ${dbEmp.employeeId}, ${date.toISOString().split('T')[0]}, ${status}`);
        } else {
          console.log(`[BIOMETRIC-SKIP] MANUAL exists: ${dbEmp.employeeId}, ${date.toISOString().split('T')[0]}`);
        }
      } else {
        const rec = await prisma.attendance.create({ data });
        created++;
        console.log(`[BIOMETRIC-SAVE] CREATED: ${dbEmp.employeeId}, ${date.toISOString().split('T')[0]}, ${status}, ID=${rec.id}`);
      }
    }
  }
  
  console.log(`=== COMPLETE: Created=${created}, Updated=${updated}, Skipped=${skipped} ===`);
  
  // Verify FCS0014
  console.log('\n=== VERIFYING FCS0014 ===');
  const fcs14 = await prisma.employee.findFirst({
    where: { employeeId: 'FCS0014' },
    select: { id: true }
  });
  
  if (fcs14) {
    const records = await prisma.attendance.findMany({
      where: {
        employeeId: fcs14.id,
        date: { gte: new Date('2026-09-01'), lt: new Date('2026-10-01') }
      },
      orderBy: { date: 'asc' }
    });
    
    console.log(`FCS0014 September records: ${records.length}`);
    records.forEach(r => {
      console.log(`- ${r.date.toISOString().split('T')[0]}: ${r.status} (source: ${r.source})`);
    });
  }
  
  await prisma.$disconnect();
}

function parseTime(year, month, day, timeStr) {
  const [h, m] = timeStr.split(':');
  return new Date(Date.UTC(year, month - 1, day, parseInt(h), parseInt(m), 0));
}

function calculateLate(checkIn) {
  if (!checkIn) return 0;
  const minutes = checkIn.getUTCHours() * 60 + checkIn.getUTCMinutes();
  const threshold = 10 * 60 + 5; // 10:05
  return Math.max(0, minutes - threshold);
}

function calculateStatus(checkIn, checkOut, hours, late) {
  if (!checkIn) return 'ABSENT';
  if (checkIn.getUTCDay() === 1) return 'WEEK_OFF';
  if (late > 0) return 'LATE';
  if (checkOut && hours < 6) return 'HALF_DAY';
  return 'PRESENT';
}

importBiometric().catch(console.error);
