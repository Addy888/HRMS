# BIOMETRIC ATTENDANCE - NAME-ONLY MATCHING IMPLEMENTATION

## 🎯 REQUIREMENT
Match biometric Excel employees to HRMS employees using **EMPLOYEE NAME ONLY**.

## 🔴 CURRENT PROBLEM
The system currently has FCS0160 and FCS0014 - **BOTH have the same name "Aditya day"**.

When using NAME-ONLY matching, this creates an **AMBIGUOUS MATCH** that must be handled safely.

## ✅ SOLUTION APPROACH

### 1. Normalize Names Function
```typescript
private normalizeName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' '); // Multiple spaces → single space
}
```

### 2. Match By Name ONLY
```typescript
private async matchEmployeesByNameOnly(
  rows: any[],
  organizationId: string,
): Promise<{
  matched: ExcelRowImportResult[];
  unmatched: ExcelRowImportResult[];
  ambiguous: ExcelRowImportResult[];
}> {
  // Get all employees
  const employees = await this.prisma.employee.findMany({
    where: { organizationId },
    select: {
      id: true,
      employeeId: true,
      firstName: true,
      lastName: true,
    }
  });
  
  // Group employees by normalized name
  const employeesByName = new Map<string, typeof employees>();
  employees.forEach(emp => {
    const fullName = `${emp.firstName} ${emp.lastName}`;
    const normalized = this.normalizeName(fullName);
    
    if (!employeesByName.has(normalized)) {
      employeesByName.set(normalized, []);
    }
    employeesByName.get(normalized)!.push(emp);
  });
  
  const matched: ExcelRowImportResult[] = [];
  const unmatched: ExcelRowImportResult[] = [];
  const ambiguous: ExcelRowImportResult[] = [];
  
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNumber = i + 2;
    
    // Find Name column
    const nameColumn = this.detectNameColumn(Object.keys(row));
    if (!nameColumn || !row[nameColumn]) {
      unmatched.push({
        rowNumber,
        employeeId: `ROW-${rowNumber}`,
        employeeName: 'UNKNOWN',
        rawData: JSON.stringify(row),
        success: false,
        employeeFound: false,
        error: 'No name column found in Excel',
      });
      continue;
    }
    
    const excelName = row[nameColumn].toString().trim();
    const normalizedExcelName = this.normalizeName(excelName);
    
    console.log(`[BIOMETRIC-NAME-MATCH] Row ${rowNumber}: Excel Name="${excelName}", Normalized="${normalizedExcelName}"`);
    
    const matchingEmployees = employeesByName.get(normalizedExcelName) || [];
    
    if (matchingEmployees.length === 0) {
      // No match found
      console.log(`[BIOMETRIC-NAME-MATCH] ❌ No HRMS employee found with name "${excelName}"`);
      unmatched.push({
        rowNumber,
        employeeId: excelName,
        employeeName: excelName,
        rawData: JSON.stringify(row),
        success: false,
        employeeFound: false,
        error: `Employee not found by name: "${excelName}"`,
      });
    } else if (matchingEmployees.length === 1) {
      // Exact single match - SAFE
      const employee = matchingEmployees[0];
      console.log(`[BIOMETRIC-NAME-MATCH] ✅ Matched "${excelName}" → ${employee.employeeId}`);
      matched.push({
        rowNumber,
        employeeId: employee.employeeId,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        rawData: JSON.stringify(row),
        success: true,
        employeeFound: true,
        matchedEmployeeUUID: employee.id,
      });
    } else {
      // Multiple employees with same name - AMBIGUOUS
      const employeeIds = matchingEmployees.map(e => e.employeeId).join(', ');
      console.log(`[BIOMETRIC-NAME-MATCH] ⚠️ AMBIGUOUS: "${excelName}" matches ${matchingEmployees.length} employees: ${employeeIds}`);
      ambiguous.push({
        rowNumber,
        employeeId: excelName,
        employeeName: excelName,
        rawData: JSON.stringify(row),
        success: false,
        employeeFound: false,
        error: `Multiple employees found with name "${excelName}": ${employeeIds}. Cannot determine which employee.`,
      });
    }
  }
  
  return { matched, unmatched, ambiguous };
}
```

### 3. Detect Biometric Date Range
The Excel filename or content should indicate the period.

For "complete-attendance-september-2026.xlsx":
- Month: 9
- Year: 2026

Days 1-30 in Excel columns map to September 1-30, 2026.

### 4. Parse Biometric Punches
For each day column (e.g., "9"):
```
Value: "08:53\n18:06"
```

Split by newline, parse times:
- First punch: 08:53 → Check In
- Last punch: 18:06 → Check Out

