/**
 * GOAL ENGINE SERVICE
 *
 * Specialized engine for goal management and tracking
 *
 * FEATURES:
 * - Goal progress calculation
 * - Goal cascading (Company → Department → Team → Individual)
 * - Dependency tracking
 * - Milestone management
 * - Goal alignment analysis
 * - Completion prediction
 *
 * GOAL TYPES:
 * - COMPANY: Organization-wide strategic goals
 * - DEPARTMENT: Department-specific goals
 * - TEAM: Team-level goals
 * - INDIVIDUAL: Personal employee goals
 */

import { Injectable } from '@nestjs/common';

export interface Goal {
  id: string;
  title: string;
  type: 'COMPANY' | 'DEPARTMENT' | 'TEAM' | 'INDIVIDUAL';
  targetValue?: string;
  actualValue?: string;
  progress: number;
  weightage: number;
  status: string;
  startDate?: Date;
  dueDate?: Date;
  completedDate?: Date;
  milestones?: Array<{
    title: string;
    dueDate: string;
    completed: boolean;
  }>;
  dependencies?: string[];
}

export interface GoalAnalysis {
  totalGoals: number;
  completedGoals: number;
  inProgressGoals: number;
  delayedGoals: number;
  averageProgress: number;
  onTrackPercentage: number;
  weightedCompletion: number;
}

@Injectable()
export class GoalEngineService {
  /**
   * Calculate goal progress based on milestones
   */
  calculateProgressFromMilestones(
    milestones: Array<{ completed: boolean }>,
  ): number {
    if (!milestones || milestones.length === 0) return 0;

    const completed = milestones.filter((m) => m.completed).length;
    return (completed / milestones.length) * 100;
  }

  /**
   * Check if goal is delayed
   */
  isGoalDelayed(goal: Goal): boolean {
    if (!goal.dueDate) return false;
    if (goal.status === 'COMPLETED') return false;

    const now = new Date();
    const dueDate = new Date(goal.dueDate);

    // Goal is delayed if past due date and not completed
    if (now > dueDate) return true;

    // Goal is at risk if less than 20% of time remaining and progress < 80%
    const totalTime =
      dueDate.getTime() -
      (goal.startDate ? new Date(goal.startDate).getTime() : now.getTime());
    const elapsed =
      now.getTime() -
      (goal.startDate ? new Date(goal.startDate).getTime() : now.getTime());
    const timeProgress = (elapsed / totalTime) * 100;

    return timeProgress > 80 && goal.progress < 80;
  }

  /**
   * Calculate completion percentage based on target vs actual
   */
  calculateCompletionPercentage(
    targetValue: string,
    actualValue: string,
    measurementType: string,
  ): number {
    if (!targetValue || !actualValue) return 0;

    try {
      switch (measurementType) {
        case 'PERCENTAGE':
        case 'NUMBER': {
          const target = parseFloat(targetValue);
          const actual = parseFloat(actualValue);
          if (isNaN(target) || isNaN(actual) || target === 0) return 0;
          return Math.min((actual / target) * 100, 100);
        }

        case 'BOOLEAN': {
          return actualValue.toLowerCase() === 'true' ? 100 : 0;
        }

        case 'QUALITATIVE': {
          // For qualitative goals, assume progress is set manually
          return 0;
        }

        default:
          return 0;
      }
    } catch {
      return 0;
    }
  }

  /**
   * Analyze goals for an entity (employee, team, department)
   */
  analyzeGoals(goals: Goal[]): GoalAnalysis {
    if (!goals || goals.length === 0) {
      return {
        totalGoals: 0,
        completedGoals: 0,
        inProgressGoals: 0,
        delayedGoals: 0,
        averageProgress: 0,
        onTrackPercentage: 0,
        weightedCompletion: 0,
      };
    }

    const completed = goals.filter((g) => g.status === 'COMPLETED').length;
    const inProgress = goals.filter((g) => g.status === 'IN_PROGRESS').length;
    const delayed = goals.filter((g) => this.isGoalDelayed(g)).length;
    const onTrack = goals.length - delayed - completed;

    const averageProgress =
      goals.reduce((sum, g) => sum + g.progress, 0) / goals.length;
    const onTrackPercentage = (onTrack / goals.length) * 100;

    // Calculate weighted completion
    const totalWeightage = goals.reduce((sum, g) => sum + g.weightage, 0);
    const weightedCompletion =
      totalWeightage > 0
        ? goals.reduce((sum, g) => sum + g.progress * g.weightage, 0) /
          totalWeightage
        : 0;

    return {
      totalGoals: goals.length,
      completedGoals: completed,
      inProgressGoals: inProgress,
      delayedGoals: delayed,
      averageProgress: Math.round(averageProgress * 100) / 100,
      onTrackPercentage: Math.round(onTrackPercentage * 100) / 100,
      weightedCompletion: Math.round(weightedCompletion * 100) / 100,
    };
  }

