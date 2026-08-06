/**
 * PERFORMANCE ENGINE SERVICE
 *
 * Main orchestration engine for performance management
 *
 * FEATURES:
 * - Performance calculation orchestration
 * - Review workflow management
 * - Normalization and calibration
 * - Performance trends analysis
 * - Comparative analysis
 * - Rating distribution
 *
 * RESPONSIBILITIES:
 * - Coordinate between Goal, KPI, KRA engines
 * - Apply business rules and policies
 * - Handle review state transitions
 * - Generate performance insights
 */

import { Injectable } from '@nestjs/common';
import {
  ScoringEngineService,
  PerformanceScore,
} from './scoring-engine.service';

export interface PerformanceData {
  goals?: Array<{
    id: string;
    weightage: number;
    completionPercentage: number;
  }>;
  kpis?: Array<{
    id: string;
    weightage: number;
    targetValue: number;
    actualValue: number;
    excellentThreshold?: number;
    goodThreshold?: number;
    satisfactoryThreshold?: number;
  }>;
  kras?: Array<{
    id: string;
    weightage: number;
    managerRating: number;
  }>;
  competencies?: {
    technicalSkills?: number;
    communication?: number;
    teamwork?: number;
    leadership?: number;
    problemSolving?: number;
    initiative?: number;
    adaptability?: number;
    timeManagement?: number;
  };
}

export interface ReviewWorkflowStatus {
  stage: string;
  canProgress: boolean;
  nextStage?: string;
  blockers?: string[];
}

@Injectable()
export class PerformanceEngineService {
  constructor(private readonly scoringEngine: ScoringEngineService) {}

  /**
   * Calculate complete performance score
   */
  calculatePerformanceScore(data: PerformanceData): PerformanceScore {
    // Calculate Goal Score
    const goalScore =
      data.goals && data.goals.length > 0
        ? this.scoringEngine.calculateGoalScore(
            data.goals.map((g) => ({
              goalId: g.id,
              weightage: g.weightage,
              completion: g.completionPercentage,
              score: g.completionPercentage,
            })),
          )
        : 0;

    // Calculate KPI Score
    const kpiScore =
      data.kpis && data.kpis.length > 0
        ? this.scoringEngine.calculateKPIScore(
            data.kpis.map((kpi) => {
              const rating = this.scoringEngine.calculateKPIRating(
                kpi.actualValue,
                kpi.targetValue,
                {
                  excellent: kpi.excellentThreshold,
                  good: kpi.goodThreshold,
                  satisfactory: kpi.satisfactoryThreshold,
                },
              );
              const achievementPercentage =
                (kpi.actualValue / kpi.targetValue) * 100;

              return {
                kpiId: kpi.id,
                weightage: kpi.weightage,
                targetValue: kpi.targetValue,
                actualValue: kpi.actualValue,
                achievementPercentage,
                rating,
                score: ((rating - 1) / 4) * 100,
              };
            }),
          )
        : 0;

    // Calculate KRA Score
    const kraScore =
      data.kras && data.kras.length > 0
        ? this.scoringEngine.calculateKRAScore(
            data.kras.map((kra) => ({
              kraId: kra.id,
              weightage: kra.weightage,
              managerRating: kra.managerRating,
              score: ((kra.managerRating - 1) / 4) * 100,
            })),
          )
        : 0;

    // Calculate Competency Score
    const competencyScore = data.competencies
      ? this.scoringEngine.calculateCompetencyScore(data.competencies)
      : 0;

    // Calculate Final Score
    return this.scoringEngine.calculateFinalScore(
      goalScore,
      kpiScore,
      kraScore,
      competencyScore,
    );
  }

