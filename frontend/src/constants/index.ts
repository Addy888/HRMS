// User Roles
export enum UserRole {
  HR = 'HR',
  EMPLOYEE = 'EMPLOYEE',
}

// Employee Onboarding Status
export enum OnboardingStatus {
  PENDING = 'PENDING',
  PROFILE_COMPLETED = 'PROFILE_COMPLETED',
  DOCUMENTS_UPLOADED = 'DOCUMENTS_UPLOADED',
  POLICIES_ACCEPTED = 'POLICIES_ACCEPTED',
  COMPLETED = 'COMPLETED',
  VERIFIED = 'VERIFIED',
}

// Mandatory Document Types
export enum DocumentType {
  RESUME = 'RESUME',
  PHOTO = 'PHOTO',
  AADHAAR = 'AADHAAR',
  PAN = 'PAN',
  PASSPORT = 'PASSPORT',
  DRIVING_LICENSE = 'DRIVING_LICENSE',
  MARKSHEET_10TH = 'MARKSHEET_10TH',
  MARKSHEET_12TH = 'MARKSHEET_12TH',
  GRADUATION_DEGREE = 'GRADUATION_DEGREE',
  PG_DEGREE = 'PG_DEGREE',
  CERTIFICATES = 'CERTIFICATES',
  EXPERIENCE_LETTER = 'EXPERIENCE_LETTER',
  OFFER_LETTER = 'OFFER_LETTER',
  RELIEVING_LETTER = 'RELIEVING_LETTER',
  SALARY_SLIP = 'SALARY_SLIP',
  INTERNSHIP_CERTIFICATE = 'INTERNSHIP_CERTIFICATE',
  OTHER = 'OTHER',
}

// Document Status Tracking
export enum DocumentStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

// Complaint Category
export enum ComplaintCategory {
  HARASSMENT = 'HARASSMENT',
  FACILITY = 'FACILITY',
  IT = 'IT',
  PAYROLL = 'PAYROLL',
  GENERAL = 'GENERAL',
}

// Complaint Priority levels
export enum ComplaintPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

// Complaint Status
export enum ComplaintStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

// Policy Types
export enum PolicyType {
  ATTENDANCE = 'ATTENDANCE',
  LEAVE = 'LEAVE',
  CODE_OF_CONDUCT = 'CODE_OF_CONDUCT',
  DATA_PRIVACY = 'DATA_PRIVACY',
  INFO_SEC = 'INFO_SEC',
  NDA = 'NDA',
  POSH = 'POSH',
  IT = 'IT',
  HANDBOOK = 'HANDBOOK',
  LAPTOP = 'LAPTOP',
  INTERNET = 'INTERNET',
}

// API Routes Constants mapping
export const API_ROUTES = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    CHANGE_PASSWORD: '/auth/change-password',
  },
  EMPLOYEES: {
    BASE: '/employees',
    PROFILE: '/employees/profile',
    EDUCATION: '/employees/education',
    EXPERIENCE: '/employees/experience',
    STATUS: '/employees/status',
  },
  DEPARTMENTS: '/departments',
  DESIGNATIONS: '/designations',
  DOCUMENTS: {
    BASE: '/documents',
    UPLOAD: '/documents/upload',
    VERIFY: '/documents/verify',
  },
  POLICIES: {
    BASE: '/policies',
    ACCEPT: '/policies/accept',
    ACKNOWLEDGE: '/policies/acknowledge',
  },
  COMPLAINTS: {
    BASE: '/complaints',
    REPLY: '/complaints/reply',
  },
  NOTIFICATIONS: '/notifications',
  DASHBOARD: {
    HR: '/dashboard/hr',
    EMPLOYEE: '/dashboard/employee',
  },
  AUDIT: '/audit',
};
