
import React, { useEffect, useState } from 'react';
import type { LifeAreaRating, GoalSuggestion } from '../types';
import { generateGoalSuggestions } from '../services/geminiService';
import AILoadingIndicator from '../components/AILoadingIndicator';

interface GoalSuggestionCardProps {
    suggestion: GoalSuggestion;
    isSelected: boolean;
    onToggleSelect: () => void;
}

const GoalSuggestionCard: React.FC<GoalSuggestionCardProps> = ({ suggestion, isSelected, onToggleSelect }) => {
    return (
        <div 
            className={`bg-white border rounded-lg shadow-sm flex flex-col transition-all duration-200 cursor-pointer ${isSelected ? 'border-indigo-500 ring-2 ring-indigo-500' : 'border-slate-200 hover:border-slate-300'}`}
            onClick={onToggleSelect}
        >
            <div className="p-6">
                <div className="flex justify-between items-start">
                    <h3 className="text-xl font-bold text-slate-900 pr-4 flex-1">{suggestion.title}</h3>
                    <div className="flex items-center justify-center h-6 w-6 rounded-full border-2 transition-all duration-200"
                        style={{
                            borderColor: isSelected ? '#6366f1' : '#cbd5e1',
                            backgroundColor: isSelected ? '#6366f1' : 'transparent',
                        }}
                    >
                         {isSelected && <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                    </div>
                </div>
                <div className="mt-2 text-sm text-slate-500 space-x-4">
                    <span><strong>Timeframe:</strong> ~{suggestion.timeframeWeeks} weeks</span>
                    <span><strong>Difficulty:</strong> {suggestion.difficulty}</span>
                </div>
                <div className="mt-4 prose prose-sm text-slate-600">
                    <p><strong>Why this matters for you:</strong> {suggestion.rationale}</p>
                    <p><strong>This would improve:</strong> {suggestion.lifeAreasImpacted.join(', ')}</p>
                    <div>
                        <strong>You'll know it's working when:</strong>
                        <ul className="mt-1">
                            {suggestion.successIndicators.map((indicator, i) => (
                                <li key={i}>{indicator}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

interface GoalSuggestionsPageProps {
    ratings: LifeAreaRating[];
    suggestions: GoalSuggestion[];
    onGoalsGenerated: (suggestions: GoalSuggestion[]) => void;
    onGoalsSelected: (suggestions: GoalSuggestion[]) => void;
    isLoading: boolean;
}

const GoalSuggestionsPage: React.FC<GoalSuggestionsPageProps> = ({ ratings, suggestions, onGoalsGenerated, onGoalsSelected, isLoading }) => {
    const [error, setError] = useState<string | null>(null);
    const [selectedGoals, setSelectedGoals] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (isLoading && suggestions.length === 0) {
            generateGoalSuggestions(ratings)
                .then(response => {
                    onGoalsGenerated(response.goals);
                })
                .catch(err => {
                    console.error(err);
                    setError("Sorry, I couldn't generate goal suggestions right now. Please try again later.");
                });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoading, ratings, onGoalsGenerated, suggestions.length]);
    
    const handleToggleSelect = (goalTitle: string) => {
        setSelectedGoals(prev => {
            const newSet = new Set(prev);
            if (newSet.has(goalTitle)) {
                newSet.delete(goalTitle);
            } else {
                newSet.add(goalTitle);
            }
            return newSet;
        });
    };

    const handleConfirmSelection = () => {
        const selected = suggestions.filter(s => selectedGoals.has(s.title));
        onGoalsSelected(selected);
    };

    if (isLoading) {
        return <AILoadingIndicator message="Analyzing your check-in and crafting personalized goals..." />;
    }

    if (error) {
        return (
            <div className="text-center p-8 bg-white border border-red-300 rounded-lg">
                <h3 className="text-xl font-semibold text-red-700">An Error Occurred</h3>
                <p className="mt-2 text-red-600">{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-900">Your Personalized Goal Suggestions</h2>
                <p className="mt-2 text-lg text-slate-600">Based on your check-in, here are a few starting points. Choose one or more to add to your dashboard.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {suggestions.map((suggestion, index) => (
                    <GoalSuggestionCard 
                        key={index} 
                        suggestion={suggestion} 
                        isSelected={selectedGoals.has(suggestion.title)}
                        onToggleSelect={() => handleToggleSelect(suggestion.title)}
                    />
                ))}
            </div>
             {suggestions.length > 0 && (
                 <div className="sticky bottom-0 bg-slate-50 py-4 border-t border-slate-200">
                    <div className="flex items-center justify-end">
                        <button
                            onClick={handleConfirmSelection}
                            disabled={selectedGoals.size === 0}
                            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-slate-400 disabled:cursor-not-allowed"
                        >
                            Start {selectedGoals.size > 0 ? `${selectedGoals.size} Goal(s)` : 'Goal(s)'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GoalSuggestionsPage;
