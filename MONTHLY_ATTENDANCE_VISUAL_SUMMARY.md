# Monthly Attendance Feature - Visual Summary

## 🎨 User Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    HR Attendance Page                        │
│                  /hr/attendance                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  📊 Summary Cards (Today's Statistics)                      │
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐           │
│  │ Total  │  │Present │  │  Late  │  │ Absent │           │
│  │  150   │  │  120   │  │   15   │  │   15   │           │
│  └────────┘  └────────┘  └────────┘  └────────┘           │
│                                                              │
│  📅 Date: [2026-08-14 ▼]                                    │
│                                                              │
│  🔍 Filters: [Search...] [All Statuses ▼]                  │
│                                                              │
│  📋 Attendance Table                                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Employee    │ ID     │ Dept  │ In    │ Out   │Status│  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ Aditya Addy │FCS0161 │Agent  │04:38PM│05:26PM│PRESENT│ ◄─┐
│  │ [CLICKABLE] │        │       │       │       │      │  │ │
│  │ (Hover: Blue)│       │       │       │       │      │  │ │
│  └──────────────────────────────────────────────────────┘  │ │
│                                                              │ │
└─────────────────────────────────────────────────────────────┘ │
                                                                 │
                              Click Employee Row                 │
                                      │                          │
                                      ▼                          │
┌─────────────────────────────────────────────────────────────┐ │
│              Employee Monthly Attendance Page                │ │
│          /hr/attendance/employee/[employeeId]                │ │
├─────────────────────────────────────────────────────────────┤ │
│                                                              │ │
│  ◄ Back to Attendance                                       │ │
│                                                              │ │
│  📅 Employee Attendance                                      │ │
│     Aditya Addy                                             │ │
│                                                              │ │
│  👤 Employee Information                                     │ │
│  ┌──────────────────────────────────────────────────────┐  │ │
│  │ Name: Aditya Addy    │ ID: FCS0161                   │  │ │
│  │ Department: Agent    │ Designation: Developer        │  │ │
│  └──────────────────────────────────────────────────────┘  │ │
│                                                              │ │
│  📆 Period: [August ▼] [2026 ▼]  🖨️Print 📊Excel 📄PDF   │ │
│                                                              │ │
│  📊 Summary Cards (Monthly Statistics)                      │ │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐              │ │
│  │Working │ │Present │ │  Late  │ │Half Day│              │ │
│  │  Days  │ │   22   │ │   3    │ │   1    │              │ │
│  │   26   │ └────────┘ └────────┘ └────────┘              │ │
│  └────────┘                                                 │ │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐              │ │
│  │ Absent │ │Week Off│ │ Leave  │ │Attend %│              │ │
│  │   0    │ │   5    │ │   0    │ │  100%  │              │ │
│  └────────┘ └────────┘ └────────┘ └────────┘              │ │
│                                                              │ │
│  ⏱️ Working Hours Summary                                   │ │
│  ┌─────────────────────┐ ┌─────────────────────┐          │ │
│  │ Total Working Hours │ │ Average Working Hrs │          │ │
│  │     176h 30m        │ │      08h 02m        │          │ │
│  └─────────────────────┘ └─────────────────────┘          │ │
│                                                              │ │
│  📅 Complete Monthly Attendance Table                       │ │
│  ┌──────────────────────────────────────────────────────┐  │ │
│  │Date   │Day     │In     │Out    │Hours  │Status │Late│  │ │
│  ├──────────────────────────────────────────────────────┤  │ │
│  │01 Aug │Saturday│09:58AM│07:00PM│09h02m │PRESENT│ — │  │ │
│  │02 Aug │Sunday  │  —    │  —    │00h00m │WEEKOFF│ — │  │ │
│  │03 Aug │Monday  │10:18AM│07:00PM│08h42m │LATE   │18m│  │ │
│  │04 Aug │Tuesday │09:30AM│06:30PM│09h00m │PRESENT│ — │  │ │
│  │05 Aug │Wednesday│  —   │  —    │00h00m │ABSENT │ — │  │ │
│  │...    │...     │...    │...    │...    │...    │...│  │ │
│  │31 Aug │Saturday│09:45AM│06:45PM│09h00m │PRESENT│ — │  │ │
│  └──────────────────────────────────────────────────────┘  │ │
│                                                              │ │
│  ✅ All 31 days shown (for August)                          │ │
│  ✅ Days with attendance show real data                     │ │
│  ✅ Days without attendance show "—" and "NOT_MARKED"      │ │
│                                                              │ │
└─────────────────────────────────────────────────────────────┘ │
                                                                 │
                                      Print Button               │
                                      │                          │
                                      ▼                          │
┌─────────────────────────────────────────────────────────────┐ │
│                    Print Preview                             │ │
├─────────────────────────────────────────────────────────────┤ │
│                                                              │ │
│  🏢 FCS HRMS                                                 │ │
│  Employee Attendance Report                                  │ │
│                                                              │ │
│  Employee: Aditya Addy (FCS0161)                            │ │
│  Period: August 2026                                        │ │
│                                                              │ │
│  [Summary Cards in Clean Layout]                            │ │
│  [Complete Attendance Table]                                │ │
│                                                              │ │
│  ✅ No sidebar or navigation                                │ │
│  ✅ Clean, printer-friendly format                          │ │
│  ✅ Black text on white background                          │ │
│                                                              │ │
└─────────────────────────────────────────────────────────────┘ │
                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎨 Page Layout Breakdown

### Employee Monthly Attendance Page Structure

```
┌───────────────────────────────────────────────────────────────┐
│ HEADER SECTION                                                │
│ ┌─────────────────────────────────────────────────────────┐  │
│ │ ◄ Back to Attendance                    [Actions ▶]     │  │
│ │ 📅 Employee Attendance                                   │  │
│ │    Aditya Addy                                           │  │
│ └─────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│ EMPLOYEE INFORMATION CARD                                     │
│ ┌─────────────────────────────────────────────────────────┐  │
│ │ Employee Name  │ Employee ID │ Department  │ Designation│  │
│ │ Aditya Addy    │ FCS0161     │ Agent       │ Developer  │  │
│ └─────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│ PERIOD SELECTOR                                               │
│ ┌─────────────────────────────────────────────────────────┐  │
│ │ 📅 Select Period: [August ▼] [2026 ▼]                   │  │
│ └─────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│ SUMMARY CARDS GRID (4 columns x 2 rows)                      │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│ │ 📅       │ │ ✅       │ │ ⚠️       │ │ ➗       │        │
│ │ Working  │ │ Present  │ │ Late     │ │ Half Day │        │
│ │ Days: 26 │ │ 22       │ │ 3        │ │ 1        │        │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘        │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│ │ ❌       │ │ 🏠       │ │ ☕       │ │ 📈       │        │
│ │ Absent   │ │ Week Off │ │ Leave    │ │ Attend % │        │
│ │ 0        │ │ 5        │ │ 0        │ │ 100%     │        │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘        │
└───────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│ WORKING HOURS CARDS (2 columns)                              │
│ ┌──────────────────────────┐ ┌──────────────────────────┐   │
│ │ ⏱️                       │ │ 📊                       │   │
│ │ Total Working Hours      │ │ Average Working Hours    │   │
│ │ 176h 30m                 │ │ 08h 02m                  │   │
│ └──────────────────────────┘ └──────────────────────────┘   │
└───────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│ MONTHLY ATTENDANCE TABLE                                      │
│ ┌─────────────────────────────────────────────────────────┐  │
│ │ Date  │ Day    │ Check In │ Check Out│ Hours │Status   │  │
│ ├─────────────────────────────────────────────────────────┤  │
│ │01 Aug │Saturday│ 09:58 AM │ 07:00 PM │09h02m │PRESENT  │  │
│ │02 Aug │Sunday  │    —     │    —     │00h00m │WEEK_OFF │  │
│ │03 Aug │Monday  │ 10:18 AM │ 07:00 PM │08h42m │LATE     │  │
│ │04 Aug │Tuesday │ 09:30 AM │ 06:30 PM │09h00m │PRESENT  │  │
│ │       │        │          │          │       │         │  │
│ │  ...  │  ...   │   ...    │   ...    │  ...  │  ...    │  │
│ │       │        │          │          │       │         │  │
│ │31 Aug │Saturday│ 09:45 AM │ 06:45 PM │09h00m │PRESENT  │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                               │
│ ✅ Scrollable for long months                                │
│ ✅ Shows all days (no gaps)                                  │
│ ✅ Color-coded status badges                                 │
└───────────────────────────────────────────────────────────────┘
```

---

## 🎨 Status Color Palette

```
┌────────────────────────────────────────────────┐
│ Status Colors (Dark Theme)                     │
├────────────────────────────────────────────────┤
│                                                 │
│ PRESENT   ████ Emerald Green                   │
│           bg-emerald-500/10 text-emerald-400   │
│                                                 │
│ LATE      ████ Amber Yellow                    │
│           bg-amber-500/10 text-amber-400       │
│                                                 │
│ ABSENT    ████ Red                             │
│           bg-red-500/10 text-red-400           │
│                                                 │
│ HALF_DAY  ████ Blue                            │
│           bg-blue-500/10 text-blue-400         │
│                                                 │
│ LEAVE     ████ Purple                          │
│           bg-purple-500/10 text-purple-400     │
│                                                 │
│ WEEK_OFF  ████ Neutral Gray                    │
│           bg-neutral-800 text-neutral-400      │
│                                                 │
│ HOLIDAY   ████ Indigo                          │
│           bg-indigo-500/10 text-indigo-400     │
│                                                 │
│ NOT_MARKED████ Dark Gray                       │
│           bg-neutral-800 text-neutral-400      │
│                                                 │
└────────────────────────────────────────────────┘
```

---

## 📊 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Data Flow                               │
└─────────────────────────────────────────────────────────────┘

User clicks employee row
        │
        ▼
    useRouter()
        │
        ▼
Navigate to /hr/attendance/employee/[id]
        │
        ▼
    useParams() - Extract employeeId
        │
        ├──────────────────────┬──────────────────────┐
        ▼                      ▼                      ▼
   Fetch Employee        Fetch Monthly         Wait for Data
   GET /employees/[id]   GET /attendance/...   
        │                      │                      
        ▼                      ▼                      
   useQuery (React Query)  useQuery (React Query)
        │                      │
        ├──────────────────────┴──────────────────────┐
        ▼                                              ▼
   Loading State                                  Data Ready
   (Spinner)                                      
        │                                              │
        └──────────────────────────────────────────────┘
                              │
                              ▼
                     Unwrap API Response
                     (Check for envelope)
                              │
                              ▼
                     Process Data
                     - Employee info
                     - Attendances array
                     - Summary object
                              │
                              ▼
                     Generate Calendar
                     - useMemo()
                     - eachDayOfInterval()
                     - Map attendances to dates
                              │
                              ▼
                     Render Components
                     - Employee card
                     - Summary cards
                     - Working hours cards
                     - Monthly table
                              │
                              ▼
                     Page Displayed ✅

User changes month/year dropdown
        │
        ▼
   setState (selectedMonth/Year)
        │
        ▼
   useQuery refetch (automatic)
        │
        ▼
   Loading State → Data Ready → Re-render ✅
```

---

## 🔄 Component Hierarchy

```
EmployeeMonthlyAttendancePage
│
├── HRLayout (Wrapper)
│   ├── Sidebar
│   ├── Header
│   └── Main Content
│
├── Breadcrumb Section
│   └── Back Button
│
├── Header Section
│   ├── Title with Icon
│   └── Action Buttons
│       ├── Print Button
│       ├── Export Excel Button
│       └── Export PDF Button
│
├── Employee Information Card
│   ├── Name Field
│   ├── Employee ID Field
│   ├── Department Field
│   └── Designation Field
│
├── Period Selector
│   ├── Month Dropdown
│   └── Year Dropdown
│
├── Summary Cards Grid
│   ├── StatCard (Total Working Days)
│   ├── StatCard (Present)
│   ├── StatCard (Late)
│   ├── StatCard (Half Day)
│   ├── StatCard (Absent)
│   ├── StatCard (Week Off)
│   ├── StatCard (Leave)
│   └── StatCard (Attendance %)
│
├── Working Hours Cards
│   ├── Total Working Hours Card
│   └── Average Working Hours Card
│
└── Monthly Attendance Table
    ├── Table Header
    │   ├── Date Column
    │   ├── Day Column
    │   ├── Check In Column
    │   ├── Check Out Column
    │   ├── Working Hours Column
    │   ├── Status Column
    │   └── Late By Column
    │
    └── Table Body (Generated from monthDays)
        └── Table Row (for each day)
            ├── Date Cell
            ├── Day Cell
            ├── Check In Cell (formatted time)
            ├── Check Out Cell (formatted time)
            ├── Working Hours Cell (formatted)
            ├── Status Badge Cell
            └── Late By Cell
```

---

## 🎯 Key Features Visual Checklist

```
✅ NAVIGATION
┌───────────────────────────────────────┐
│ HR Attendance Page                    │
│ ┌─────────────────────────────────┐  │
│ │ [Employee Row - Clickable]      │  │ ◄─── Hover: Blue
│ │ Cursor: pointer                 │  │
│ └─────────────────────────────────┘  │
│              │                        │
│              ▼                        │
│ /hr/attendance/employee/[id]          │
└───────────────────────────────────────┘

✅ EMPLOYEE INFORMATION
┌───────────────────────────────────────┐
│ Name: Aditya Addy       ✅ Real Data │
│ ID: FCS0161             ✅ Real Data │
│ Department: Agent       ✅ Real Data │
│ Designation: Developer  ✅ Real Data │
└───────────────────────────────────────┘

✅ MONTH/YEAR SELECTION
┌───────────────────────────────────────┐
│ [August ▼]  [2026 ▼]                 │
│      │           │                    │
│      ▼           ▼                    │
│  Loading...  (No page reload)        │
│      │                                │
│      ▼                                │
│  Data Updated ✅                      │
└───────────────────────────────────────┘

✅ SUMMARY CARDS (8 Cards)
┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
│  26  │ │  22  │ │   3  │ │   1  │
│ Days │ │Present│ │ Late │ │H-Day│
└──────┘ └──────┘ └──────┘ └──────┘
┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
│   0  │ │   5  │ │   0  │ │ 100% │
│Absent│ │W-Off │ │Leave │ │Attend│
└──────┘ └──────┘ └──────┘ └──────┘

✅ WORKING HOURS (2 Cards)
┌─────────────┐ ┌─────────────┐
│  176h 30m   │ │  08h 02m    │
│   Total     │ │  Average    │
└─────────────┘ └─────────────┘

✅ MONTHLY TABLE (All Days)
┌──────────────────────────────────┐
│ 01 Aug | Saturday | 09:58 AM ... │
│ 02 Aug | Sunday   |    —     ... │
│ 03 Aug | Monday   | 10:18 AM ... │
│ ...                              │
│ 31 Aug | Saturday | 09:45 AM ... │
└──────────────────────────────────┘
✅ All 31 days shown
✅ Times in IST format
✅ Working hours formatted
✅ Status color-coded

✅ TIMEZONE HANDLING
┌──────────────────────────────────┐
│ ✅ No duplicate dates            │
│ ✅ Correct month boundaries      │
│ ✅ Check-in/out in IST           │
│ ✅ Date normalized to India      │
└──────────────────────────────────┘

✅ EXPORT & PRINT
┌──────────────────────────────────┐
│ [🖨️ Print] [📊 Excel] [📄 PDF] │
│      │          │          │     │
│      ▼          ▼          ▼     │
│   Opens     Alert      Alert     │
│   Dialog   (Placeholder)(Holder) │
└──────────────────────────────────┘

✅ SECURITY
┌──────────────────────────────────┐
│ HR_ADMIN    ✅ Access Granted   │
│ HR_USER     ✅ Access Granted   │
│ EMPLOYEE    ❌ Blocked/Redirect │
│ Guest       ❌ Redirect to Login│
└──────────────────────────────────┘
```

---

## 📱 Responsive Behavior

### Desktop View (1920px+)
```
┌────────────────────────────────────────────────────────────┐
│ [Sidebar] │ [Main Content - Full Width]                    │
│           │                                                 │
│ [Nav]     │ Summary Cards: 4 columns                       │
│           │ Working Hours: 2 columns                       │
│ [Links]   │ Table: Full width, no scroll                   │
│           │                                                 │
└────────────────────────────────────────────────────────────┘
```

### Tablet View (768px - 1024px)
```
┌─────────────────────────────────────────────────┐
│ [≡] [Main Content - Full Width]                │
│                                                 │
│ Summary Cards: 2 columns                       │
│ Working Hours: 2 columns                       │
│ Table: Horizontal scroll                       │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Mobile View (< 768px)
```
┌──────────────────────────────┐
│ [≡] [Title]                  │
│                              │
│ Summary Cards: 2 columns    │
│ (Smaller cards)             │
│                              │
│ Working Hours: 1 column     │
│ (Stacked)                   │
│                              │
│ Table: Scroll horizontally  │
│ ← → [Swipe to view all]     │
│                              │
└──────────────────────────────┘
```

---

## 🎨 Color Scheme (Dark Theme)

```
Background Colors:
- Main: #000000 (black)
- Cards: #171717 (neutral-900)
- Borders: #262626 (neutral-800)

Text Colors:
- Primary: #FFFFFF (white)
- Secondary: #A3A3A3 (neutral-400)
- Tertiary: #737373 (neutral-500)

Accent Colors:
- Blue (Primary): #3B82F6
- Emerald (Success): #10B981
- Amber (Warning): #F59E0B
- Red (Error): #EF4444
- Purple (Info): #A855F7

Status Badge Colors:
- Present: Emerald with 10% opacity background
- Late: Amber with 10% opacity background
- Absent: Red with 10% opacity background
- Neutral: Gray with 50% opacity
```

---

## ⚡ Performance Optimizations

```
React Query Caching:
┌──────────────────────────────────────┐
│ Query Key: ['employee', employeeId] │
│ Cache Time: 5 minutes                │
│ Stale Time: 1 minute                 │
└──────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│ Query Key: ['monthly-attendance', id, mo, yr]   │
│ Cache Time: 2 minutes                            │
│ Refetch on: Month/Year change                   │
└──────────────────────────────────────────────────┘

useMemo Hook:
┌──────────────────────────────────────┐
│ Calendar Generation (monthDays)      │
│ Dependencies: [month, year, atts]    │
│ Benefit: No recalc on re-renders    │
└──────────────────────────────────────┘

Conditional Rendering:
┌──────────────────────────────────────┐
│ If loading: Show spinner only        │
│ If error: Show error message only    │
│ If success: Render full content      │
└──────────────────────────────────────┘
```

---

## 🎉 Feature Complete!

All visual components are implemented and styled to match the existing HRMS dark theme. The page is fully functional, responsive, and ready for testing!

**Next Steps**: Follow the Testing Guide to verify all functionality.
