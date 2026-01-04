
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
}

export interface Milestone {
  title: string;
  durationWeeks: number;
  whyThisMilestone: string;
  completionCriteria: string;
  order: number;
  tasks: Task[];
}

export type GoalBreakdown = {
  milestones: Milestone[];
  overallApproach: string;
  flexibilityNote: string;
};

export interface ActiveGoal extends GoalSuggestion {
  breakdown?: GoalBreakdown;
}
