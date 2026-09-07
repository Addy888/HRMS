# Requirements Document

## Introduction

The Super Admin Module is an **additional management interface** for the existing production HRMS application. It enables Super Admin users to view and manage HR Admins (users with HR role) and inspect the real production data associated with each HR Admin, including:
- Processes (departments) created by the HR Admin
- Employees created by the HR Admin
- Employee assignments to processes
- Salary, payroll, attendance, and incentive data

This module **reuses existing production data** (43-45 real employees, existing HR users, existing departments, designations, salary structures, attendance records) and **leverages existing database relationships** (`createdByUserId` in Employee and Department tables) without requiring database recreation, data seeding, or schema modifications.

## Glossary

- **Super_Admin**: System-level administrator with cross-organization visibility and HR Admin management capabilities
- **HR_Admin**: User with HR role (HR_ADMIN or HR_USER) who creates and manages processes and employees
- **Process**: Department entity in the database, identified by the `createdByUserId` field showing which HR created it
- **Employee**: Employee entity in the database, identified by the `createdByUserId` field showing which HR created it
- **HR_Admin_Detail_Page**: Interface displaying all processes, employees, and summary statistics for a specific HR Admin
- **Process_Detail_Page**: Interface displaying all employees assigned to a specific process/department
- **Employee_Detail_Page**: Existing employee detail interface reused for displaying employee information
- **Production_Database**: The existing operational MySQL database containing ~43-45 real employees and all HR/process/department data
- **Real_Time_Updates**: WebSocket/Socket.IO events and API refetch to reflect data changes immediately

## Requirements

### Requirement 1: HR Admin List View

**User Story:** As a Super Admin, I want to view a list of all HR Admins, so that I can select an HR Admin to inspect their managed processes and employees.

#### Acceptance Criteria

1. WHEN Super Admin navigates to Admin Management page, THE System SHALL display all users with HR role (HR_ADMIN or HR_USER)
2. THE HR_Admin_List SHALL include: HR Admin name, email, organization name, total processes created (count from Department where createdByUserId = HR.id), total employees created (count from Employee where createdByUserId = HR.id)
3. WHEN Super Admin searches by HR Admin name or email, THE System SHALL filter the HR Admin list
4. THE System SHALL support pagination with configurable page size
5. WHEN Super Admin clicks on an HR Admin, THE System SHALL navigate to HR Admin Detail Page

### Requirement 2: HR Admin Detail Page - Overview Section

**User Story:** As a Super Admin, I want to view detailed information about a specific HR Admin, so that I can understand their scope of management and employee assignments.

#### Acceptance Criteria

1. WHEN Super Admin navigates to HR Admin Detail Page, THE System SHALL display HR Admin profile information: name, email, organization name, role, account status
2. THE Overview_Section SHALL display total process count created by this HR (SELECT COUNT(*) FROM Department WHERE createdByUserId = :hrUserId)
3. THE Overview_Section SHALL display total employee count created by this HR (SELECT COUNT(*) FROM Employee WHERE createdByUserId = :hrUserId)
4. THE Overview_Section SHALL display active employee count (SELECT COUNT(*) FROM Employee WHERE createdByUserId = :hrUserId AND user.isActive = true)
5. THE Overview_Section SHALL display inactive employee count (SELECT COUNT(*) FROM Employee WHERE createdByUserId = :hrUserId AND user.isActive = false)

### Requirement 3: HR Admin Detail Page - Process List Section

**User Story:** As a Super Admin, I want to view all processes managed by a specific HR Admin, so that I can inspect process assignments and employee distribution.

#### Acceptance Criteria

1. WHEN Super Admin views HR Admin Detail Page, THE System SHALL display all processes where Department.createdByUserId = HR.id
2. THE Process_List SHALL include for each process: process name, process code, employee count (SELECT COUNT(*) FROM Employee WHERE departmentId = :processId), active status
3. WHEN Super Admin clicks on a process, THE System SHALL navigate to Process Detail Page
4. THE Process_List SHALL support sorting by process name, employee count
5. THE Process_List SHALL display "No processes created" message when count = 0

### Requirement 4: HR Admin Detail Page - Employee List Section

**User Story:** As a Super Admin, I want to view all employees created by a specific HR Admin, so that I can inspect employee details and assignments.

#### Acceptance Criteria

1. WHEN Super Admin views HR Admin Detail Page, THE System SHALL display all employees where Employee.createdByUserId = HR.id
2. THE Employee_List SHALL include: employee ID, employee name, assigned process (Department.name), designation, employment status, joining date
3. WHEN Super Admin clicks on an employee, THE System SHALL navigate to existing Employee Detail Page
4. THE Employee_List SHALL support filtering by process, employment status
5. THE Employee_List SHALL support sorting by employee name, joining date
6. THE Employee_List SHALL display "No employees created" message when count = 0

