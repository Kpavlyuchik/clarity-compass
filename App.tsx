
import React, { useState, useCallback, useEffect } from 'react';
import type { LifeAreaRating, GoalSuggestion, ActiveGoal, UserProfile, EnergyForecast } from './types';
import OnboardingPage from './pages/OnboardingPage';
import WeekMappingPage from './pages/WeekMappingPage';
import GoalSuggestionsPage from './pages/GoalSuggestionsPage';
import GoalBreakdownPage from './pages/GoalBreakdownPage';
import TodayPage from './pages/TodayPage';
import GoalsPage from './pages/GoalsPage';
import EnergyForecastPage from './pages/EnergyForecastPage';
import { HomeIcon, GoalsIcon } from './components/Icons';

enum AppState {
  ONBOARDING_CHECK_IN,
  WEEK_MAPPING,
  GENERATING_GOALS,
  VIEWING_GOALS,
  VIEWING_BREAKDOWN,
  TODAY_VIEW,
  VIEW_ALL_GOALS,
  ENERGY_FORECAST,
}

export default function App(): React.ReactElement {
  const [appState, setAppState] = useState<AppState>(() => {
    const saved = localStorage.getItem('clarity_compass_state');
    return saved ? parseInt(saved) : AppState.ONBOARDING_CHECK_IN;
  });
  
  const [userName, setUserName] = useState(() => localStorage.getItem('clarity_compass_user') || 'Friend');
  const [lifeAreaRatings, setLifeAreaRatings] = useState<LifeAreaRating[]>([]);
  const [goalSuggestions, setGoalSuggestions] = useState<GoalSuggestion[]>([]);
  const [activeGoals, setActiveGoals] = useState<ActiveGoal[]>(() => {
    const saved = localStorage.getItem('clarity_compass_goals');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('clarity_compass_profile');
    return saved ? JSON.parse(saved) : { userName: 'Friend', natural_pockets: [] };
  });

  const [goalForBreakdown, setGoalForBreakdown] = useState<ActiveGoal | null>(null);
  const [lastOpened, setLastOpened] = useState(() => localStorage.getItem('clarity_compass_last_opened') || new Date().toISOString());

  // Persistence
  useEffect(() => {
    localStorage.setItem('clarity_compass_goals', JSON.stringify(activeGoals));
  }, [activeGoals]);

  useEffect(() => {
    localStorage.setItem('clarity_compass_state', appState.toString());
  }, [appState]);

  useEffect(() => {
    localStorage.setItem('clarity_compass_profile', JSON.stringify(userProfile));
  }, [userProfile]);

  useEffect(() => {
    const now = new Date();
    const last = new Date(lastOpened);
    
    // Check if it's a new week or Sunday for the forecast
    const isNewWeek = (now.getTime() - last.getTime()) > (1000 * 60 * 60 * 24 * 7) || (now.getDay() === 0 && last.getDay() !== 0);
    
    if (isNewWeek && appState === AppState.TODAY_VIEW) {
        setAppState(AppState.ENERGY_FORECAST);
    }
    
    localStorage.setItem('clarity_compass_last_opened', now.toISOString());
  }, []);

  const handleCheckInComplete = useCallback((ratings: LifeAreaRating[]) => {
    setLifeAreaRatings(ratings);
    setAppState(AppState.WEEK_MAPPING);
  }, []);

  const handleWeekMappingComplete = useCallback((pockets: string[], structure: any) => {
    setUserProfile(prev => ({ ...prev, natural_pockets: pockets, week_structure: structure }));
    setAppState(AppState.GENERATING_GOALS);
  }, []);

  const handleGoalsGenerated = useCallback((suggestions: GoalSuggestion[]) => {
    setGoalSuggestions(suggestions);
    setAppState(AppState.VIEWING_GOALS);
  }, []);

  const handleStartGoals = useCallback((goals: GoalSuggestion[]) => {
    const goalsWithStatus = goals.map(g => ({ 
      ...g, 
      id: Math.random().toString(36).substr(2, 9),
      status: 'active' as const,
      createdAt: new Date().toISOString(),
      lastWorkedOn: new Date().toISOString()
    }));
    setActiveGoals(prev => [...prev, ...goalsWithStatus]);
    setGoalSuggestions([]);
    setAppState(AppState.TODAY_VIEW);
  }, []);
  
  const handleCreatePlan = useCallback((goal: ActiveGoal) => {
    setGoalForBreakdown(goal);
    setAppState(AppState.VIEWING_BREAKDOWN);
  }, []);

  const handleBreakdownApproved = useCallback((goalWithBreakdown: ActiveGoal) => {
    setActiveGoals(prevGoals => {
      const exists = prevGoals.some(g => g.id === goalWithBreakdown.id);
      if (exists) {
        return prevGoals.map(g => g.id === goalWithBreakdown.id ? goalWithBreakdown : g);
      }
      return [...prevGoals, goalWithBreakdown];
    });
    setGoalForBreakdown(null);
    setAppState(AppState.TODAY_VIEW);
  }, []);
  
  const handleUpdateGoal = useCallback((updatedGoal: ActiveGoal) => {
    setActiveGoals(prev => prev.map(g => g.id === updatedGoal.id ? updatedGoal : g));
  }, []);

  const handleEnergyForecastComplete = useCallback((forecast: EnergyForecast) => {
      setUserProfile(prev => ({ ...prev, energy_forecast: forecast }));
      setAppState(AppState.TODAY_VIEW);
  }, []);

  const handleViewAllGoals = useCallback(() => {
      setAppState(AppState.VIEW_ALL_GOALS);
  }, []);

  const handleBackToToday = useCallback(() => {
    setGoalForBreakdown(null);
    setAppState(AppState.TODAY_VIEW);
  }, []);

  const renderContent = () => {
    switch (appState) {
      case AppState.ONBOARDING_CHECK_IN:
        return <OnboardingPage onComplete={handleCheckInComplete} />;
      case AppState.WEEK_MAPPING:
        return <WeekMappingPage onComplete={handleWeekMappingComplete} />;
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
          setAppState(AppState.TODAY_VIEW);
          return null;
        }
        return (
          <GoalBreakdownPage 
            goal={goalForBreakdown}
            userContext={lifeAreaRatings}
            userProfile={userProfile}
            onApprove={handleBreakdownApproved}
            onBack={handleBackToToday}
          />
        );
      case AppState.ENERGY_FORECAST:
          return <EnergyForecastPage onComplete={handleEnergyForecastComplete} />;
      case AppState.TODAY_VIEW:
        return (
          <TodayPage 
            userName={userName}
            activeGoals={activeGoals} 
            userProfile={userProfile}
            lastOpenedAt={lastOpened}
            onUpdateGoal={handleUpdateGoal}
            onCreatePlan={handleCreatePlan} 
            onViewAllGoals={handleViewAllGoals} 
          />
        );
      case AppState.VIEW_ALL_GOALS:
        return (
          <GoalsPage 
            allGoals={activeGoals} 
            onCreatePlan={handleCreatePlan} 
            onUpdateGoal={handleUpdateGoal}
            onBack={handleBackToToday}
          />
        );
      default:
        // Fix: Added missing required userProfile prop to TodayPage
        return (
          <TodayPage 
            userName={userName} 
            activeGoals={activeGoals} 
            userProfile={userProfile}
            onUpdateGoal={handleUpdateGoal} 
            lastOpenedAt={lastOpened} 
            onCreatePlan={handleCreatePlan} 
            onViewAllGoals={handleViewAllGoals} 
          />
        );
    }
  };

  const showNav = ![AppState.ONBOARDING_CHECK_IN, AppState.WEEK_MAPPING, AppState.GENERATING_GOALS, AppState.VIEWING_GOALS].includes(appState);

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <header className="bg-white shadow-sm sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Clarity Compass</h1>
             {showNav && (
                <nav className="flex items-center space-x-2">
                    <button onClick={handleBackToToday} className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium ${appState === AppState.TODAY_VIEW ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}>
                        <HomeIcon className="w-5 h-5" />
                        <span className="hidden sm:inline">Today</span>
                    </button>
                    <button onClick={handleViewAllGoals} className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium ${appState === AppState.VIEW_ALL_GOALS ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}>
                        <GoalsIcon className="w-5 h-5" />
                        <span className="hidden sm:inline">Goals</span>
                    </button>
                </nav>
            )}
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </main>
    </div>
  );
}
