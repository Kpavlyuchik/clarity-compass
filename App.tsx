
import React, { useState, useCallback } from 'react';
import type { LifeAreaRating, GoalSuggestion, ActiveGoal, GoalBreakdown } from './types';
import OnboardingPage from './pages/OnboardingPage';
import GoalSuggestionsPage from './pages/GoalSuggestionsPage';
import GoalBreakdownPage from './pages/GoalBreakdownPage';
import TodayPage from './pages/TodayPage';

// Simple state machine for app flow
enum AppState {
  ONBOARDING_CHECK_IN,
  GENERATING_GOALS,
  VIEWING_GOALS,
  VIEWING_BREAKDOWN,
  TODAY_VIEW,
}

export default function App(): React.ReactElement {
  const [appState, setAppState] = useState<AppState>(AppState.ONBOARDING_CHECK_IN);
  const [lifeAreaRatings, setLifeAreaRatings] = useState<LifeAreaRating[]>([]);
  const [goalSuggestions, setGoalSuggestions] = useState<GoalSuggestion[]>([]);
  
  const [activeGoals, setActiveGoals] = useState<ActiveGoal[]>([]);
  const [goalForBreakdown, setGoalForBreakdown] = useState<ActiveGoal | null>(null);

  const handleCheckInComplete = useCallback((ratings: LifeAreaRating[]) => {
    setLifeAreaRatings(ratings);
    setAppState(AppState.GENERATING_GOALS);
  }, []);

  const handleGoalsGenerated = useCallback((suggestions: GoalSuggestion[]) => {
    setGoalSuggestions(suggestions);
    setAppState(AppState.VIEWING_GOALS);
  }, []);

  const handleStartGoals = useCallback((goals: GoalSuggestion[]) => {
    setActiveGoals(prevActive => {
        const newGoals = goals.filter(g => !prevActive.some(ag => ag.title === g.title));
        return [...prevActive, ...newGoals];
    });
    setGoalSuggestions([]);
    setAppState(AppState.TODAY_VIEW);
  }, []);
  
  const handleCreatePlan = useCallback((goal: ActiveGoal) => {
    setGoalForBreakdown(goal);
    setAppState(AppState.VIEWING_BREAKDOWN);
  }, []);

  const handleBreakdownApproved = useCallback((goalWithBreakdown: ActiveGoal) => {
    setActiveGoals(prevGoals => prevGoals.map(g => 
      g.title === goalWithBreakdown.title ? goalWithBreakdown : g
    ));
    setGoalForBreakdown(null);
    setAppState(AppState.TODAY_VIEW);
  }, []);
  
  const handleBackToToday = useCallback(() => {
    setGoalForBreakdown(null);
    setAppState(AppState.TODAY_VIEW);
  }, []);

  const renderContent = () => {
    switch (appState) {
      case AppState.ONBOARDING_CHECK_IN:
        return <OnboardingPage onComplete={handleCheckInComplete} />;
      
      case AppState.GENERATING_GOALS:
      case AppState.VIEWING_GOALS:
        return (
          <GoalSuggestionsPage
            ratings={lifeAreaRatings}
            suggestions={goalSuggestions}
            onGoalsGenerated={handleGoalsGenerated}
            onGoalsSelected={handleStartGoals}
            isLoading={appState === AppState.GENERATING_GOALS}
          />
        );
      
      case AppState.VIEWING_BREAKDOWN:
        if (!goalForBreakdown) {
          // Fallback if state is inconsistent
          setAppState(AppState.TODAY_VIEW);
          return <TodayPage activeGoals={activeGoals} onCreatePlan={handleCreatePlan} />;
        }
        return (
          <GoalBreakdownPage 
            goal={goalForBreakdown}
            userContext={lifeAreaRatings}
            onApprove={handleBreakdownApproved}
            onBack={handleBackToToday}
          />
        );
      
      case AppState.TODAY_VIEW:
        return <TodayPage activeGoals={activeGoals} onCreatePlan={handleCreatePlan} />;

      default:
        return <OnboardingPage onComplete={handleCheckInComplete} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <header className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Clarity Compass
          </h1>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </main>
    </div>
  );
}