### Requirement 5: Process Detail Page

**User Story:** As a Super Admin, I want to view all employees assigned to a specific process, so that I can understand process team composition.

#### Acceptance Criteria

1. WHEN Super Admin navigates to Process Detail Page, THE System SHALL display process information: name, code, description, created by HR name, creation date
2. THE Process_Detail_Page SHALL display employee count (SELECT COUNT(*) FROM Employee WHERE departmentId = :processId)
3. THE Process_Detail_Page SHALL display all employees where Employee.departmentId = :processId
4. THE Employee_List SHALL include: employee ID, employee name, designation, monthly salary, employment status, joining date
5. WHEN Super Admin clicks on an employee, THE System SHALL navigate to existing Employee Detail Page

### Requirement 6: Employee Detail Page Integration

**User Story:** As a Super Admin, I want to view detailed employee information using the existing employee detail interface, so that I can inspect salary, attendance, payroll, and incentive data.

#### Acceptance Criteria

1. WHEN Super Admin navigates to Employee Detail Page from HR Admin view or Process view, THE System SHALL reuse the existing employee detail page at `/hr/employees/[id]`
2. THE Employee_Detail_Page SHALL display employee profile, education, experience, documents
3. THE Employee_Detail_Page SHALL display salary structure information if SalaryStructure exists for this employee
4. THE Employee_Detail_Page SHALL display payroll summary if Payslip records exist for this employee
5. THE Employee_Detail_Page SHALL display attendance summary if Attendance records exist for this employee
6. THE Employee_Detail_Page SHALL display incentive information if available
7. THE Employee_Detail_Page SHALL display which HR created this employee (Employee.createdByUserId reference)
8. THE Employee_Detail_Page SHALL display which process this employee is assigned to (Employee.departmentId reference)

### Requirement 7: Real-Time Data Updates via WebSocket

**User Story:** As a Super Admin, I want the HR Admin view to reflect data changes in real-time, so that I see current employee and process assignments without manual refresh.

#### Acceptance Criteria

1. WHEN an HR creates a new process, THE System SHALL emit Socket.IO event "process:created" with processId and hrUserId
2. WHEN Super Admin is viewing HR Admin Detail Page for the relevant HR, THE Frontend SHALL receive the event and increment process count
3. WHEN an HR assigns an employee to a process, THE System SHALL emit Socket.IO event "employee:assigned" with employeeId, processId, hrUserId
4. WHEN Super Admin is viewing Process Detail Page for the relevant process, THE Frontend SHALL receive the event and add employee to the list
5. WHEN an employee status changes (active/inactive), THE System SHALL emit Socket.IO event "employee:status_changed" with employeeId and new status
6. WHEN Super Admin is viewing Employee List, THE Frontend SHALL receive the event and update the employee status display

### Requirement 8: Real-Time Data Updates via API Refetch

**User Story:** As a Super Admin, I want data to be refetched automatically when relevant changes occur, so that stale data does not persist if WebSocket events are missed.

#### Acceptance Criteria

1. WHEN Super Admin views HR Admin Detail Page, THE Frontend SHALL refetch HR statistics every 30 seconds
2. WHEN a Socket.IO event is received, THE Frontend SHALL also trigger API refetch for the affected data (fallback mechanism)
3. WHEN Super Admin returns to HR Admin Detail Page after navigation, THE Frontend SHALL refetch all data
4. WHEN API refetch fails, THE Frontend SHALL display the last successfully fetched data with a "stale data" indicator
5. WHEN API refetch succeeds, THE Frontend SHALL update the UI immediately without full page reload

### Requirement 9: Database Safety - No Schema Changes

**User Story:** As a system maintainer, I want the Super Admin module to use the existing database schema without modifications, so that production data remains untouched.

#### Acceptance Criteria

1. THE System SHALL use the existing schema.prisma file without adding new models or fields
2. THE System SHALL NOT execute `prisma migrate reset` command
3. THE System SHALL NOT execute `prisma migrate dev` command that creates new migrations
4. THE System SHALL only execute `prisma generate` to regenerate Prisma Client
5. THE System SHALL preserve all existing Employee records, Department records, User records, and transactional data
6. THE System SHALL NOT seed new data or create mock employees

### Requirement 10: Database Safety - Leverage Existing Relationships

**User Story:** As a developer, I want to leverage existing database relationships for HR-to-Process and HR-to-Employee associations, so that no new schema design is required.

#### Acceptance Criteria

