# 📘 HR Guide: Biometric Attendance Import

## 🎯 Quick Start

The biometric attendance import now matches employees **BY NAME ONLY**. This means the system will look at the employee's **full name** in the Excel file and match it to the HRMS database.

---

## ✅ How It Works

### Name Matching Rules:
- ✅ **Case doesn't matter**: "Sumaiyya Tamboli" = "SUMAIYYA TAMBOLI" = "sumaiyya tamboli"
- ✅ **Extra spaces ignored**: "Sumaiyya  Tamboli" = "Sumaiyya Tamboli"
- ✅ **Leading/trailing spaces removed**: "  Sumaiyya Tamboli  " = "Sumaiyya Tamboli"

### What Gets Imported:
- ✅ **Biometric punch times** (check-in and check-out)
- ✅ **Working hours** (automatically calculated)
- ✅ **Attendance status** (PRESENT, LATE, HALF_DAY, etc.)
- ✅ **Correct dates** (taken from filename: e.g., "september-2026.xlsx")

---

## 📋 Excel File Requirements

### Required Columns:
1. **Name** (or Employee Name, Agent Name)
   - Must match HRMS employee's full name **exactly**
   - Example: "Sumaiyya Tamboli"

2. **Day columns** (1, 2, 3, ..., 31)
   - Each column represents a day of the month
   - Contains punch times in format: `08:53` or `08:53\n18:06`

### Filename Format:
- **MUST include month name**: january, february, march, april, may, june, july, august, september, october, november, december
- **MUST include year**: 2024, 2025, 2026, etc.
- ✅ Good examples:
  - `september-2026.xlsx`
  - `complete-attendance-september-2026.xlsx`
  - `Attendance_September_2026.xlsx`
- ❌ Bad examples:
  - `attendance.xlsx` (no month/year)
  - `09-2026.xlsx` (month as number, not name)

### Punch Time Format:
```
Single punch:
08:53

Multiple punches (check-in and check-out):
08:53
18:06

(Or on one line with line break)
```

---

## 🚨 Common Issues & Solutions

### Issue 1: "Multiple employees found with name 'XYZ'"
**Cause**: Two or more employees in HRMS have the exact same name.

**Example**: 
- FCS0160: "Aditya day"
- FCS0014: "Aditya day"

**Solution Options**:
1. **Rename one employee** in HRMS to make names unique
   - Example: Change FCS0014 to "Aditya day (IT)"
2. **Manually enter attendance** for affected employees
3. **Contact IT** to add employee ID column support (future enhancement)

**Status in Import**: ⚠️ FAILED

---

### Issue 2: "Employee not found by name"
**Cause**: Name in Excel doesn't match any HRMS employee name.

**Common Reasons**:
- ❌ Typo in Excel: "Sumaiya Tamboli" (missing 'y')
- ❌ Name changed in HRMS after Excel generation
- ❌ Using nickname instead of full legal name
- ❌ Different name format: "Tamboli, Sumaiyya" vs "Sumaiyya Tamboli"

**Solution**:
1. **Check HRMS employee list** for exact name spelling
2. **Update Excel** to match HRMS name exactly
3. **Re-upload** the corrected file

**Status in Import**: ❌ FAILED

---

### Issue 3: Attendance not appearing in employee calendar
**Cause**: Import might have failed, or employee is checking wrong month.

**Solution**:
1. **Check Import History** page for status (COMPLETED vs PARTIAL vs FAILED)
2. **Verify filename** has correct month/year
3. **Ask employee** to select the correct month in calendar
4. **Check failed rows** in Import History error report

---

## 📊 Import History Status Codes

| Status | Meaning |
|--------|---------|
| ✅ **COMPLETED** | All rows imported successfully |
| ⚠️ **PARTIAL** | Some rows succeeded, some failed |
| ❌ **FAILED** | No rows imported successfully |

---

## 🔍 How to Check Import Success

### Step 1: Check Import History
1. Navigate to **Attendance → Import History**
2. Find your uploaded file
3. Check the status:
   - **Total Rows**: Number of employees in Excel
   - **Successful**: Employees matched and imported
   - **Failed**: Employees that couldn't be matched

### Step 2: Review Failed Rows (if any)
1. Click on the import record
2. View **Error Report** section
3. For each failed row:
   - **Row Number**: Excel row number
   - **Employee Name**: Name from Excel
   - **Error**: Reason for failure

### Step 3: Test with Sample Employee
1. Login as one of the imported employees
2. Navigate to **Employee → Attendance**
3. Select the correct month (from filename)
4. Verify attendance records appear

---

## ✅ Best Practices

### Before Upload:
1. ✅ **Download HRMS employee list** to verify exact names
2. ✅ **Check for duplicate names** in HRMS
3. ✅ **Name the file correctly** with month and year
4. ✅ **Use consistent name format** (First Name + Last Name)

### Excel Preparation:
1. ✅ **Copy-paste names** from HRMS export (reduces typos)
2. ✅ **Remove extra spaces** from names
3. ✅ **Use proper column headers**: Name, 1, 2, 3, etc.
4. ✅ **Format punch times** as text (HH:MM format)

### After Upload:
1. ✅ **Review preview** before confirming
2. ✅ **Check success/failed counts**
3. ✅ **Review error report** for failed rows
4. ✅ **Test with sample employee** login

---

## 📞 Need Help?

### If employees have duplicate names:
- Contact IT to add employee ID matching support
- Or rename employees in HRMS to make names unique

### If names frequently change:
- Establish name change notification process
- Re-export employee list before creating biometric Excel

### If many import failures:
- Share Import History error report with IT
- Provide sample Excel file for debugging

---

## 🧪 Test Before Full Import

### Test with Single Employee:
1. Create test Excel with **ONE employee** (e.g., Sumaiyya Tamboli)
2. Add punch times for a few days
3. Upload and confirm import
4. Login as that employee and verify calendar
5. If successful, proceed with full import

---

## 📅 Monthly Import Checklist

- [ ] Export current employee list from HRMS
- [ ] Check for duplicate employee names
- [ ] Rename file with correct month/year (e.g., `september-2026.xlsx`)
- [ ] Verify Name column matches HRMS exactly
- [ ] Test import with 1-2 employees first
- [ ] Upload full file
- [ ] Review Import History for errors
- [ ] Notify employees to check their calendars
- [ ] Fix any failed rows and re-import

---

**Last Updated**: September 12, 2026  
**System Version**: Biometric Name-Only Matching v1.0
