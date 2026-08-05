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

// Controllers
import { PerformanceCycleController } from './controllers/performance-cycle.controller';
import { GoalController } from './controllers/goal.controller';
import { KPIController } from './controllers/kpi.controller';
import { KRAController } from './controllers/kra.controller';
import { SelfAppraisalController } from './controllers/self-appraisal.controller';
import { ManagerReviewController } from './controllers/manager-review.controller';
import { HRReviewController } from './controllers/hr-review.controller';
import { Feedback360Controller } from './controllers/feedback360.controller';
import { PromotionController } from './controllers/promotion.controller';
import { TrainingRecommendationController } from './controllers/training-recommendation.controller';
import { PerformanceDashboardController } from './controllers/performance-dashboard.controller';
import { PerformanceReportController } from './controllers/performance-report.controller';

// Services
import { PerformanceCycleService } from './services/performance-cycle.service';
import { GoalService } from './services/goal.service';
import { KPIService } from './services/kpi.service';
import { KRAService } from './services/kra.service';
import { AppraisalService } from './services/appraisal.service';
import { FeedbackService } from './services/feedback.service';
import { PromotionService } from './services/promotion.service';
import { TrainingRecommendationService } from './services/training-recommendation.service';
import { PerformanceDashboardService } from './services/performance-dashboard.service';
import { PerformanceReportService } from './services/performance-report.service';
import { PerformanceAuditService } from './services/performance-audit.service';

// Engines
import { PerformanceEngineService } from './engines/performance-engine.service';
import { ScoringEngineService } from './engines/scoring-engine.service';
import { GoalEngineService } from './engines/goal-engine.service';
import { AIInterfaceService } from './engines/ai-interface.service';

@Module({
  imports: [DatabaseModule],
  controllers: [
    PerformanceCycleController,
    GoalController,
    KPIController,
    KRAController,
    SelfAppraisalController,
    ManagerReviewController,
    HRReviewController,
    Feedback360Controller,
    PromotionController,
    TrainingRecommendationController,
    PerformanceDashboardController,
    PerformanceReportController,
  ],
  providers: [
    // Core Services
    PerformanceCycleService,
    GoalService,
    KPIService,
    KRAService,
    AppraisalService,
    FeedbackService,
    PromotionService,
    TrainingRecommendationService,
    PerformanceDashboardService,
    PerformanceReportService,
    PerformanceAuditService,
    
    // Engines
    PerformanceEngineService,
    ScoringEngineService,
    GoalEngineService,
    AIInterfaceService,
  ],
  exports: [
    PerformanceCycleService,
    GoalService,
    KPIService,
    KRAService,
    AppraisalService,
    PerformanceEngineService,
    ScoringEngineService,
  ],
})
export class PerformanceModule {}