### 5. Create Attendance Records
```typescript
for (const dayColumn of dateColumns) {
  const dayNum = parseInt(dayColumn);
  const punchesRaw = row[dayColumn];
  
  if (!punchesRaw) continue;
  
  // Parse punch times
  const punches = punchesRaw.toString()
    .split(/[\n\r]+/)
    .map(p => p.trim())
    .filter(p => /^\d{1,2}:\d{2}$/.test(p));
  
  if (punches.length === 0) continue;
  
  const firstPunch = punches[0]; // Check In
  const lastPunch = punches[punches.length - 1]; // Check Out
  
  const attendanceDate = new Date(Date.UTC(year, month - 1, dayNum, 0, 0, 0, 0));
  
  const checkInTime = this.parsePunchTime(year, month, dayNum, firstPunch);
  const checkOutTime = punches.length > 1 
    ? this.parsePunchTime(year, month, dayNum, lastPunch)
    : null;
  
  const workingHours = checkInTime && checkOutTime
    ? (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60)
    : 0;
  
  // Apply HRMS business rules for status
  const status = this.calculateAttendanceStatus(checkInTime, checkOutTime, workingHours);
  
  console.log(`[BIOMETRIC-DATE] Employee: ${employee.employeeId}, Date: ${attendanceDate.toISOString()}, Punches: ${firstPunch}, ${lastPunch}`);
  
  await this.prisma.attendance.upsert({
    where: {
      organizationId_employeeId_date: {
        organizationId: employee.organizationId,
        employeeId: employee.id,
        date: attendanceDate,
      }
    },
    create: {
      organizationId: employee.organizationId,
      employeeId: employee.id,
      date: attendanceDate,
      checkInTime,
      checkOutTime,
      workingHours,
      status,
      source: 'BIOMETRIC',
      remarks: `Imported from biometric Excel: ${fileName}`,
    },
    update: {
      checkInTime,
      checkOutTime,
      workingHours,
      status,
      remarks: `Updated from biometric Excel: ${fileName}`,
    }
  });
  
  console.log(`[BIOMETRIC-SAVE] Employee: ${employee.employeeId}, Date: ${attendanceDate.toISOString().split('T')[0]}, CheckIn: ${firstPunch}, CheckOut: ${lastPunch}, Attendance ID: saved`);
}
```

## 📊 SUCCESS CRITERIA

### Before Fix
```
Import: 124 successful
Employee calendar: BLANK (0 records)
```

### After Fix
```
Import results:
- Matched by name: 100
- Unmatched (name not found): 20
- Ambiguous (duplicate names): 4

Employee opens /employee/attendance
Selects September 2026
Backend query:
  WHERE employeeId = uuid
  AND date >= 2026-09-01
  AND date <= 2026-09-30

Returns: 30 attendance records
Calendar displays: POPULATED with biometric data
```

## 🔧 FILES TO MODIFY

1. **attendance-import.service.ts**
   - Replace `matchEmployees()` with `matchEmployeesByNameOnly()`
   - Remove employee ID matching logic
   - Add ambiguous duplicate name handling
   - Add biometric punch parsing logic
   - Add proper date range detection from filename

2. **NO OTHER FILES NEED CHANGES**
   - Employee attendance API already correct
   - Frontend calendar already correct
   - Database schema already correct

## ⚠️ HANDLING DUPLICATE NAMES

**Current Database:**
- FCS0160: "Aditya day"
- FCS0014: "Aditya day"

**Solution:**
Mark rows with duplicate name matches as FAILED with clear error:
```
"Multiple employees found with name 'Aditya day': FCS0160, FCS0014. Cannot determine which employee."
```

**Import History will show:**
- Failed rows: 1
- Error report: Detailed ambiguous match info

**HR Action Required:**
HR must either:
1. Rename one employee in HRMS to make names unique
2. Or manually enter attendance for ambiguous employees

This is SAFER than randomly picking one of the duplicate employees.

## 🧪 TEST CASE

**Excel Row:**
```
No: 123
Name: Sumaiyya Tamboli
Day 9: 08:53
        18:06
```

**HRMS Employee:**
```
employeeId: FCS-HR-ADMIN-001
firstName: "Sumaiyya"
lastName: "Tamboli"
Full Name: "Sumaiyya Tamboli"
```

**Expected Match:**
```
Excel "Sumaiyya Tamboli" (normalized: "sumaiyya tamboli")
HRMS "Sumaiyya Tamboli" (normalized: "sumaiyya tamboli")
✅ MATCH
```

**Expected Attendance:**
```
Date: 2026-09-09
Check In: 2026-09-09 08:53:00 UTC
Check Out: 2026-09-09 18:06:00 UTC
Working Hours: 9.22
Status: PRESENT
```

**Employee Calendar:**
```
9 SEP
PRESENT
IN: 08:53 AM
OUT: 06:06 PM
Working Hours: 9h 13m
```

---

**Implementation Status:** Ready to implement  
**Database Changes:** None required  
**Risk Level:** Low (name matching is deterministic and safe)

