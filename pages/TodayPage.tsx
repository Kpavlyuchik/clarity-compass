
import React, { useState, useMemo } from 'react';
import type { ActiveGoal, Task, Milestone, UserProfile } from '../types';
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
            <p className="text-slate-600 mb-4">How did it go with "{task.description}"?</p>
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

export const MilestoneProgressBar: React.FC<{ goal: ActiveGoal, compact?: boolean }> = ({ goal, compact = false }) => {
  if (!goal.breakdown) return null;
  const milestones = goal.breakdown.milestones;
  
  return (
    <div className={`flex w-full gap-1.5 ${compact ? 'h-1.5' : 'h-2.5'}`}>
      {milestones.map((m, idx) => {
        const isCompleted = m.isCompleted;
        const isActive = !isCompleted && milestones.slice(0, idx).every(prev => prev.isCompleted);
        
        return (
          <div 
            key={m.id}
            className={`h-full rounded-full flex-1 transition-all duration-700 ease-out relative group ${
              isCompleted ? 'bg-green-500' : isActive ? 'bg-indigo-500 ring-2 ring-indigo-200' : 'bg-slate-200'
            }`}
          >
             <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-slate-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-30 pointer-events-none">
                {m.title}
             </div>
          </div>
        );
      })}
    </div>
  );
};

interface TodayPageProps {
    userName: string;
    activeGoals: ActiveGoal[];
    userProfile: UserProfile;
    lastOpenedAt: string;
    onUpdateGoal: (goal: ActiveGoal) => void;
    onCreatePlan: (goal: ActiveGoal) => void;
    onViewAllGoals: () => void;
}

