import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from './database/database.module.js';
import { HealthController } from './health.controller.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { DepartmentsModule } from './modules/departments/departments.module.js';
import { DesignationsModule } from './modules/designations/designations.module.js';
import { EmployeesModule } from './modules/employees/employees.module.js';
import { DashboardModule } from './modules/dashboard/dashboard.module.js';
import { DocumentsModule } from './modules/documents/documents.module.js';
import { PoliciesModule } from './modules/policies/policies.module.js';
import { ComplaintsModule } from './modules/complaints/complaints.module.js';
import { NotificationsModule } from './modules/notifications/notifications.module.js';
import { AttendanceModule } from './modules/attendance/attendance.module.js';
import { PayrollModule } from './modules/payroll/payroll.module.js';
import { HRUsersModule } from './modules/hr-users/hr-users.module.js';
import { AdminModule } from './modules/admin/admin.module.js';
import { HRActionsModule } from './modules/hr-actions/hr-actions.module.js';
import { SuperAdminModule } from './modules/super-admin/super-admin.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    AuthModule,
    DepartmentsModule,
    DesignationsModule,
    EmployeesModule,
    DashboardModule,
    DocumentsModule,
    PoliciesModule,
    ComplaintsModule,
    NotificationsModule,
    AttendanceModule,
    PayrollModule,
    HRUsersModule,
    AdminModule,
    HRActionsModule,
    SuperAdminModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
