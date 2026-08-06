/**
 * SCORING ENGINE SERVICE
 * 
 * Central calculation engine for performance scoring
 * 
 * FEATURES:
 * - Weighted goal scoring
 * - KPI achievement calculation
 * - KRA performance scoring
 * - Competency aggregation
 * - Final rating normalization
 * - Rating scale mapping
 * 
 * SCORING METHODOLOGY:
 * - Goals: Weighted average based on completion %
 * - KPIs: Threshold-based scoring with weightage
 * - KRAs: Manager ratings with weightage
 * - Competencies: Average of all competency ratings
 * - Final Score: Composite of all components
 * 
 * RATING SCALE:
 * 1: Needs Improvement (0-40)
 * 2: Below Expectations (41-60)
 * 3: Meets Expectations (61-75)
 * 4: Exceeds Expectations (76-90)
 * 5: Outstanding (91-100)
 */

import { Injectable } from '@nestjs/common';

export interface GoalScore {
  goalId: string;
  weightage: number;
  completion: number;
  score: number;
}

export interface KPIScore {
  kpiId: string;
  weightage: number;
  targetValue: number;
  actualValue: number;
  achievementPercentage: number;
  rating: number;
  score: number;
}

export interface KRAScore {
  kraId: string;
  weightage: number;
  managerRating: number;
  score: number;
}

export interface CompetencyScore {
  technicalSkills?: number;
  communication?: number;
  teamwork?: number;
  leadership?: number;
  problemSolving?: number;
  initiative?: number;
  adaptability?: number;
  timeManagement?: number;
  average: number;
}

export interface PerformanceScore {
  goalScore: number;
  kpiScore: number;
  kraScore: number;
  competencyScore: number;
  finalScore: number;
  finalRating: number;
  ratingLabel: string;
}

@Injectable()
export class ScoringEngineService {
  /**
   * Calculate weighted goal score
   */
  calculateGoalScore(goals: GoalScore[]): number {
    if (!goals || goals.length === 0) return 0;

    const totalWeightage = goals.reduce((sum, goal) => sum + goal.weightage, 0);
    if (totalWeightage === 0) return 0;

    const weightedScore = goals.reduce((sum, goal) => {
      return sum + (goal.completion * goal.weightage);
    }, 0);

    return weightedScore / totalWeightage;
  }

  /**
   * Calculate KPI achievement score based on thresholds
   */
  calculateKPIRating(actualValue: number, targetValue: number, thresholds?: {
    excellent?: number;
    good?: number;
    satisfactory?: number;
  }): number {
    const achievementPercentage = (actualValue / targetValue) * 100;

    // If thresholds provided, use them
    if (thresholds) {
      if (thresholds.excellent && achievementPercentage >= thresholds.excellent) return 5;
      if (thresholds.good && achievementPercentage >= thresholds.good) return 4;
      if (thresholds.satisfactory && achievementPercentage >= thresholds.satisfactory) return 3;
      if (achievementPercentage >= 60) return 2;
      return 1;
    }

    // Default threshold-based scoring
    if (achievementPercentage >= 120) return 5; // Outstanding
    if (achievementPercentage >= 100) return 4; // Exceeds
    if (achievementPercentage >= 80) return 3;  // Meets
    if (achievementPercentage >= 60) return 2;  // Below
    return 1; // Needs Improvement
  }

  /**
   * Calculate weighted KPI score
   */
  calculateKPIScore(kpis: KPIScore[]): number {
    if (!kpis || kpis.length === 0) return 0;

    const totalWeightage = kpis.reduce((sum, kpi) => sum + kpi.weightage, 0);
    if (totalWeightage === 0) return 0;

    const weightedScore = kpis.reduce((sum, kpi) => {
      // Convert rating (1-5) to percentage (0-100)
      const normalizedScore = ((kpi.rating - 1) / 4) * 100;
      return sum + (normalizedScore * kpi.weightage);
    }, 0);

    return weightedScore / totalWeightage;
  }

  /**
   * Calculate weighted KRA score
   */
  calculateKRAScore(kras: KRAScore[]): number {
    if (!kras || kras.length === 0) return 0;

    const totalWeightage = kras.reduce((sum, kra) => sum + kra.weightage, 0);
    if (totalWeightage === 0) return 0;

    const weightedScore = kras.reduce((sum, kra) => {
      // Convert rating (1-5) to percentage (0-100)
      const normalizedScore = ((kra.managerRating - 1) / 4) * 100;
      return sum + (normalizedScore * kra.weightage);
    }, 0);

    return weightedScore / totalWeightage;
  }

  /**
   * Calculate average competency score
   */
  calculateCompetencyScore(competencies: Omit<CompetencyScore, 'average'>): number {
    const ratings = [
      competencies.technicalSkills,
      competencies.communication,
      competencies.teamwork,
      competencies.leadership,
      competencies.problemSolving,
      competencies.initiative,
      competencies.adaptability,
      competencies.timeManagement,
    ].filter(rating => rating !== undefined && rating !== null);

    if (ratings.length === 0) return 0;

    const average = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
    
    // Convert rating (1-5) to percentage (0-100)
    return ((average - 1) / 4) * 100;
  }

