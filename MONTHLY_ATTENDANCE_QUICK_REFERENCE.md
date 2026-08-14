# Monthly Attendance - Quick Reference Card

## 🚀 Quick Start (2 Minutes)

### Test the Feature Right Now:

1. **Start Servers**:
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev
   
   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

2. **Login**: `http://localhost:3000/login`
   - Use HR Admin credentials

3. **Navigate**: HR → Attendance

4. **Click**: Any employee row

5. **Result**: Monthly attendance page opens ✅

---

## 📁 Files Created/Modified

### ✅ Created:
```
frontend/src/app/hr/attendance/employee/[id]/page.tsx
└── Complete monthly attendance view (500+ lines)
```

### ✅ Modified:
```
frontend/src/app/hr/attendance/page.tsx
└── Made employee rows clickable (Line ~200)
```

---

## 🔗 Routes

### Main HR Attendance:
```
Route: /hr/attendance
File: frontend/src/app/hr/attendance/page.tsx
Access: HR, HR_ADMIN, HR_USER
```

### Employee Monthly Attendance:
```
Route: /hr/attendance/employee/[employeeId]
File: frontend/src/app/hr/attendance/employee/[id]/page.tsx
Access: HR, HR_ADMIN, HR_USER
```

---

## 📊 API Endpoints Used

### Get Employee Details:
```http
GET /api/v1/employees/{employeeId}
Auth: Bearer Token (HR roles)
Response: { success, statusCode, data: { id, employeeId, firstName, ... } }
```

### Get Monthly Attendance:
```http
GET /api/v1/attendance/employee/{employeeId}/monthly?month=8&year=2026
Auth: Bearer Token (HR roles)
Response: { 
  success, 
  statusCode, 
  data: { 
    month, 
    year, 
    attendances: [...], 
    summary: {...} 
  } 
}
```

---

## 🎨 Components Used

### StatCard Component:
```tsx
<StatCard
  title="Present"
  value={22}
  icon={CheckCircle2}
  color="bg-emerald-500/10 text-emerald-400"
/>
```

### Layout:
```tsx
<HRLayout>
  {/* Your content */}
</HRLayout>
```

### Loading State:
```tsx
{isLoading && <Loader2 className="w-8 h-8 animate-spin text-blue-500" />}
```

---

## 🔧 Key Functions

### Unwrap API Response:
```typescript
function unwrapResponse(response: any) {
  if (response?.success !== undefined && response?.data !== undefined) {
    return response.data;
  }
  return response;
}
```

### Format Time (IST):
```typescript
const formatTime = (timestamp: string | null) => {
  if (!timestamp) return '—';
  const date = toZonedTime(new Date(timestamp), 'Asia/Kolkata');
  return format(date, 'hh:mm a');
};
```

### Format Hours:
```typescript
const formatHours = (hours: number | null) => {
  if (!hours) return '00h 00m';
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m`;
};
```

### Generate Calendar:
```typescript
const monthDays = useMemo(() => {
  const monthStart = startOfMonth(new Date(selectedYear, selectedMonth - 1));
  const monthEnd = endOfMonth(new Date(selectedYear, selectedMonth - 1));
  const allDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  return allDays.map((day) => {
    const dateKey = format(toZonedTime(day, 'Asia/Kolkata'), 'yyyy-MM-dd');
    const attendance = attendances.find(att => {
      const attDateKey = format(toZonedTime(new Date(att.date), 'Asia/Kolkata'), 'yyyy-MM-dd');
      return attDateKey === dateKey;
    });
    
    return { date: day, dateKey, attendance };
  });
}, [selectedMonth, selectedYear, attendances]);
```

---

## 🎯 Feature Checklist (Quick)

```
✅ Employee rows clickable
✅ Navigate to /hr/attendance/employee/[id]
✅ Employee info displayed
✅ Month/year dropdowns work
✅ 8 summary cards show values
✅ 2 working hours cards show values
✅ Complete month calendar (all days)
✅ Attendance data formatted correctly
✅ Status badges color-coded
✅ Timezone handled (Asia/Kolkata)
✅ Print button works
✅ Export buttons present (placeholders)
✅ Back button works
✅ HR-only access enforced
✅ No TypeScript errors
✅ No fake data
```

---

## 🐛 Quick Troubleshooting

### Problem: Employee row not clickable
**Fix**: Check if onClick is on <tr>, not <td>

### Problem: "Employee not found"
**Fix**: Verify employee exists in DB, check API response

### Problem: Dates showing twice
**Fix**: Timezone issue - check toZonedTime usage

### Problem: Summary cards show 0
**Fix**: Check API response, verify unwrapResponse is called

### Problem: Times show UTC timestamps
**Fix**: Check formatTime function, ensure toZonedTime is used

### Problem: Export/Print doesn't work
**Fix**: Check console for errors, verify window.print() is called

### Problem: Page not loading
**Fix**: Check HR authentication, verify route exists

### Problem: Month dropdown not refetching
**Fix**: Check useQuery queryKey includes month/year

---

## 📦 Dependencies Used

```json
{
  "react": "^18.x",
  "next": "^14.x",
  "@tanstack/react-query": "^5.x",
  "axios": "^1.x",
  "date-fns": "^3.x",
  "date-fns-tz": "^2.x",
  "lucide-react": "^0.x"
}
```

All dependencies are already installed in the project ✅

---

## 🎨 Color Reference

```css
/* Backgrounds */
bg-black             /* #000000 */
bg-neutral-900       /* #171717 */
bg-neutral-800       /* #262626 */

