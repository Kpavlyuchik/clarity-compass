
import React, { useState, useMemo } from 'react';
import type { ActiveGoal, Task, Milestone } from '../types';
import { generateGoalImage, getTaskHelp } from '../services/geminiService';
import { ChevronDownIcon, ClockIcon, CheckCircleIcon, ArrowLeftIcon, AlertTriangleIcon } from '../components/Icons';
import AILoadingIndicator from '../components/AILoadingIndicator';

const GoalsPage: React.FC<{ allGoals: ActiveGoal[], onCreatePlan: (goal: ActiveGoal) => void, onUpdateGoal: (goal: ActiveGoal) => void, onBack: () => void }> = ({ allGoals, onCreatePlan, onUpdateGoal, onBack }) => {
    const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);

    const selectedGoal = useMemo(() => allGoals.find(g => g.id === selectedGoalId), [allGoals, selectedGoalId]);

    if (selectedGoal) {
        return <GoalDetailView goal={selectedGoal} onUpdateGoal={onUpdateGoal} onBack={() => setSelectedGoalId(null)} />;
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            <div>
                <h2 className="text-3xl font-bold text-slate-900">Your Compass</h2>
                <p className="text-slate-500 mt-2">Track your progress and adjust your trajectory.</p>
            </div>

            <div className="grid gap-4">
                {allGoals.map(goal => (
                    <GoalSummaryCard key={goal.id} goal={goal} onClick={() => setSelectedGoalId(goal.id)} />
                ))}
            </div>

            {allGoals.length === 0 && (
                <div className="bg-white p-12 text-center rounded-xl border-2 border-dashed border-slate-200">
                    <p className="text-slate-500">No goals yet. Go back and check in!</p>
                </div>
            )}
        </div>
    );
};

const GoalSummaryCard: React.FC<{ goal: ActiveGoal, onClick: () => void }> = ({ goal, onClick }) => {
    const progress = useMemo(() => {
        if (!goal.breakdown) return 0;
        const total = goal.breakdown.milestones.reduce((acc, m) => acc + m.tasks.length, 0);
        const completed = goal.breakdown.milestones.reduce((acc, m) => acc + m.tasks.filter(t => t.isCompleted).length, 0);
        return Math.round((completed / total) * 100);
    }, [goal]);

    return (
        <button onClick={onClick} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-all text-left">
            <div className="flex justify-between items-start">
                <div>
                    <h4 className="text-xl font-bold text-slate-800">{goal.title}</h4>
                    <p className="text-sm text-slate-500 mt-1">{goal.difficulty} · ~{goal.timeframeWeeks}w</p>
                </div>
                <div className="bg-indigo-50 text-indigo-700 font-bold px-3 py-1 rounded-full text-xs">{progress}%</div>
            </div>
            {goal.breakdown && (
                <div className="mt-6 w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-indigo-500 h-2 rounded-full transition-all duration-1000" style={{ width: `${progress}%` }} />
                </div>
            )}
        </button>
    );
};

