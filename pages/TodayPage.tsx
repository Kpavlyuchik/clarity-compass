
import React, { useState, useMemo, useEffect } from 'react';
import type { ActiveGoal, Task, Milestone } from '../types';
import { ChevronDownIcon, ClockIcon, CheckCircleIcon, AlertTriangleIcon } from '../components/Icons';

interface FeedbackModalProps {
    task: Task;
    onFeedback: (feedback: Task['userFeedback']) => void;
    onClose: () => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ task, onFeedback, onClose }) => (
    <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Nice work! ✓</h3>
            <p className="text-slate-600 mb-6">How did it go with "{task.description}"?</p>
            <div className="space-y-3">
                <button onClick={() => onFeedback('smooth')} className="w-full py-3 px-4 rounded-lg bg-green-50 text-green-700 font-medium hover:bg-green-100 transition-colors text-left flex justify-between items-center">
                    <span>Went smoothly</span>
                    <span className="text-xl">✨</span>
                </button>
                <button onClick={() => onFeedback('adapted')} className="w-full py-3 px-4 rounded-lg bg-blue-50 text-blue-700 font-medium hover:bg-blue-100 transition-colors text-left flex justify-between items-center">
                    <span>Had to adapt</span>
                    <span className="text-xl">🔧</span>
                </button>
                <button onClick={() => onFeedback('hard')} className="w-full py-3 px-4 rounded-lg bg-amber-50 text-amber-700 font-medium hover:bg-amber-100 transition-colors text-left flex justify-between items-center">
                    <span>Harder than expected</span>
                    <span className="text-xl">🌪️</span>
                </button>
            </div>
            <button onClick={onClose} className="mt-6 w-full py-2 text-slate-400 text-sm font-medium hover:text-slate-600">Skip</button>
        </div>
    </div>
);

const MilestoneCompletionModal: React.FC<{ milestone: Milestone, nextMilestone?: Milestone, onClose: () => void }> = ({ milestone, nextMilestone, onClose }) => (
    <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-8 text-center animate-in fade-in zoom-in duration-300">
            <div className="text-5xl mb-4">🎉</div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Milestone Complete!</h3>
            <p className="text-slate-600 mb-6">You finished: <span className="font-bold text-indigo-600">{milestone.title}</span></p>
            {nextMilestone && (
                <div className="bg-indigo-50 p-4 rounded-lg mb-6 text-left border border-indigo-100">
                    <p className="text-xs font-bold text-indigo-600 uppercase mb-1">What's next:</p>
                    <p className="font-bold text-slate-800">{nextMilestone.title}</p>
                </div>
            )}
            <button onClick={onClose} className="w-full py-3 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors">Continue</button>
        </div>
    </div>
);

interface TodayPageProps {
    userName: string;
    activeGoals: ActiveGoal[];
    lastOpenedAt: string;
    onUpdateGoal: (goal: ActiveGoal) => void;
    onCreatePlan: (goal: ActiveGoal) => void;
    onViewAllGoals: () => void;
}

