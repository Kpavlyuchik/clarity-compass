
import React, { useState, useMemo } from 'react';
import type { ActiveGoal, Task } from '../types';
import { ChevronDownIcon, ClockIcon, CalendarIcon, CheckCircleIcon, AlertTriangleIcon } from '../components/Icons';

interface TodayTaskCardProps {
    task: Task & { goalTitle: string, milestoneTitle: string };
    onComplete: (taskDescription: string) => void;
}

const TodayTaskCard: React.FC<TodayTaskCardProps> = ({ task, onComplete }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
            <div className="p-4">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">{task.goalTitle} → {task.milestoneTitle}</p>
                        <p className="text-lg font-semibold text-slate-800 mt-1">{task.description}</p>
                    </div>
                     <button onClick={() => onComplete(task.description)} className="ml-4 flex-shrink-0 p-2 rounded-full hover:bg-slate-100 group focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2" aria-label={`Mark task as complete: ${task.description}`}>
                        <div className="w-6 h-6 border-2 border-slate-400 rounded-full group-hover:border-green-500 transition-colors"></div>
                    </button>
                </div>
                <div className="mt-2 flex items-center space-x-4 text-sm text-slate-500">
                    <div className="flex items-center">
                        <ClockIcon className="w-4 h-4 mr-1.5" />
                        <span>{task.estimatedTime}</span>
                    </div>
                    <div className="flex items-center">
                        <CalendarIcon className="w-4 h-4 mr-1.5" />
                        <span>{task.whenToDo}</span>
                    </div>
                </div>
                 <button 
                    onClick={() => setIsExpanded(!isExpanded)} 
                    className="mt-3 text-sm font-semibold text-indigo-600 hover:text-indigo-800 flex items-center"
                >
                    {isExpanded ? 'Hide' : 'Show'} detailed steps
                    <ChevronDownIcon className={`w-4 h-4 ml-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                 </button>
            </div>
            {isExpanded && (
                <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-4">
                    <div className="prose prose-sm max-w-none text-slate-600">
                        <p className="font-semibold text-slate-700">Detailed Steps:</p>
                        <ol>
                            {task.detailedSteps.map((step, i) => <li key={i}>{step}</li>)}
                        </ol>
                    </div>
                    
                    <div className="bg-green-50 border border-green-200 p-3 rounded-lg flex items-start">
                         <CheckCircleIcon className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="font-semibold text-green-800">Success looks like:</p>
                            <p className="text-sm text-green-700">{task.successLooksLike}</p>
                        </div>
                    </div>

                    {task.commonObstacles?.length > 0 && (
                         <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                            <p className="font-semibold text-yellow-800 mb-2 flex items-center"><AlertTriangleIcon className="w-5 h-5 mr-2"/> Common Obstacles:</p>
                            <div className="space-y-2 text-sm">
                                {task.commonObstacles.map((obs, i) => (
                                    <div key={i}>
                                        <p className="text-yellow-700"><strong>Problem:</strong> {obs.obstacle}</p>
                                        <p className="text-yellow-700"><strong>Solution:</strong> {obs.solution}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};


interface GoalProgressCardProps {
    goal: ActiveGoal;
    completedTasks: string[];
    onCreatePlan: (goal: ActiveGoal) => void;
}

const GoalProgressCard: React.FC<GoalProgressCardProps> = ({ goal, completedTasks, onCreatePlan }) => {
    const totalTasks = goal.breakdown?.milestones.reduce((acc, m) => acc + m.tasks.length, 0) ?? 0;
    const goalTasks = goal.breakdown?.milestones.flatMap(m => m.tasks.map(t => t.description)) ?? [];
    const completedGoalTasks = goalTasks.filter(t => completedTasks.includes(t)).length;
    const progress = totalTasks > 0 ? (completedGoalTasks / totalTasks) * 100 : 0;

    return (
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
            <h3 className="text-xl font-bold text-indigo-700">{goal.title}</h3>
            {goal.breakdown ? (
                <div className="mt-4">
                    <div className="flex justify-between mb-1">
                        <span className="text-base font-medium text-slate-700">Progress</span>
                        <span className="text-sm font-medium text-slate-500">{completedGoalTasks} of {totalTasks} tasks complete</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2.5">
                        <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                    </div>
                </div>
            ) : (
                <div className="mt-4 text-center">
                    <p className="text-sm text-slate-500">Ready to break this down into small, manageable steps?</p>
                    <button 
                        onClick={() => onCreatePlan(goal)}
                        className="mt-3 inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                        Create Plan
                    </button>
                </div>
            )}
        </div>
    );
};


interface TodayPageProps {
    activeGoals: ActiveGoal[];
    onCreatePlan: (goal: ActiveGoal) => void;
}

const TodayPage: React.FC<TodayPageProps> = ({ activeGoals, onCreatePlan }) => {
    const [completedTasks, setCompletedTasks] = useState<string[]>([]);

    const handleTaskComplete = (taskDescription: string) => {
        setCompletedTasks(prev => [...prev, taskDescription]);
    };

    const plannedGoals = useMemo(() => activeGoals.filter(g => g.breakdown), [activeGoals]);

    const nextTasks = useMemo(() => {
        const allTasks = plannedGoals.flatMap(g => 
            g.breakdown!.milestones.flatMap(m => 
                m.tasks.map(t => ({...t, goalTitle: g.title, milestoneTitle: m.title}))
            )
        );
        return allTasks.filter(t => !completedTasks.includes(t.description)).slice(0, 3);
    }, [plannedGoals, completedTasks]);
    
    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-900">Good morning! 👋</h2>
                <p className="mt-2 text-lg text-slate-600">Here's what's next for you. Focus on progress, not perfection.</p>
            </div>
            
            <div>
                <h3 className="text-2xl font-bold tracking-tight text-slate-900 mb-4">Your Active Goals</h3>
                {activeGoals.length > 0 ? (
                    <div className="space-y-4">
                        {activeGoals.map(goal => (
                            <GoalProgressCard key={goal.title} goal={goal} completedTasks={completedTasks} onCreatePlan={onCreatePlan} />
                        ))}
                    </div>
                ) : (
                     <div className="text-center py-12 px-6 bg-white rounded-lg border-2 border-dashed border-slate-300">
                        <h3 className="text-lg font-medium text-slate-900">No active goals yet!</h3>
                        <p className="mt-1 text-sm text-slate-500">Go through the check-in to get some personalized suggestions.</p>
                    </div>
                )}
            </div>

            {plannedGoals.length > 0 && (
                 <div>
                    <h3 className="text-2xl font-bold tracking-tight text-slate-900 mb-4">Next Up</h3>
                    <div className="space-y-4">
                         {nextTasks.length > 0 ? (
                            nextTasks.map(task => (
                                <TodayTaskCard
                                    key={task.description}
                                    task={task}
                                    onComplete={handleTaskComplete}
                                />
                            ))
                        ) : (
                            <div className="text-center py-12 px-6 bg-white rounded-lg border-2 border-dashed border-slate-300">
                                 <CheckCircleIcon className="mx-auto h-12 w-12 text-green-500" />
                                 <h3 className="mt-2 text-lg font-medium text-slate-900">All tasks completed!</h3>
                                 <p className="mt-1 text-sm text-slate-500">You've finished all the steps for your currently planned goals. Amazing work!</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {completedTasks.length > 0 && (
                <div>
                    <h3 className="text-xl font-bold tracking-tight text-slate-900 mb-4">✅ Completed Today</h3>
                    <div className="bg-white p-4 rounded-lg border border-slate-200">
                        <ul className="space-y-2">
                           {completedTasks.map(taskDesc => (
                               <li key={taskDesc} className="text-slate-500 line-through">
                                   {taskDesc}
                               </li>
                           ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TodayPage;