  /**
   * Calculate final performance score
   * 
   * Weighted composite score:
   * - Goals: 30%
   * - KPIs: 30%
   * - KRAs: 20%
   * - Competencies: 20%
   */
  calculateFinalScore(
    goalScore: number,
    kpiScore: number,
    kraScore: number,
    competencyScore: number,
  ): PerformanceScore {
    // Weights
    const weights = {
      goal: 0.30,
      kpi: 0.30,
      kra: 0.20,
      competency: 0.20,
    };

    // Calculate weighted final score
    const finalScore = 
      (goalScore * weights.goal) +
      (kpiScore * weights.kpi) +
      (kraScore * weights.kra) +
      (competencyScore * weights.competency);

    // Map score to rating
    const finalRating = this.scoreToRating(finalScore);
    const ratingLabel = this.getRatingLabel(finalRating);

    return {
      goalScore,
      kpiScore,
      kraScore,
      competencyScore,
      finalScore: Math.round(finalScore * 100) / 100, // 2 decimal places
      finalRating,
      ratingLabel,
    };
  }

  /**
   * Convert normalized score (0-100) to rating (1-5)
   */
  scoreToRating(score: number): number {
    if (score >= 91) return 5; // Outstanding
    if (score >= 76) return 4; // Exceeds Expectations
    if (score >= 61) return 3; // Meets Expectations
    if (score >= 41) return 2; // Below Expectations
    return 1; // Needs Improvement
  }

  /**
   * Get rating label
   */
  getRatingLabel(rating: number): string {
    const labels = {
      1: 'Needs Improvement',
      2: 'Below Expectations',
      3: 'Meets Expectations',
      4: 'Exceeds Expectations',
      5: 'Outstanding',
    };
    return labels[rating] || 'Not Rated';
  }

  /**
   * Get rating color for UI
   */
  getRatingColor(rating: number): string {
    const colors = {
      1: '#F44336', // Red
      2: '#FF9800', // Orange
      3: '#2196F3', // Blue
      4: '#4CAF50', // Green
      5: '#9C27B0', // Purple
    };
    return colors[rating] || '#9E9E9E';
  }

  /**
   * Calculate 360 feedback aggregate score
   */
  calculate360FeedbackScore(feedbacks: Array<{
    feedbackType: string;
    overallRating?: number;
    competencyScores?: CompetencyScore;
  }>): {
    averageRating: number;
    feedbackBreakdown: Record<string, number>;
    competencyAverage: CompetencyScore & { average: number };
  } {
    if (!feedbacks || feedbacks.length === 0) {
      return {
        averageRating: 0,
        feedbackBreakdown: {},
        competencyAverage: { average: 0 },
      };
    }

    // Calculate average rating by feedback type
    const feedbackBreakdown: Record<string, number> = {};
    const typeGroups = feedbacks.reduce((acc, fb) => {
      if (!acc[fb.feedbackType]) acc[fb.feedbackType] = [];
      if (fb.overallRating) acc[fb.feedbackType].push(fb.overallRating);
      return acc;
    }, {} as Record<string, number[]>);

    Object.entries(typeGroups).forEach(([type, ratings]) => {
      feedbackBreakdown[type] = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
    });

    // Calculate overall average
    const allRatings = feedbacks
      .map(fb => fb.overallRating)
      .filter(r => r !== undefined && r !== null);
    const averageRating = allRatings.length > 0
      ? allRatings.reduce((sum, r) => sum + r, 0) / allRatings.length
      : 0;

    // Aggregate competency scores
    const competencies = feedbacks
      .map(fb => fb.competencyScores)
      .filter(cs => cs !== undefined && cs !== null);

    const competencyAverage = this.aggregateCompetencies(competencies);

    return {
      averageRating,
      feedbackBreakdown,
      competencyAverage,
    };
  }

  /**
   * Aggregate competency scores from multiple feedbacks
   */
  private aggregateCompetencies(competencies: CompetencyScore[]): CompetencyScore & { average: number } {
    if (competencies.length === 0) {
      return { average: 0 };
    }

    const aggregate: any = {};
    const fields = [
      'technicalSkills',
      'communication',
      'teamwork',
      'leadership',
      'problemSolving',
      'initiative',
      'adaptability',
      'timeManagement',
    ];

    fields.forEach(field => {
      const values = competencies
        .map(c => c[field])
        .filter(v => v !== undefined && v !== null);
      
      if (values.length > 0) {
        aggregate[field] = values.reduce((sum, v) => sum + v, 0) / values.length;
      }
    });

    const allValues = Object.values(aggregate).filter(v => typeof v === 'number');
    aggregate.average = allValues.length > 0
      ? (allValues.reduce((sum: number, v: any) => sum + v, 0) / allValues.length)
      : 0;

    return aggregate;
  }
}
