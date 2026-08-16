-- FIX SUNDAY WEEK OFF TO MONDAY (MySQL version)
-- Date: 2026-08-14
-- Issue: System incorrectly treating Sunday as weekly off
-- Fix: Change week off from Sunday to Monday

-- ============================================
-- STEP 1: Delete existing SUNDAY week off records
-- ============================================
DELETE FROM `WeekOff` 
WHERE `dayOfWeek` = 'SUNDAY';

-- ============================================
-- STEP 2: Delete any duplicate MONDAY week off records first
-- ============================================
DELETE FROM `WeekOff` 
WHERE `dayOfWeek` = 'MONDAY' AND `isActive` = 0;

-- ============================================
-- STEP 3: Ensure MONDAY week off exists (if not already there)
-- ============================================
-- Create Monday week off if it doesn't exist
INSERT INTO `WeekOff` (`id`, `dayOfWeek`, `effectiveFrom`, `effectiveTo`, `isActive`, `createdAt`, `updatedAt`)
SELECT 
  UUID(),
  'MONDAY',
  '2026-01-01',
  NULL,
  1,
  NOW(),
  NOW()
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM `WeekOff` WHERE `dayOfWeek` = 'MONDAY' AND `isActive` = 1
);

-- ============================================
-- STEP 4: Fix incorrect Sunday attendance records
-- ============================================
-- For Sunday records with WEEK_OFF status but have checkInTime,
-- recalculate the status based on check-in time

-- Case 1: Sunday WEEK_OFF with check-in time -> Set to PRESENT or LATE
UPDATE `Attendance`
SET 
  `status` = CASE
    -- If checked in after 10:10 AM (grace period), mark as LATE
    WHEN HOUR(CONVERT_TZ(`checkInTime`, '+00:00', '+05:30')) > 10 THEN 'LATE'
    WHEN HOUR(CONVERT_TZ(`checkInTime`, '+00:00', '+05:30')) = 10 
      AND MINUTE(CONVERT_TZ(`checkInTime`, '+00:00', '+05:30')) > 10 THEN 'LATE'
    -- Otherwise, mark as PRESENT
    ELSE 'PRESENT'
  END,
  `updatedAt` = NOW()
WHERE 
  `status` = 'WEEK_OFF'
  AND `checkInTime` IS NOT NULL
  AND DAYOFWEEK(CONVERT_TZ(`date`, '+00:00', '+05:30')) = 1; -- Sunday (MySQL: 1=Sunday, 2=Monday)

-- Case 2: Sunday records with early checkout (before 7 PM) -> Set to HALF_DAY
UPDATE `Attendance`
SET 
  `status` = 'HALF_DAY',
  `updatedAt` = NOW()
WHERE 
  `checkOutTime` IS NOT NULL
  AND (
    HOUR(CONVERT_TZ(`checkOutTime`, '+00:00', '+05:30')) < 19
  )
  AND DAYOFWEEK(CONVERT_TZ(`date`, '+00:00', '+05:30')) = 1 -- Sunday (MySQL: 1=Sunday, 2=Monday)
  AND `status` IN ('PRESENT', 'LATE', 'WEEK_OFF');

-- ============================================
-- VERIFICATION QUERIES (for manual check)
-- ============================================

-- Check remaining week off configuration
-- SELECT * FROM `WeekOff` WHERE `isActive` = 1;
-- Expected: Only MONDAY should be present

-- Check Sunday attendance records
-- SELECT `id`, `date`, `status`, `checkInTime`, `checkOutTime` 
-- FROM `Attendance` 
-- WHERE DAYOFWEEK(CONVERT_TZ(`date`, '+00:00', '+05:30')) = 1
-- ORDER BY `date` DESC;
-- Expected: No WEEK_OFF status for Sunday with checkInTime

-- ============================================
-- NOTES
-- ============================================
-- 1. This migration fixes the incorrect SUNDAY weekly off
-- 2. Only MONDAY should be marked as WEEK_OFF going forward
-- 3. Sunday is a NORMAL WORKING DAY
-- 4. All existing Sunday attendance records are recalculated
-- 5. Check-in/checkout rules apply normally to Sunday
-- 6. MySQL uses DAYOFWEEK where 1=Sunday, 2=Monday (different from PostgreSQL)