const TodayPage: React.FC<TodayPageProps> = ({ userName, activeGoals, userProfile, lastOpenedAt, onUpdateGoal, onCreatePlan, onViewAllGoals }) => {
    const [justCompletedTask, setJustCompletedTask] = useState<{task: Task, goal: ActiveGoal} | null>(null);
    const [milestoneCompleted, setMilestoneCompleted] = useState<{milestone: Milestone, next?: Milestone} | null>(null);
    const [deferredTaskIds, setDeferredTaskIds] = useState<Set<string>>(new Set());

    const activePlannedGoals = useMemo(() => activeGoals.filter(g => g.status === 'active' && g.breakdown), [activeGoals]);

    const surfacedTasks = useMemo(() => {
        const candidates: {task: Task, goal: ActiveGoal, milestone: Milestone}[] = [];
        
        // Distribution logic using energy forecast if available
        activePlannedGoals.forEach(goal => {
            const milestone = goal.breakdown!.milestones.find(m => !m.isCompleted);
            if (milestone) {
                const task = milestone.tasks.find(t => !t.isCompleted && !deferredTaskIds.has(t.id));
                if (task) {
                    candidates.push({ task, goal, milestone });
                }
            }
        });

        return candidates.slice(0, 3);
    }, [activePlannedGoals, deferredTaskIds, userProfile.energy_forecast]);

    const handleCompleteTask = (task: Task, goal: ActiveGoal) => {
        const updatedGoal = { ...goal };
        const milestone = updatedGoal.breakdown!.milestones.find(m => m.tasks.some(t => t.id === task.id))!;
        const taskRef = milestone.tasks.find(t => t.id === task.id)!;
        
        taskRef.isCompleted = true;
        updatedGoal.lastWorkedOn = new Date().toISOString();

        if (milestone.tasks.every(t => t.isCompleted)) {
            milestone.isCompleted = true;
            const nextIdx = updatedGoal.breakdown!.milestones.indexOf(milestone) + 1;
            const next = updatedGoal.breakdown!.milestones[nextIdx];
            setMilestoneCompleted({ milestone, next });
        }

        onUpdateGoal(updatedGoal);
        setJustCompletedTask({ task, goal: updatedGoal });
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
                <h2 className="text-3xl font-bold text-slate-900">Today's Horizon</h2>
                <p className="mt-2 text-lg text-slate-600">Focus on these specific pockets of momentum.</p>
            </div>

            {surfacedTasks.length > 0 ? (
                <div className="grid gap-6">
                    {surfacedTasks.map(({ task, goal, milestone }) => (
                        <TodayTaskItem 
                            key={task.id} 
                            task={task} 
                            goalTitle={goal.title} 
                            milestoneTitle={milestone.title} 
                            onComplete={() => handleCompleteTask(task, goal)} 
                            onDefer={() => setDeferredTaskIds(prev => new Set(prev).add(task.id))}
                        />
                    ))}
                </div>
            ) : (
                <div className="bg-white p-12 text-center rounded-xl border-2 border-dashed border-slate-200">
                    <div className="text-4xl mb-4">🌟</div>
                    <p className="font-bold text-slate-800">Clear path ahead!</p>
                    <p className="text-slate-500 mt-2">No pressing tasks for this moment. Enjoy the space.</p>
                </div>
            )}

            {activePlannedGoals.length > 0 && (
                <div className="pt-8 border-t border-slate-200">
                    <h3 className="text-xl font-bold text-slate-800 mb-4">Your Trajectories</h3>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {activePlannedGoals.map(goal => (
                            <button key={goal.id} onClick={onViewAllGoals} className="bg-white p-4 rounded-xl border border-slate-200 text-left">
                                <span className="font-bold text-sm block mb-2">{goal.title}</span>
                                <MilestoneProgressBar goal={goal} compact />
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {justCompletedTask && <FeedbackModal task={justCompletedTask.task} onFeedback={handleFeedback} onClose={() => setJustCompletedTask(null)} />}
            {milestoneCompleted && <MilestoneCompletionModal milestone={milestoneCompleted.milestone} nextMilestone={milestoneCompleted.next} onClose={() => setMilestoneCompleted(null)} />}
        </div>
    );
};

const TodayTaskItem: React.FC<{ task: Task, goalTitle: string, milestoneTitle: string, onComplete: () => void, onDefer: () => void }> = ({ task, goalTitle, milestoneTitle, onComplete, onDefer }) => {
    const [expanded, setExpanded] = useState(false);
    
    return (
        <div className="bg-white rounded-2xl border-2 border-slate-100 shadow-sm overflow-hidden transition-all hover:border-indigo-100">
            <div className="p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="flex-1">
                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{goalTitle} • {milestoneTitle}</p>
                        <h4 className="text-xl font-bold text-slate-900 mt-1">{task.description}</h4>
                        
                        {task.trigger && (
                            <div className="mt-3 bg-amber-50 text-amber-800 text-xs px-3 py-1.5 rounded-lg inline-flex items-center gap-2 font-bold">
                                <span>🚀 Trigger:</span>
                                <span>"{task.trigger}"</span>
                            </div>
                        )}
                        
                        <div className="flex flex-wrap gap-4 mt-4 text-slate-500 text-xs font-bold">
                            <span className="flex items-center gap-1.5"><ClockIcon className="w-4 h-4" /> {task.estimatedTime}</span>
                            <span className={`capitalize px-2 py-0.5 rounded border ${task.energy_required === 'high' ? 'text-red-600 border-red-100 bg-red-50' : task.energy_required === 'low' ? 'text-green-600 border-green-100 bg-green-50' : 'text-amber-600 border-amber-100 bg-amber-50'}`}>
                                {task.energy_required} Energy
                            </span>
                            <span className="capitalize px-2 py-0.5 rounded border border-slate-100">{task.cognitive_load.replace('-', ' ')}</span>
                        </div>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto shrink-0">
                        <button onClick={onDefer} className="flex-1 sm:flex-none px-4 py-2 text-slate-400 font-bold hover:text-slate-600">Not now</button>
                        <button onClick={onComplete} className="flex-1 sm:flex-none bg-green-500 text-white px-6 py-2 rounded-xl font-bold hover:bg-green-600 shadow-lg transition-all flex items-center justify-center">
                            <CheckCircleIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <button onClick={() => setExpanded(!expanded)} className="mt-6 w-full flex items-center justify-center gap-2 text-indigo-600 font-bold text-sm border-t border-slate-50 pt-4">
                    {expanded ? 'Hide Details' : 'View Guide'} <ChevronDownIcon className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                </button>
            </div>

            {expanded && (
                <div className="px-6 pb-6 space-y-6 animate-in slide-in-from-top-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Step-by-Step</h5>
                                <ol className="space-y-2 list-decimal list-inside text-sm text-slate-600">
                                    {task.detailedSteps.map((s, i) => <li key={i}>{s}</li>)}
                                </ol>
                            </div>
                            {task.tiny_version && (
                                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                                    <h5 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">Low Activation Option (&lt;2 min)</h5>
                                    <p className="text-sm font-bold text-slate-800">{task.tiny_version}</p>
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            <div>
                                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Activation Reducers</h5>
                                <div className="space-y-2">
                                    {task.activation_reducers.map((r, i) => (
                                        <div key={i} className="text-sm bg-slate-50 p-3 rounded-lg border border-slate-100">
                                            <span className="font-bold text-slate-800">{r.label}:</span> <span className="text-slate-600">{r.description}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {task.resources.length > 0 && (
                                <div>
                                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Quick Start Resources</h5>
                                    <div className="flex flex-wrap gap-2">
                                        {task.resources.map((res, i) => (
                                            <button 
                                                key={i} 
                                                onClick={() => res.url && window.open(res.url, '_blank')}
                                                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-bold shadow hover:bg-indigo-700 transition-all"
                                            >
                                                Open {res.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TodayPage;
