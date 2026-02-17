
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

export interface ActivationReducer {
  label: string;
  description: string;
}

export interface Resource {
  type: 'link' | 'app' | 'template';
  label: string;
  url?: string;
  content?: string;
}

export interface Task {
  id: string;
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
  
  // Real-life integration fields
  trigger?: string;
  scheduled_pocket?: string;
  environment_setup?: string[];
  energy_required: 'low' | 'medium' | 'high';
  best_time_of_day: 'morning' | 'midday' | 'evening' | 'anytime';
  cognitive_load: 'focus-required' | 'autopilot-ok';
  environment: 'anywhere' | 'home-only' | 'quiet-needed' | 'computer-needed';
  activation_reducers: ActivationReducer[];
  resources: Resource[];
  tiny_version: string;
  completion_timing?: 'planned' | 'different' | 'last-minute' | 'tiny';
}

export interface Milestone {
  id: string;
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
  lastWorkedOn?: string;
  createdAt?: string;
}

export interface WeekStructure {
  wakeTime: string;
  workHours: string;
  commute: string;
  energyPeak: 'morning' | 'midday' | 'evening';
  weekendType: 'structured' | 'unstructured';
  afterWorkRoutine: string;
  windDownTime: string;
}

export interface EnergyForecast {
  monday: 'rough' | 'ok' | 'good';
  midweek: 'depleted' | 'steady' | 'peak';
  friday: 'tired' | 'depends' | 'relief';
  weekend: 'recovery' | 'relaxed' | 'best';
  weekStartedAt: string; // ISO string
}

export interface UserProfile {
  userName: string;
  week_structure?: WeekStructure;
  natural_pockets: string[];
  energy_forecast?: EnergyForecast;
  actual_completion_insights?: string;
}

export interface AILogEntry {
  id?: number;
  timestamp: string;
  model: string;
  operation: string;
  input: any;
  output: any;
  durationMs: number;
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}