  /**
   * Determine review workflow status
   */
  getReviewWorkflowStatus(review: {
    status: string;
    selfAppraisal?: { status: string } | null;
    managerReview?: { status: string } | null;
    hrReview?: { status: string } | null;
  }): ReviewWorkflowStatus {
    const blockers: string[] = [];

    switch (review.status) {
      case 'NOT_STARTED':
        return {
          stage: 'Not Started',
          canProgress: true,
          nextStage: 'Self Appraisal',
        };

      case 'SELF_APPRAISAL_PENDING':
        if (!review.selfAppraisal) {
          return {
            stage: 'Self Appraisal Pending',
            canProgress: true,
            nextStage: 'Self Appraisal',
          };
        }
        return {
          stage: 'Self Appraisal In Progress',
          canProgress: false,
          blockers: ['Waiting for employee to submit self appraisal'],
        };

      case 'SELF_APPRAISAL_SUBMITTED':
        return {
          stage: 'Self Appraisal Completed',
          canProgress: true,
          nextStage: 'Manager Review',
        };

      case 'MANAGER_REVIEW_PENDING':
        if (!review.managerReview) {
          return {
            stage: 'Manager Review Pending',
            canProgress: true,
            nextStage: 'Manager Review',
          };
        }
        return {
          stage: 'Manager Review In Progress',
          canProgress: false,
          blockers: ['Waiting for manager to submit review'],
        };

      case 'MANAGER_REVIEW_SUBMITTED':
        return {
          stage: 'Manager Review Completed',
          canProgress: true,
          nextStage: 'HR Review',
        };

      case 'HR_REVIEW_PENDING':
        if (!review.hrReview) {
          return {
            stage: 'HR Review Pending',
            canProgress: true,
            nextStage: 'HR Review',
          };
        }
        return {
          stage: 'HR Review In Progress',
          canProgress: false,
          blockers: ['Waiting for HR to complete review'],
        };

      case 'HR_REVIEW_COMPLETED':
        return {
          stage: 'HR Review Completed',
          canProgress: true,
          nextStage: 'Finalize',
        };

      case 'FINALIZED':
        return {
          stage: 'Finalized',
          canProgress: false,
        };

      default:
        return {
          stage: 'Unknown',
          canProgress: false,
          blockers: ['Invalid review status'],
        };
    }
  }

  /**
   * Calculate rating distribution for a group
   */
  calculateRatingDistribution(ratings: number[]): {
    distribution: Record<number, number>;
    percentages: Record<number, number>;
    average: number;
    median: number;
  } {
    if (!ratings || ratings.length === 0) {
      return {
        distribution: {},
        percentages: {},
        average: 0,
        median: 0,
      };
    }

    // Count distribution
    const distribution = ratings.reduce(
      (acc, rating) => {
        acc[rating] = (acc[rating] || 0) + 1;
        return acc;
      },
      {} as Record<number, number>,
    );

    // Calculate percentages
    const total = ratings.length;
    const percentages = Object.entries(distribution).reduce(
      (acc, [rating, count]) => {
        acc[rating] = (count / total) * 100;
        return acc;
      },
      {} as Record<number, number>,
    );

    // Calculate average
    const average = ratings.reduce((sum, r) => sum + r, 0) / total;

    // Calculate median
    const sorted = [...ratings].sort((a, b) => a - b);
    const median =
      sorted.length % 2 === 0
        ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
        : sorted[Math.floor(sorted.length / 2)];

    return {
      distribution,
      percentages,
      average: Math.round(average * 100) / 100,
      median,
    };
  }

  /**
   * Identify top performers
   */
  identifyTopPerformers(
    performances: Array<{
      employeeId: string;
      finalRating: number;
      finalScore: number;
    }>,
    topN: number = 10,
  ): Array<{
    employeeId: string;
    finalRating: number;
    finalScore: number;
    rank: number;
  }> {
    return performances
      .sort((a, b) => {
        // Sort by rating first, then by score
        if (b.finalRating !== a.finalRating) {
          return b.finalRating - a.finalRating;
        }
        return b.finalScore - a.finalScore;
      })
      .slice(0, topN)
      .map((perf, index) => ({
        ...perf,
        rank: index + 1,
      }));
  }