const TodayPage: React.FC<TodayPageProps> = ({ userName, activeGoals, lastOpenedAt, onUpdateGoal, onCreatePlan, onViewAllGoals }) => {
    const [justCompletedTask, setJustCompletedTask] = useState<{task: Task, goal: ActiveGoal} | null>(null);
    const [milestoneCompleted, setMilestoneCompleted] = useState<{milestone: Milestone, next?: Milestone} | null>(null);
    const [deferredTaskIds, setDeferredTaskIds] = useState<Set<string>>(new Set());

    const daysDiff = useMemo(() => {
        const last = new Date(lastOpenedAt);
        const diff = (new Date().getTime() - last.getTime()) / (1000 * 60 * 60 * 24);
        return diff;
    }, [lastOpenedAt]);

    const isWelcomeBack = daysDiff >= 3;
    const isLongAbsence = daysDiff >= 14;

    const activePlannedGoals = useMemo(() => activeGoals.filter(g => g.status === 'active' && g.breakdown), [activeGoals]);

    const surfacedTasks = useMemo(() => {
        const candidates: {task: Task, goal: ActiveGoal, milestone: Milestone}[] = [];
        
        activePlannedGoals.forEach(goal => {
            const milestone = goal.breakdown!.milestones.find(m => !m.isCompleted);
            if (milestone) {
                const task = milestone.tasks.find(t => !t.isCompleted && !deferredTaskIds.has(t.id));
                if (task) {
                    candidates.push({ task, goal, milestone });
                }
            }
        });

        // Sort by lastWorkedOn (oldest first)
        return candidates
            .sort((a, b) => {
                const dateA = new Date(a.goal.lastWorkedOn || 0).getTime();
                const dateB = new Date(b.goal.lastWorkedOn || 0).getTime();
                return dateA - dateB;
            })
            .slice(0, 3);
    }, [activePlannedGoals, deferredTaskIds]);

    const calculateProgress = (goal: ActiveGoal) => {
        if (!goal.breakdown) return 0;
        const total = goal.breakdown.milestones.reduce((acc, m) => acc + m.tasks.length, 0);
        const completed = goal.breakdown.milestones.reduce((acc, m) => acc + m.tasks.filter(t => t.isCompleted).length, 0);
        return Math.round((completed / total) * 100);
    };

    const handleCompleteTask = (task: Task, goal: ActiveGoal) => {
        const updatedGoal = { ...goal };
        const milestone = updatedGoal.breakdown!.milestones.find(m => m.tasks.some(t => t.id === task.id))!;
        const taskRef = milestone.tasks.find(t => t.id === task.id)!;
        
        taskRef.isCompleted = true;
        updatedGoal.lastWorkedOn = new Date().toISOString();

        // Check if milestone is complete
        if (milestone.tasks.every(t => t.isCompleted)) {
            milestone.isCompleted = true;
            const nextIdx = updatedGoal.breakdown!.milestones.indexOf(milestone) + 1;
            const next = updatedGoal.breakdown!.milestones[nextIdx];
            setMilestoneCompleted({ milestone, next });
        }

        onUpdateGoal(updatedGoal);
        setJustCompletedTask({ task, goal: updatedGoal });
    };

    const handleDeferTask = (taskId: string) => {
        setDeferredTaskIds(prev => new Set(prev).add(taskId));
    };

    const handleFeedback = (feedback: Task['userFeedback']) => {
        if (!justCompletedTask) return;
        const { task, goal } = justCompletedTask;
        const milestone = goal.breakdown!.milestones.find(m => m.tasks.some(t => t.id === task.id))!;
        const taskRef = milestone.tasks.find(t => t.id === task.id)!;
        taskRef.userFeedback = feedback;
        onUpdateGoal(goal);
        setJustCompletedTask(null);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                    {isWelcomeBack ? `Welcome back, ${userName}! 👋` : `Good morning, ${userName}! 👋`}
                </h2>
                <p className="mt-2 text-lg text-slate-600">
                    {isWelcomeBack 
                        ? `You were working on "${activePlannedGoals[0]?.title || 'your plans'}". Ready to pick it back up?` 
                        : "Here's what's next. Focus on progress, not perfection."}
                </p>
            </div>

            {isLongAbsence && (
                <div className="bg-amber-50 border border-amber-200 p-5 rounded-xl animate-in slide-in-from-top-4 duration-500">
                    <div className="flex gap-4">
                        <div className="p-2 bg-amber-100 rounded-lg h-fit">
                            <AlertTriangleIcon className="w-6 h-6 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-amber-900 font-bold">It's been a while! ✨</p>
                            <p className="text-amber-800 text-sm mt-1">Life happens, and that's okay. Do you want to adjust your goal timelines to better fit your current energy and schedule?</p>
                            <div className="flex gap-3 mt-4">
                                <button onClick={onViewAllGoals} className="bg-amber-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors">Yes, adjust my goals</button>
                                <button onClick={() => {}} className="text-amber-700 text-xs font-bold px-4 py-2 rounded-lg hover:bg-amber-100 transition-colors">Maybe later</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activePlannedGoals.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-xl font-bold text-slate-800">Your Progress</h3>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {activePlannedGoals.map(goal => {
                            const progress = calculateProgress(goal);
                            return (
                                <button 
                                    key={goal.id} 
                                    onClick={() => onViewAllGoals()}
                                    className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-left hover:border-indigo-300 transition-all"
                                >
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="font-bold text-slate-800 text-sm truncate pr-2">{goal.title}</span>
                                        <span className="text-xs font-bold text-indigo-600 shrink-0">{progress}%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                        <div className="bg-indigo-500 h-1.5 rounded-full transition-all duration-1000" style={{ width: `${progress}%` }} />
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {surfacedTasks.length > 0 ? (
                <div className="space-y-6">
                    <h3 className="text-xl font-bold text-slate-800">Next Up</h3>
                    <div className="grid gap-4">
                        {surfacedTasks.map(({ task, goal, milestone }) => (
                            <TodayTaskItem 
                                key={task.id} 
                                task={task} 
                                goalTitle={goal.title} 
                                milestoneTitle={milestone.title} 
                                onComplete={() => handleCompleteTask(task, goal)} 
                                onDefer={() => handleDeferTask(task.id)}
                            />
                        ))}
                    </div>
                </div>
            ) : activePlannedGoals.length > 0 ? (
                <div className="bg-white p-12 text-center rounded-xl border-2 border-dashed border-slate-200 animate-in fade-in zoom-in duration-500">
                    <div className="text-4xl mb-4">🌈</div>
                    <p className="font-bold text-slate-800">You're all caught up for today!</p>
                    <p className="text-slate-500">Take a break, you've earned it. Or check your other milestones.</p>
                </div>
            ) : null}

            {activeGoals.some(g => !g.breakdown) && (
                <div className="space-y-4">
                    <h3 className="text-xl font-bold text-slate-800">Pending Plans</h3>
                    {activeGoals.filter(g => !g.breakdown).map(goal => (
                        <div key={goal.id} className="bg-white p-6 rounded-xl border border-slate-200 flex justify-between items-center shadow-sm">
                            <span className="font-bold text-slate-800">{goal.title}</span>
                            <button onClick={() => onCreatePlan(goal)} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-700 shadow-sm transition-all">Create Plan</button>
                        </div>
                    ))}
                </div>
            )}

            <div className="flex justify-center pt-4">
                <button onClick={onViewAllGoals} className="text-indigo-600 font-bold hover:underline px-4 py-2">View All Goals & History</button>
            </div>

            {justCompletedTask && <FeedbackModal task={justCompletedTask.task} onFeedback={handleFeedback} onClose={() => setJustCompletedTask(null)} />}
            {milestoneCompleted && <MilestoneCompletionModal milestone={milestoneCompleted.milestone} nextMilestone={milestoneCompleted.next} onClose={() => setMilestoneCompleted(null)} />}
        </div>
    );
};

const TodayTaskItem: React.FC<{ task: Task, goalTitle: string, milestoneTitle: string, onComplete: () => void, onDefer: () => void }> = ({ task, goalTitle, milestoneTitle, onComplete, onDefer }) => {
    const [expanded, setExpanded] = useState(false);
    
    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden group">
            <div className="p-5 flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest truncate">{goalTitle} → {milestoneTitle}</p>
                    <h4 className="text-lg font-bold text-slate-800 mt-0.5">{task.description}</h4>
                    <div className="flex items-center gap-4 mt-2 text-slate-500 text-sm">
                        <span className="flex items-center gap-1.5 shrink-0"><ClockIcon className="w-4 h-4" /> {task.estimatedTime}</span>
                        <button onClick={() => setExpanded(!expanded)} className="text-indigo-600 font-bold flex items-center gap-1 shrink-0">
                            {expanded ? 'Collapse' : 'Expand Details'} <ChevronDownIcon className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                        </button>
                    </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <button onClick={onDefer} className="flex-1 sm:flex-none py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 font-bold text-xs transition-colors">Not today</button>
                    <button onClick={onComplete} className="flex-1 sm:flex-none py-2.5 px-5 rounded-xl bg-green-500 hover:bg-green-600 text-white transition-colors flex items-center justify-center">
                        <CheckCircleIcon className="w-6 h-6" />
                    </button>
                </div>
            </div>
            {expanded && (
                <div className="px-5 pb-5 pt-2 border-t border-slate-50 bg-slate-50/50 space-y-4 animate-in slide-in-from-top-2 duration-200">
                    <div className="prose prose-sm text-slate-600 max-w-none">
                        <p className="font-bold text-slate-700">Detailed Steps:</p>
                        <ol className="list-decimal list-inside space-y-2">
                            {task.detailedSteps.map((step, i) => <li key={i}>{step}</li>)}
                        </ol>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="bg-white p-3 rounded-xl border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">What you need</p>
                            <p className="text-sm text-slate-600">{task.whatYouNeed.join(', ') || 'No special tools needed'}</p>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Success criteria</p>
                            <p className="text-sm text-slate-600">{task.successLooksLike}</p>
                        </div>
                    </div>
                    {task.commonObstacles?.length > 0 && (
                        <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                            <p className="text-xs font-bold text-amber-700 uppercase mb-2">Heads up: Potential obstacles</p>
                            <ul className="space-y-2">
                                {task.commonObstacles.map((obs, idx) => (
                                    <li key={idx} className="text-xs text-amber-900">
                                        <strong>{obs.obstacle}:</strong> {obs.solution}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default TodayPage;
