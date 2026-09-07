/**
 * Safely format a date value
 * Returns formatted date string or fallback for invalid/missing dates
 */
export function formatDate(
  value: string | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!value) {
    return '—';
  }

  try {
    const date = new Date(value);
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return '—';
    }
    return date.toLocaleDateString(undefined, options || { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return '—';
  }
}

/**
 * Safely format a date and time value
 */
export function formatDateTime(
  value: string | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!value) {
    return '—';
  }

  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return '—';
    }
    return date.toLocaleString(undefined, options);
  } catch {
    return '—';
  }
}

/**
 * Safely format action type by replacing underscores with spaces
 */
export function formatActionType(actionType: string | null | undefined): string {
  if (!actionType) {
    return '—';
  }
  return actionType.replace(/_/g, ' ');
}

/**
 * Safely format status by replacing underscores with spaces
 */
export function formatStatus(status: string | null | undefined): string {
  if (!status) {
    return '—';
  }
  return status.replace(/_/g, ' ');
}
