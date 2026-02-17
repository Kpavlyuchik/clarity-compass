
export interface LifeAreaRating {
  lifeArea: string;
  rating: number;
  whatsWorking: string;
  challenges: string;
  betterLooksLike: string;
  additionalNotes: string;
}

export interface GoalSuggestion {
  title: string;
  rationale: string;
  lifeAreasImpacted: string[];
  timeframeWeeks: number;
  difficulty: "Gentle start" | "Moderate effort" | "Ambitious";
  successIndicators: string[];
}

export interface CommonObstacle {
  obstacle: string;
  solution: string;
}

export interface Task {
  id: string; // Added ID for tracking
  description: string;
  detailedSteps: string[];
  estimatedTime: string;
  whenToDo: string;
  whatYouNeed: string[];
  successLooksLike: string;
  commonObstacles: CommonObstacle[];
  nextStepConnection: string;
  celebrationNote?: string;
  order: number;
  isCompleted?: boolean;
  userFeedback?: 'smooth' | 'adapted' | 'hard';
}

export interface Milestone {
  id: string; // Added ID for tracking
  title: string;
  durationWeeks: number;
  whyThisMilestone: string;
  completionCriteria: string;
  order: number;
  tasks: Task[];
  isCompleted?: boolean;
}

export type GoalBreakdown = {
  milestones: Milestone[];
  overallApproach: string;
  flexibilityNote: string;
};

export type GoalStatus = 'active' | 'paused' | 'completed';

export interface ActiveGoal extends GoalSuggestion {
  id: string;
  status: GoalStatus;
  breakdown?: GoalBreakdown;
  inspirationImage?: string;
  personalWhy?: string;
  lastWorkedOn?: string; // ISO string
  createdAt?: string;
}
