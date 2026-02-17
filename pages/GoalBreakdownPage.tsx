
import React, { useEffect, useState } from 'react';
import type { GoalSuggestion, LifeAreaRating, ActiveGoal, GoalBreakdown } from '../types';
import { generateDetailedBreakdown, generateGoalImage, adjustBreakdownTimeframe } from '../services/geminiService';
import AILoadingIndicator from '../components/AILoadingIndicator';
import { ChevronDownIcon, ClockIcon, ImageIcon, CheckCircleIcon, ArrowLeftIcon } from '../components/Icons';

enum AdoptionStep {
    VIEW_PLAN,
    PERSONALIZE,
    SUCCESS
}

const GoalBreakdownPage: React.FC<{ goal: ActiveGoal | GoalSuggestion, userContext: LifeAreaRating[], onApprove: (goal: ActiveGoal) => void, onBack: () => void }> = ({ goal, userContext, onApprove, onBack }) => {
    const [step, setStep] = useState(AdoptionStep.VIEW_PLAN);
    const [breakdown, setBreakdown] = useState<GoalBreakdown | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdjusting, setIsAdjusting] = useState(false);
    const [personalWhy, setPersonalWhy] = useState('');
    const [inspirationImage, setInspirationImage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setIsLoading(true);
        generateDetailedBreakdown(goal, userContext)
            .then(setBreakdown)
            .catch(() => setError("Couldn't build plan. Try again?"))
            .finally(() => setIsLoading(false));
    }, [goal]);

    const handleAdjustTimeframe = async (choice: 'fast' | 'normal' | 'slow') => {
        if (!breakdown) return;
        setIsAdjusting(true);
        let factor = 1;
        if (choice === 'fast') factor = 0.75;
        if (choice === 'slow') factor = 1.5;
        
        const newTotal = Math.round(goal.timeframeWeeks * factor);
        try {
            const adjusted = await adjustBreakdownTimeframe(breakdown, newTotal);
            setBreakdown(adjusted);
        } catch (e) { console.error(e); }
        setIsAdjusting(false);
    };

    const handleAdopt = () => {
        if (!breakdown) return;
        const active: ActiveGoal = {
            ...goal,
            id: (goal as ActiveGoal).id || Math.random().toString(36).substr(2, 9),
            status: 'active',
            breakdown,
            personalWhy,
            inspirationImage: inspirationImage || undefined,
            lastWorkedOn: new Date().toISOString()
        };
        onApprove(active);
        setStep(AdoptionStep.SUCCESS);
    };

    if (isLoading) return <AILoadingIndicator message="Crafting your granular step-by-step plan..." />;

    if (step === AdoptionStep.SUCCESS) {
        return (
            <div className="text-center py-20 animate-in zoom-in duration-500">
                <div className="text-6xl mb-6">🎯</div>
                <h2 className="text-4xl font-bold text-slate-900 mb-4">Your plan is saved!</h2>
                <p className="text-xl text-slate-600 mb-10">You've taken the first step toward "{goal.title}".</p>
                <button onClick={onBack} className="bg-indigo-600 text-white px-10 py-4 rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition-all scale-110">Let's see my tasks</button>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto pb-20">
            {step === AdoptionStep.VIEW_PLAN ? (
                <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                    <div>
                        <button onClick={onBack} className="flex items-center text-slate-500 hover:text-slate-800 mb-4"><ArrowLeftIcon className="w-4 h-4 mr-2" /> Back</button>
                        <h2 className="text-3xl font-bold text-slate-900">{goal.title}</h2>
                        <p className="text-slate-500 mt-2">Here is how we'll get there in {goal.timeframeWeeks} weeks.</p>
                    </div>

                    <div className="space-y-4">
                        {breakdown?.milestones.map((m, i) => (
                            <div key={m.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Milestone {i + 1} ({m.durationWeeks}w)</p>
                                <h4 className="text-lg font-bold text-slate-800 mt-1">{m.title}</h4>
                                <p className="text-sm text-slate-600 mt-2">{m.whyThisMilestone}</p>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-4">
                        <button onClick={() => setStep(AdoptionStep.PERSONALIZE)} className="flex-1 bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 shadow-lg">Looks good, customize it</button>
                    </div>
                </div>
            ) : (
                <div className="space-y-10 animate-in slide-in-from-right-4 duration-300">
                    <section>
                        <h3 className="text-2xl font-bold text-slate-900 mb-4">Make it yours</h3>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Why does this goal matter to you?</label>
                        <textarea value={personalWhy} onChange={(e) => setPersonalWhy(e.target.value)} placeholder="e.g., I want to feel more energetic for my kids." className="w-full p-5 rounded-xl border-2 border-slate-200 focus:border-indigo-500 outline-none h-32 text-slate-800" />
                    </section>

                    <section>
                        <h3 className="text-lg font-bold text-slate-900 mb-4">How is the pace?</h3>
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { id: 'fast', label: 'Speed it up', desc: '75% time' },
                                { id: 'normal', label: 'Right pace', desc: 'AI Suggest' },
                                { id: 'slow', label: 'More time', desc: '150% time' }
                            ].map(opt => (
                                <button key={opt.id} onClick={() => handleAdjustTimeframe(opt.id as any)} className="p-4 rounded-xl border-2 border-slate-200 hover:border-indigo-500 text-center transition-all bg-white disabled:opacity-50">
                                    <p className="font-bold text-slate-800">{opt.label}</p>
                                    <p className="text-xs text-slate-500">{opt.desc}</p>
                                </button>
                            ))}
                        </div>
                        {isAdjusting && <p className="text-xs text-indigo-600 mt-2 animate-pulse">Recalculating plan durations...</p>}
                    </section>

                    <button onClick={handleAdopt} className="w-full bg-green-600 text-white py-4 rounded-xl font-bold hover:bg-green-700 shadow-xl">Start this goal</button>
                </div>
            )}
        </div>
    );
};

export default GoalBreakdownPage;
