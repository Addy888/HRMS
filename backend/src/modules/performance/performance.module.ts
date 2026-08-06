/**
 * PERFORMANCE MANAGEMENT MODULE - PHASE 14
 * 
 * Enterprise Performance Management System
 * 
 * FEATURES:
 * - Performance Cycle Management (Quarterly, Half-Yearly, Annual, Custom)
 * - Goal Management (Individual, Team, Department, Company)
 * - KPI Management (Key Performance Indicators)
 * - KRA Management (Key Responsibility Areas)
 * - Self Appraisal
 * - Manager Review with Competency Assessment
 * - HR Review with Final Ratings
 * - 360-Degree Feedback (Manager, Peer, Self, HR, Subordinate)
 * - Promotion Recommendations & Workflow
 * - Training Recommendations
 * - Salary Revision Recommendations
 * - Performance Dashboards (Employee, Manager, HR)
 * - Comprehensive Reporting
 * - AI-Ready Interfaces (Skill Gap, Attrition Prediction)
 * - Audit Logging & Version Control
 * 
 * ARCHITECTURE:
 * - Controllers: API endpoints for all features
 * - Services: Business logic and data operations
 * - Engines: Performance calculation, scoring, and goal tracking
 * - DTOs: Request/response validation
 * - Guards: Role-based access control
 * - Interfaces: AI/ML integration points
 * 
 * ROLES:
 * - SUPER_ADMIN: Full system access
 * - HR: Manage cycles, final reviews, promotions
 * - MANAGER: Team reviews, recommendations
 * - EMPLOYEE: Self-appraisal, goal tracking
 * 
 * WORKFLOW:
 * 1. HR creates Performance Cycle
 * 2. HR/Manager assigns Goals, KPIs, KRAs
 * 3. Employee submits Self Appraisal
 * 4. Manager conducts Manager Review
 * 5. Peers provide 360 Feedback
 * 6. HR conducts Final Review
 * 7. System generates Performance Letter
 * 8. Promotion/Training recommendations processed
 * 
 * INTEGRATION READY FOR:
 * - Microsoft Viva
 * - SAP SuccessFactors
 * - Oracle HCM
 * - Workday
 * - Darwinbox
 */

import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module.js';

// Engines
import { PerformanceEngineService } from './engines/performance-engine.service';
import { ScoringEngineService } from './engines/scoring-engine.service';
import { GoalEngineService } from './engines/goal-engine.service';
import { AIInterfaceService } from './engines/ai-interface.service';

@Module({
  imports: [DatabaseModule],
  controllers: [
    // Controllers will be added when implemented
  ],
  providers: [
    // Engines
    PerformanceEngineService,
    ScoringEngineService,
    GoalEngineService,
    AIInterfaceService,
  ],
  exports: [
    PerformanceEngineService,
    ScoringEngineService,
    GoalEngineService,
    AIInterfaceService,
  ],
})
export class PerformanceModule {}