1. WHEN querying processes created by an HR, THE System SHALL use Department.createdByUserId = :hrUserId
2. WHEN querying employees created by an HR, THE System SHALL use Employee.createdByUserId = :hrUserId
3. WHEN querying employees in a process, THE System SHALL use Employee.departmentId = :processId
4. WHEN querying employee organization, THE System SHALL use Employee.organizationId
5. WHEN querying HR user organization, THE System SHALL use User.organizationId
6. THE System SHALL use Prisma's include and select features to fetch related data efficiently

### Requirement 11: Super Admin Authentication and Authorization

**User Story:** As a Super Admin, I want to authenticate with elevated privileges, so that I can access HR Admin management capabilities.

#### Acceptance Criteria

1. WHEN Super Admin credentials are provided to the login endpoint, THE Auth_Service SHALL authenticate using existing bcrypt password verification
2. WHEN Super Admin authentication succeeds, THE Auth_Service SHALL generate a JWT token containing roleId for Super Admin role
3. WHEN a request includes a Super Admin JWT token, THE JWT_Guard SHALL authorize access to Super Admin protected routes
4. THE System SHALL enforce that Super Admin role has the highest privilege level
5. IF Super Admin authentication fails, THEN THE Auth_Service SHALL return standard authentication error

### Requirement 12: HR Admin Management Navigation Flow

**User Story:** As a Super Admin, I want clear navigation between HR Admin list, HR Admin detail, Process detail, and Employee detail pages, so that I can efficiently inspect data hierarchies.

#### Acceptance Criteria

1. WHEN Super Admin accesses Super Admin dashboard, THE System SHALL display "Admin Management" navigation link
2. WHEN Super Admin clicks "Admin Management", THE System SHALL navigate to HR Admin List page
3. WHEN Super Admin clicks an HR Admin row, THE System SHALL navigate to `/super-admin/hr-admins/[hrUserId]`
4. WHEN Super Admin clicks a Process row on HR Admin Detail Page, THE System SHALL navigate to `/super-admin/processes/[processId]`
5. WHEN Super Admin clicks an Employee row, THE System SHALL navigate to existing `/hr/employees/[employeeId]` page
6. THE System SHALL display breadcrumb navigation showing current location in the hierarchy

### Requirement 13: Super Admin API Endpoints

**User Story:** As a frontend developer, I want well-defined API endpoints for HR Admin management, so that I can fetch and display HR Admin data efficiently.

#### Acceptance Criteria

1. THE System SHALL provide GET `/api/super-admin/hr-admins` endpoint returning list of all HR users with process and employee counts
2. THE System SHALL provide GET `/api/super-admin/hr-admins/:id` endpoint returning detailed HR Admin information
3. THE System SHALL provide GET `/api/super-admin/hr-admins/:id/processes` endpoint returning all processes created by the HR
4. THE System SHALL provide GET `/api/super-admin/hr-admins/:id/employees` endpoint returning all employees created by the HR
5. THE System SHALL provide GET `/api/super-admin/processes/:id` endpoint returning process details with employee list
6. THE System SHALL provide GET `/api/super-admin/processes/:id/employees` endpoint returning all employees in the process
7. ALL endpoints SHALL require Super Admin JWT authentication via @UseGuards(JwtAuthGuard, RolesGuard)

### Requirement 14: HR Admin Statistics Aggregation

**User Story:** As a Super Admin, I want aggregated statistics for each HR Admin, so that I can quickly assess their scope of responsibility.

#### Acceptance Criteria

1. WHEN fetching HR Admin list, THE System SHALL calculate total processes created (COUNT from Department where createdByUserId)
2. WHEN fetching HR Admin list, THE System SHALL calculate total employees created (COUNT from Employee where createdByUserId)
3. WHEN fetching HR Admin detail, THE System SHALL calculate active employee count (COUNT where user.isActive = true)
4. WHEN fetching HR Admin detail, THE System SHALL calculate inactive employee count (COUNT where user.isActive = false)
5. THE System SHALL use efficient SQL queries with JOIN and GROUP BY to minimize database round trips

### Requirement 15: Multi-Tenant Data Filtering

**User Story:** As a Super Admin, I want to see HR Admin data filtered by organization when viewing cross-organization deployments, so that organizational boundaries remain visible.

#### Acceptance Criteria

1. WHEN querying HR Admin list, THE System SHALL include organization name from User.organizationId relation
2. WHEN displaying processes, THE System SHALL include organization name from Department.organizationId relation
3. WHEN displaying employees, THE System SHALL include organization name from Employee.organizationId relation
4. THE System SHALL support filtering HR Admins by organizationId
5. THE System SHALL maintain multi-tenant isolation for HR and Employee roles (only Super Admin has cross-organization visibility)