const GoalDetailView: React.FC<{ goal: ActiveGoal, onUpdateGoal: (goal: ActiveGoal) => void, onBack: () => void }> = ({ goal, onUpdateGoal, onBack }) => {
    const [helpTask, setHelpTask] = useState<Task | null>(null);
    const [helpResponse, setHelpResponse] = useState<any>(null);
    const [isAskingHelp, setIsAskingHelp] = useState(false);

    const totalTasks = goal.breakdown?.milestones.reduce((acc, m) => acc + m.tasks.length, 0) ?? 0;
    const completedTasks = goal.breakdown?.milestones.reduce((acc, m) => acc + m.tasks.filter(t => t.isCompleted).length, 0) ?? 0;
    const progress = Math.round((completedTasks / totalTasks) * 100);

    const handleHelpRequest = async (task: Task) => {
        setHelpTask(task);
        setIsAskingHelp(true);
        try {
            const res = await getTaskHelp(goal, task);
            setHelpResponse(res);
        } catch (e) { console.error(e); }
        setIsAskingHelp(false);
    };

    const handleReplaceTask = () => {
        if (!helpTask || !helpResponse?.replacementTask) return;
        const updatedGoal = { ...goal };
        const milestone = updatedGoal.breakdown!.milestones.find(m => m.tasks.some(t => t.id === helpTask.id))!;
        const taskIdx = milestone.tasks.findIndex(t => t.id === helpTask.id);
        milestone.tasks[taskIdx] = { 
            ...milestone.tasks[taskIdx], 
            ...helpResponse.replacementTask,
            id: Math.random().toString(36).substr(2, 9) 
        };
        onUpdateGoal(updatedGoal);
        setHelpTask(null);
        setHelpResponse(null);
    };

    return (
        <div className="space-y-8 animate-in slide-in-from-left-4 duration-300">
            <header>
                <button onClick={onBack} className="flex items-center text-slate-500 hover:text-slate-800 mb-4"><ArrowLeftIcon className="w-4 h-4 mr-2" /> Back</button>
                <h2 className="text-3xl font-bold text-slate-900">{goal.title}</h2>
                {goal.personalWhy && <p className="text-indigo-600 font-medium italic mt-2">"{goal.personalWhy}"</p>}
            </header>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-end mb-4">
                    <span className="text-slate-500 font-bold text-xs uppercase tracking-widest">Progress: {progress}%</span>
                    <span className="text-slate-800 font-bold">{completedTasks}/{totalTasks} tasks</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3">
                    <div className="bg-green-500 h-3 rounded-full transition-all duration-1000" style={{ width: `${progress}%` }} />
                </div>
            </div>

            <div className="space-y-4">
                {goal.breakdown?.milestones.map((m) => (
                    <MilestoneAccordion key={m.id} milestone={m} onUpdateTask={(task) => {
                        const updated = { ...goal };
                        const targetMilestone = updated.breakdown!.milestones.find(ms => ms.id === m.id)!;
                        const targetTaskIdx = targetMilestone.tasks.findIndex(t => t.id === task.id);
                        targetMilestone.tasks[targetTaskIdx] = task;
                        if (targetMilestone.tasks.every(t => t.isCompleted)) targetMilestone.isCompleted = true;
                        onUpdateGoal(updated);
                    }} onHelp={handleHelpRequest} />
                ))}
            </div>

            <div className="flex gap-4 pt-4 border-t border-slate-200">
                <button className="flex-1 py-3 px-4 rounded-xl border border-slate-300 font-bold text-slate-600 hover:bg-slate-50">Pause Goal</button>
                <button className="flex-1 py-3 px-4 rounded-xl border border-red-200 text-red-600 font-bold hover:bg-red-50">Archive Goal</button>
            </div>

            {helpTask && (
                <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 animate-in zoom-in duration-200">
                        <h3 className="text-2xl font-bold text-slate-900 mb-2">Help with your task</h3>
                        <p className="text-slate-500 mb-6 italic">"{helpTask.description}"</p>
                        
                        {isAskingHelp ? (
                            <div className="py-12 flex flex-col items-center">
                                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
                                <p className="text-slate-600 font-medium">Gemini is thinking of a simpler way...</p>
                            </div>
                        ) : helpResponse && (
                            <div className="space-y-6">
                                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                                    <p className="text-xs font-bold text-indigo-600 uppercase mb-2">Another way to look at it:</p>
                                    <p className="text-slate-800 text-sm leading-relaxed">{helpResponse.explanation}</p>
                                </div>
                                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                                    <p className="text-xs font-bold text-amber-600 uppercase mb-2">Tiny first step (2 mins):</p>
                                    <p className="text-slate-800 text-sm font-bold">{helpResponse.smallerFirstStep}</p>
                                </div>
                                <div className="border-t pt-6">
                                    <button onClick={handleReplaceTask} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg">Replace task with simpler version</button>
                                </div>
                            </div>
                        )}
                        {!isAskingHelp && <button onClick={() => setHelpTask(null)} className="mt-4 w-full text-slate-400 font-medium py-2">Close</button>}
                    </div>
                </div>
            )}
        </div>
    );
};

const MilestoneAccordion: React.FC<{ milestone: Milestone, onUpdateTask: (task: Task) => void, onHelp: (task: Task) => void }> = ({ milestone, onUpdateTask, onHelp }) => {
    const [isOpen, setIsOpen] = useState(!milestone.isCompleted);
    return (
        <div className={`bg-white rounded-xl border ${milestone.isCompleted ? 'border-slate-100 opacity-60' : 'border-slate-200 shadow-sm'} overflow-hidden`}>
            <button onClick={() => setIsOpen(!isOpen)} className="w-full p-5 flex justify-between items-center text-left">
                <div>
                    <h4 className="font-bold text-slate-800 flex items-center gap-2">
                        {milestone.isCompleted && <CheckCircleIcon className="w-5 h-5 text-green-500" />}
                        {milestone.title}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">{milestone.tasks.length} tasks · {milestone.durationWeeks} weeks</p>
                </div>
                <ChevronDownIcon className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="px-5 pb-5 pt-2 space-y-3">
                    {milestone.tasks.map(task => (
                        <div key={task.id} className="group p-4 rounded-xl border border-slate-100 hover:border-indigo-100 transition-all flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <button onClick={() => onUpdateTask({ ...task, isCompleted: !task.isCompleted })} className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${task.isCompleted ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300'}`}>
                                    {task.isCompleted && <CheckCircleIcon className="w-4 h-4" />}
                                </button>
                                <span className={`text-sm font-medium ${task.isCompleted ? 'line-through text-slate-400' : 'text-slate-700'}`}>{task.description}</span>
                            </div>
                            {!task.isCompleted && (
                                <button onClick={() => onHelp(task)} className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors" title="I need help">
                                    <AlertTriangleIcon className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default GoalsPage;