  /**
   * Check goal dependencies
   * Returns list of blocking goals (dependencies not completed)
   */
  getBlockingDependencies(goal: Goal, allGoals: Map<string, Goal>): Goal[] {
    if (!goal.dependencies || goal.dependencies.length === 0) {
      return [];
    }

    const blocking: Goal[] = [];
    for (const depId of goal.dependencies) {
      const depGoal = allGoals.get(depId);
      if (depGoal && depGoal.status !== 'COMPLETED') {
        blocking.push(depGoal);
      }
    }

    return blocking;
  }

  /**
   * Calculate goal alignment score
   * Measures how well individual goals align with team/department/company goals
   */
  calculateGoalAlignment(
    individualGoals: Goal[],
    teamGoals: Goal[],
    departmentGoals: Goal[],
    companyGoals: Goal[],
  ): {
    alignmentScore: number;
    alignedGoals: number;
    totalGoals: number;
    breakdown: {
      companyAligned: number;
      departmentAligned: number;
      teamAligned: number;
    };
  } {
    if (individualGoals.length === 0) {
      return {
        alignmentScore: 0,
        alignedGoals: 0,
        totalGoals: 0,
        breakdown: {
          companyAligned: 0,
          departmentAligned: 0,
          teamAligned: 0,
        },
      };
    }

    // In real implementation, this would check goal relationships/tags/categories
    // For now, we'll use a simplified approach based on goal categories

    const companyAligned = 0;
    const departmentAligned = 0;
    const teamAligned = 0;

    // This is a placeholder - in real implementation,
    // you'd have explicit linking between goals
    const totalGoals = individualGoals.length;
    const alignedGoals = Math.floor(totalGoals * 0.7); // Placeholder

    const alignmentScore = (alignedGoals / totalGoals) * 100;

    return {
      alignmentScore: Math.round(alignmentScore * 100) / 100,
      alignedGoals,
      totalGoals,
      breakdown: {
        companyAligned,
        departmentAligned,
        teamAligned,
      },
    };
  }

  /**
   * Predict goal completion date based on current progress
   */
  predictCompletionDate(goal: Goal): {
    predictedDate: Date | null;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    daysRemaining: number;
    likelihood: 'ON_TRACK' | 'AT_RISK' | 'DELAYED';
  } {
    if (!goal.startDate || !goal.dueDate) {
      return {
        predictedDate: null,
        confidence: 'LOW',
        daysRemaining: 0,
        likelihood: 'AT_RISK',
      };
    }

    const now = new Date();
    const start = new Date(goal.startDate);
    const due = new Date(goal.dueDate);

    if (goal.status === 'COMPLETED' && goal.completedDate) {
      return {
        predictedDate: new Date(goal.completedDate),
        confidence: 'HIGH',
        daysRemaining: 0,
        likelihood: 'ON_TRACK',
      };
    }

    // Calculate velocity (progress per day)
    const elapsed = now.getTime() - start.getTime();
    const elapsedDays = elapsed / (1000 * 60 * 60 * 24);
    const velocity = elapsedDays > 0 ? goal.progress / elapsedDays : 0;

    if (velocity === 0) {
      return {
        predictedDate: null,
        confidence: 'LOW',
        daysRemaining: Math.ceil(
          (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        ),
        likelihood: 'AT_RISK',
      };
    }

    // Calculate predicted completion
    const remainingProgress = 100 - goal.progress;
    const daysToComplete = remainingProgress / velocity;
    const predictedDate = new Date(
      now.getTime() + daysToComplete * 24 * 60 * 60 * 1000,
    );

    // Determine confidence and likelihood
    const daysRemaining = Math.ceil(
      (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
    const buffer = daysRemaining - daysToComplete;

    let confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    let likelihood: 'ON_TRACK' | 'AT_RISK' | 'DELAYED';

    if (goal.progress > 80) {
      confidence = 'HIGH';
    } else if (goal.progress > 50) {
      confidence = 'MEDIUM';
    } else {
      confidence = 'LOW';
    }

    if (buffer > 5) {
      likelihood = 'ON_TRACK';
    } else if (buffer > 0) {
      likelihood = 'AT_RISK';
    } else {
      likelihood = 'DELAYED';
    }

    return {
      predictedDate,
      confidence,
      daysRemaining,
      likelihood,
    };
  }

  /**
   * Generate goal recommendations
   */
  generateGoalRecommendations(analysis: GoalAnalysis): string[] {
    const recommendations: string[] = [];

    if (analysis.delayedGoals > 0) {
      recommendations.push(
        `${analysis.delayedGoals} goal(s) are delayed. Consider reassessing priorities or extending deadlines.`,
      );
    }

    if (analysis.averageProgress < 50 && analysis.totalGoals > 0) {
      recommendations.push(
        'Average goal progress is below 50%. Review resource allocation and remove blockers.',
      );
    }

    if (analysis.weightedCompletion < analysis.averageProgress) {
      recommendations.push(
        'High-priority goals are lagging. Focus on goals with higher weightage.',
      );
    }

    if (analysis.onTrackPercentage < 70) {
      recommendations.push(
        'Less than 70% of goals are on track. Consider a strategy review meeting.',
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('Goal progress is healthy. Keep up the good work!');
    }

    return recommendations;
  }
}
