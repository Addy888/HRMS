import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
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
  ],
  controllers: [HealthController],
})
export class AppModule {}