  /**
   * Identify low performers (needs attention)
   */
  identifyLowPerformers(
    performances: Array<{
      employeeId: string;
      finalRating: number;
      finalScore: number;
    }>,
    threshold: number = 2,
  ): Array<{ employeeId: string; finalRating: number; finalScore: number }> {
    return performances
      .filter((perf) => perf.finalRating <= threshold)
      .sort(
        (a, b) => a.finalRating - b.finalRating || a.finalScore - b.finalScore,
      );
  }

  /**
   * Calculate performance trend
   */
  calculatePerformanceTrend(
    historicalScores: Array<{
      cycleId: string;
      score: number;
      rating: number;
      date: Date;
    }>,
  ): {
    trend: 'IMPROVING' | 'STABLE' | 'DECLINING' | 'INSUFFICIENT_DATA';
    trendPercentage: number;
    consistency: number;
  } {
    if (!historicalScores || historicalScores.length < 2) {
      return {
        trend: 'INSUFFICIENT_DATA',
        trendPercentage: 0,
        consistency: 0,
      };
    }

    // Sort by date
    const sorted = [...historicalScores].sort(
      (a, b) => a.date.getTime() - b.date.getTime(),
    );

    // Calculate trend
    const firstScore = sorted[0].score;
    const lastScore = sorted[sorted.length - 1].score;
    const trendPercentage = ((lastScore - firstScore) / firstScore) * 100;

    let trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
    if (trendPercentage > 5) {
      trend = 'IMPROVING';
    } else if (trendPercentage < -5) {
      trend = 'DECLINING';
    } else {
      trend = 'STABLE';
    }

    // Calculate consistency (standard deviation)
    const scores = sorted.map((s) => s.score);
    const mean = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    const variance =
      scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);
    const consistency = Math.max(0, 100 - stdDev); // Higher is more consistent

    return {
      trend,
      trendPercentage: Math.round(trendPercentage * 100) / 100,
      consistency: Math.round(consistency * 100) / 100,
    };
  }

  /**
   * Normalize scores for calibration (force ranking)
   */
  normalizeScoresForCalibration(
    scores: Array<{ id: string; score: number }>,
    targetDistribution?: {
      outstanding: number; // e.g., 10%
      exceeds: number; // e.g., 20%
      meets: number; // e.g., 50%
      below: number; // e.g., 15%
      needs: number; // e.g., 5%
    },
  ): Array<{ id: string; originalScore: number; normalizedRating: number }> {
    const defaultDistribution = {
      outstanding: 10,
      exceeds: 20,
      meets: 50,
      below: 15,
      needs: 5,
    };

    const distribution = targetDistribution || defaultDistribution;
    const total = scores.length;

    // Sort by score descending
    const sorted = [...scores].sort((a, b) => b.score - a.score);

    // Calculate cutoff indices
    const outstandingCutoff = Math.ceil(
      total * (distribution.outstanding / 100),
    );
    const exceedsCutoff =
      outstandingCutoff + Math.ceil(total * (distribution.exceeds / 100));
    const meetsCutoff =
      exceedsCutoff + Math.ceil(total * (distribution.meets / 100));
    const belowCutoff =
      meetsCutoff + Math.ceil(total * (distribution.below / 100));

    return sorted.map((item, index) => {
      let normalizedRating: number;
      if (index < outstandingCutoff) {
        normalizedRating = 5;
      } else if (index < exceedsCutoff) {
        normalizedRating = 4;
      } else if (index < meetsCutoff) {
        normalizedRating = 3;
      } else if (index < belowCutoff) {
        normalizedRating = 2;
      } else {
        normalizedRating = 1;
      }

      return {
        id: item.id,
        originalScore: item.score,
        normalizedRating,
      };
    });
  }
}
