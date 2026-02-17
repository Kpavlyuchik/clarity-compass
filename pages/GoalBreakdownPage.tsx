
import React, { useEffect, useState } from 'react';
import type { GoalSuggestion, LifeAreaRating, ActiveGoal, GoalBreakdown, UserProfile } from '../types';
import { generateDetailedBreakdown, adjustBreakdownTimeframe } from '../services/geminiService';
import AILoadingIndicator from '../components/AILoadingIndicator';
import { ArrowLeftIcon } from '../components/Icons';

enum AdoptionStep {
    VIEW_PLAN,
    HABIT_STACK,
    SUCCESS
}

const GoalBreakdownPage: React.FC<{ 
    goal: ActiveGoal | GoalSuggestion, 
    userContext: LifeAreaRating[], 
    userProfile: UserProfile,
    onApprove: (goal: ActiveGoal) => void, 
    onBack: () => void 
}> = ({ goal, userContext, userProfile, onApprove, onBack }) => {
    const [step, setStep] = useState(AdoptionStep.VIEW_PLAN);
    const [breakdown, setBreakdown] = useState<GoalBreakdown | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdjusting, setIsAdjusting] = useState(false);
    const [personalWhy, setPersonalWhy] = useState('');
    const [selectedTriggers, setSelectedTriggers] = useState<Record<string, {trigger: string, pocket: string}>>({});

    useEffect(() => {
        setIsLoading(true);
        generateDetailedBreakdown(goal, userContext, userProfile)
            .then(setBreakdown)
            .catch(() => {})
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
        
        // Apply habit stacking to relevant tasks
        const updatedBreakdown = { ...breakdown };
        updatedBreakdown.milestones.forEach(m => {
            m.tasks.forEach(t => {
                if (selectedTriggers[t.id]) {
                    t.trigger = selectedTriggers[t.id].trigger;
                    t.scheduled_pocket = selectedTriggers[t.id].pocket;
                }
            });
        });

        const active: ActiveGoal = {
            ...goal,
            id: (goal as ActiveGoal).id || Math.random().toString(36).substr(2, 9),
            status: 'active',
            breakdown: updatedBreakdown,
            personalWhy,
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
                <h2 className="text-4xl font-bold text-slate-900 mb-4">Plan Locked In!</h2>
                <p className="text-xl text-slate-600 mb-10">We've identified the best times in your week for these steps.</p>
                <button onClick={onBack} className="bg-indigo-600 text-white px-10 py-4 rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition-all scale-110">Show my dashboard</button>
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
                        <p className="text-slate-500 mt-2">A personalized {goal.timeframeWeeks}-week trajectory.</p>
                    </div>

                    <div className="space-y-6">
                        <section>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Why does this matter to you?</label>
                            <textarea value={personalWhy} onChange={(e) => setPersonalWhy(e.target.value)} placeholder="e.g., To feel more present during weekends." className="w-full p-4 rounded-xl border-2 border-slate-200 focus:border-indigo-500 outline-none h-24 text-slate-800" />
                        </section>

                        <div className="space-y-4">
                            <h3 className="font-bold text-slate-800">The Path Ahead</h3>
                            {breakdown?.milestones.map((m, i) => (
                                <div key={m.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                    <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Milestone {i + 1}</p>
                                    <h4 className="text-lg font-bold text-slate-800 mt-1">{m.title}</h4>
                                </div>
                            ))}
                        </div>

                        <section>
                            <h3 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wider">Adjustment</h3>
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { id: 'fast', label: 'Fast Track', desc: '75% time' },
                                    { id: 'normal', label: 'AI Suggested', desc: '100% time' },
                                    { id: 'slow', label: 'More Buffer', desc: '150% time' }
                                ].map(opt => (
                                    <button key={opt.id} onClick={() => handleAdjustTimeframe(opt.id as any)} className="p-3 rounded-xl border-2 border-slate-200 hover:border-indigo-500 text-center transition-all bg-white disabled:opacity-50">
                                        <p className="font-bold text-slate-800 text-sm">{opt.label}</p>
                                        <p className="text-[10px] text-slate-500">{opt.desc}</p>
                                    </button>
                                ))}
                            </div>
                        </section>
                    </div>

                    <button onClick={() => setStep(AdoptionStep.HABIT_STACK)} className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 shadow-lg">Next: Stack your habits</button>
                </div>
            ) : (
                <div className="space-y-10 animate-in slide-in-from-right-4 duration-300">
                    <div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-2">Habit Stacking</h3>
                        <p className="text-slate-600">Tasks happen when they have a home. Let's find a home for the first few steps.</p>
                    </div>

                    <div className="space-y-8">
                        {breakdown?.milestones[0].tasks.slice(0, 3).map(task => (
                            <div key={task.id} className="bg-white p-6 rounded-2xl border-2 border-slate-100 space-y-4">
                                <p className="font-bold text-slate-800">Task: "{task.description}"</p>
                                
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Fits best in:</label>
                                    <div className="flex flex-wrap gap-2">
                                        {userProfile.natural_pockets.map(pocket => (
                                            <button 
                                                key={pocket} 
                                                onClick={() => setSelectedTriggers(prev => ({...prev, [task.id]: { ...prev[task.id], pocket }}))}
                                                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${selectedTriggers[task.id]?.pocket === pocket ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-600'}`}
                                            >
                                                {pocket}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Specific trigger:</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. Right after I finish my morning coffee" 
                                        className="w-full p-3 border-2 border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none"
                                        onChange={e => setSelectedTriggers(prev => ({...prev, [task.id]: { ...prev[task.id], trigger: e.target.value }}))}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <button onClick={handleAdopt} className="w-full bg-green-600 text-white py-4 rounded-xl font-bold hover:bg-green-700 shadow-xl">Start my journey</button>
                </div>
            )}
        </div>
    );
};

export default GoalBreakdownPage;