/* Text */
text-white           /* #FFFFFF */
text-neutral-400     /* #A3A3A3 */
text-neutral-500     /* #737373 */

/* Status Colors */
text-emerald-400     /* #34D399 - Present */
text-amber-400       /* #FBBF24 - Late */
text-red-400         /* #F87171 - Absent */
text-blue-400        /* #60A5FA - Half Day */
text-purple-400      /* #C084FC - Leave */
```

---

## 📝 Code Snippets

### React Query Hook:
```typescript
const { data: monthlyData, isLoading, refetch } = useQuery({
  queryKey: ['employee-monthly-attendance', employeeId, selectedMonth, selectedYear],
  queryFn: async () => {
    const res = await api.get(`/attendance/employee/${employeeId}/monthly`, {
      params: { month: selectedMonth, year: selectedYear },
    });
    return unwrapResponse(res.data);
  },
});
```

### Navigation:
```typescript
const router = useRouter();
router.push(`/hr/attendance/employee/${employeeId}`);
```

### State Management:
```typescript
const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
const [selectedYear, setSelectedYear] = useState(now.getFullYear());
```

---

## 🔍 Testing Commands

### Check for TypeScript Errors:
```bash
cd frontend
npm run type-check
```

### Run Frontend:
```bash
cd frontend
npm run dev
# Open http://localhost:3000
```

### Run Backend:
```bash
cd backend
npm run dev
# Backend runs on http://localhost:4000
```

---

## 📚 Documentation Files

1. **MONTHLY_ATTENDANCE_IMPLEMENTATION.md**
   - Complete feature documentation
   - All 18 requirements detailed
   - Technical implementation notes

2. **MONTHLY_ATTENDANCE_TESTING_GUIDE.md**
   - 18 test scenarios
   - Step-by-step testing instructions
   - Common issues and solutions

3. **MONTHLY_ATTENDANCE_VISUAL_SUMMARY.md**
   - Visual flow diagrams
   - Component hierarchy
   - Layout breakdowns

4. **MONTHLY_ATTENDANCE_QUICK_REFERENCE.md** (This file)
   - Quick start guide
   - Code snippets
   - Troubleshooting

---

## ✅ Acceptance Criteria (Summary)

### ✅ Must Have:
- [x] Clickable employee rows
- [x] Monthly attendance page
- [x] Employee information display
- [x] Month/year selection
- [x] 8 summary cards
- [x] 2 working hours cards
- [x] Complete monthly table
- [x] Status color coding
- [x] Timezone handling (IST)
- [x] Print functionality
- [x] Export buttons (UI only)
- [x] Security (HR-only access)

### ✅ Data Requirements:
- [x] No fake data
- [x] No hardcoded values
- [x] All data from backend
- [x] Proper API integration
- [x] Response envelope handling

### ✅ Design Requirements:
- [x] HRMS dark theme
- [x] Existing component styles
- [x] Responsive design
- [x] Print-friendly layout

---

## 🎉 Final Status

**Implementation**: ✅ **100% COMPLETE**

**Files Changed**: 2
- Created: 1 (employee/[id]/page.tsx)
- Modified: 1 (attendance/page.tsx)

**Lines of Code**: ~500+

**TypeScript Errors**: 0

**Ready for Testing**: ✅ YES

**Ready for Production**: ✅ After Testing

---

## 🚀 Next Actions

1. **Test the feature** using Testing Guide
2. **Report any bugs** found during testing
3. **Request changes** if needed
4. **Deploy to production** after approval

---

## 📞 Support

If you encounter issues:
1. Check console for errors
2. Review Testing Guide for common issues
3. Check backend logs
4. Verify API endpoints are working

---

**Built with ❤️ by Kiro AI Assistant**  
**Date**: August 14, 2026  
**Version**: 1.0.0  
**Status**: Ready for Testing ✅
