# HR Attendance Import - Quick Guide

## 📋 Overview
This feature allows HR and Admin users to bulk-upload employee attendance records using Excel files.

---

## 🚀 How to Import Attendance

### Step 1: Download the Template
1. Go to **HR → Attendance Management**
2. Click the **"Import Excel"** button (top right)
3. Click **"Download Template"** button
4. Save the Excel file to your computer

### Step 2: Fill the Template
Open the downloaded Excel file and fill in the attendance data:

| Column | Required | Format | Example |
|--------|----------|--------|---------|
| Employee ID | ✅ Yes | As shown in system | FCS-2026-0001 |
| Date | ✅ Yes | YYYY-MM-DD | 2026-09-05 |
| Check In | ❌ Optional | HH:MM or HH:MM AM/PM | 09:30 or 09:30 AM |
| Check Out | ❌ Optional | HH:MM or HH:MM AM/PM | 19:15 or 07:15 PM |
| Status | ❌ Optional | PRESENT, LATE, etc. | PRESENT |

**Important Notes:**
- Employee ID must match exactly (copy from employee list)
- Date format: 2026-09-05 or 05/09/2026
- Times are optional (leave blank if not available)
- Monday attendance is not allowed (week off)

### Step 3: Upload the File
1. Click **"Select Excel File"** or drag-and-drop your file
2. Click **"Upload & Preview"**
3. Wait for validation to complete

### Step 4: Review the Preview
The system will show you:
- **Total Rows** - All rows in your file
- **Valid Rows** - ✅ Ready to import (green)
- **Invalid Rows** - ❌ Have errors (red)
- **Duplicates** - ⚠️ Already exist, will be updated (amber)

**Status Indicators:**
- 🟢 **VALID** - Row is correct and will be imported
- 🔴 **ERROR** - Row has problems (see error message)
- 🟡 **DUPLICATE** - Attendance already exists (will update)

### Step 5: Fix Errors (if any)
If you see red rows with errors:
1. Note the error messages
2. Go back to your Excel file
3. Fix the errors
4. Re-upload the file

**Common Errors:**
- "Employee not found" → Check Employee ID
- "Invalid date format" → Use YYYY-MM-DD
- "Invalid time format" → Use HH:MM or HH:MM AM/PM

### Step 6: Confirm Import
1. Review the summary statistics
2. Make sure valid rows count is correct
3. Click **"Confirm Import"**
4. Wait for completion (you'll see a success message)

### Step 7: Verify Import
1. Go to **"Import History"** (top right button)
2. Find your import in the list
3. Check the status:
   - ✅ **COMPLETED** - All rows imported successfully
   - ⚠️ **PARTIAL** - Some rows failed
   - ❌ **FAILED** - Import failed completely

4. If status is PARTIAL or FAILED:
   - Click the **"Errors"** button
   - Download the error report
   - Fix the errors
   - Re-upload those rows

---

## 📊 Understanding Import Results

### Statistics Explained:
- **Total Rows** - All data rows in your Excel
- **Successful** - Rows imported without issues
- **Failed** - Rows with errors (not imported)
- **Duplicates** - Existing records that were updated

### Import Status:
- **PROCESSING** - Import is in progress
- **COMPLETED** - All rows imported successfully
- **PARTIAL** - Some rows succeeded, some failed
- **FAILED** - Import could not be completed

---

## ⚠️ Important Rules

### Business Rules (Automatic):
1. **Monday = Week Off** - Cannot import Monday attendance
2. **Sunday = Working Day** - Sunday attendance is allowed
3. **Late After 10:10 AM** - Automatically marked as LATE
4. **Early Checkout (before 7 PM)** - Automatically marked as HALF_DAY
5. **Checkout after 7 PM** - Status remains PRESENT/LATE

### Duplicate Handling:
- If attendance exists for the same employee and date, it will be **updated**
- You can safely upload the same file twice (no duplicates created)
- Existing manual attendance will be replaced by imported data

### Data Safety:
- ✅ Existing employees are not deleted
- ✅ Only specified dates are updated
- ✅ Other attendance data remains unchanged
- ✅ Full audit trail is maintained

---

## 🔍 Tips & Best Practices

### Before Upload:
1. ✅ Use the official template (don't create your own Excel)
2. ✅ Copy Employee IDs from the system (don't type manually)
3. ✅ Use consistent date format (YYYY-MM-DD is safest)
4. ✅ Double-check times (AM/PM if using 12-hour format)
5. ✅ Remove empty rows from bottom of Excel

### During Upload:
1. ✅ Wait for preview to complete
2. ✅ Read all error messages carefully
3. ✅ Check warnings even if rows are valid
4. ✅ Don't refresh page during import

### After Import:
1. ✅ Verify import status in history
2. ✅ Download error report if any failures
3. ✅ Check a few sample employee records
4. ✅ Keep the original Excel file for reference

---

## ❓ Frequently Asked Questions

### Q: Can I import attendance for future dates?
**A:** Yes, you can import attendance for any date (past or future).

### Q: What happens if I upload the same file twice?
**A:** The system will update the existing records. No duplicates are created.

### Q: Can I import partial attendance (only check-in)?
**A:** Yes, leave Check Out empty. You can update it later.

### Q: How do I get Employee IDs?
**A:** Go to HR → Employees → Copy the Employee ID column.

### Q: What if employee doesn't exist?
**A:** The row will be marked as invalid. Create the employee first.

### Q: Can I edit attendance after import?
**A:** Yes, you can manually edit from the Attendance page or re-import.

### Q: What's the maximum file size?
**A:** 5MB (approximately 50,000 rows).

### Q: How long does import take?
**A:** Small files (< 100 rows): Few seconds  
Medium files (100-1000 rows): 10-30 seconds  
Large files (1000+ rows): 1-2 minutes

### Q: Can employees import their own attendance?
**A:** No, only HR and Admin users can import attendance.

### Q: What if import gets stuck?
**A:** Wait for 30 minutes (session timeout) and try again. Contact IT if issue persists.

---

## 📞 Support

### Need Help?
- **Technical Issues:** Contact IT Support
- **Import Errors:** Review this guide and error messages
- **Employee Data:** Check with HR Admin
- **System Access:** Contact System Administrator

### Common Issues:

**Problem:** "File type not supported"  
**Solution:** Use Excel format (.xlsx or .xls), not CSV or PDF

**Problem:** "File too large"  
**Solution:** Split into multiple smaller files

**Problem:** "Session expired"  
**Solution:** Re-upload the file (preview sessions expire after 30 minutes)

**Problem:** "Permission denied"  
**Solution:** Check your role (must be HR, HR_ADMIN, or HR_USER)

**Problem:** "Monday attendance rejected"  
**Solution:** This is correct - Monday is a week off (business rule)

---

## 📝 Quick Checklist

Before importing, make sure:
- [ ] I have downloaded the official template
- [ ] Employee IDs are copied from the system
- [ ] Dates are in YYYY-MM-DD format
- [ ] Times are in HH:MM or HH:MM AM/PM format
- [ ] No empty rows in the Excel file
- [ ] File size is under 5MB
- [ ] I have reviewed the preview
- [ ] I have checked for errors

After importing, verify:
- [ ] Import status is COMPLETED or PARTIAL
- [ ] Statistics match expectations
- [ ] Error report downloaded (if any failures)
- [ ] Sample records verified in the system
- [ ] Original Excel file saved for reference

---

**Last Updated:** September 5, 2026  
**Version:** 1.0
