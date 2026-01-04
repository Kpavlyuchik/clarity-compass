
import React, { useEffect, useState } from 'react';
import type { GoalSuggestion, LifeAreaRating, Milestone, Task, ActiveGoal, GoalBreakdown } from '../types';
import { generateDetailedBreakdown } from '../services/geminiService';
import AILoadingIndicator from '../components/AILoadingIndicator';
import { ChevronDownIcon, ClockIcon, CalendarIcon, CheckCircleIcon, AlertTriangleIcon } from '../components/Icons';

interface TaskDetailProps {
    task: Task;
}
const TaskDetail: React.FC<TaskDetailProps> = ({ task }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="pl-6 border-l-2 border-slate-200 ml-3">
             <div className="relative">
                <span className="absolute -left-[1.6rem] top-1.5 h-4 w-4 rounded-full bg-white border-2 border-slate-300"></span>
                <button
                    className="w-full text-left flex justify-between items-center py-3"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <span className="font-medium text-slate-800">{task.description}</span>
                    <div className="flex items-center space-x-4 text-sm text-slate-500">
                        <div className="flex items-center">
                            <ClockIcon className="w-4 h-4 mr-1" />
                            <span>{task.estimatedTime}</span>
                        </div>
                        <ChevronDownIcon className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                </button>

                {isExpanded && (
                    <div className="pb-4 space-y-4">
                        <div className="prose prose-sm max-w-none text-slate-600">
                            <p className="font-semibold text-slate-700">Detailed Steps:</p>
                            <ol>
                                {task.detailedSteps.map((step, i) => <li key={i}>{step}</li>)}
                            </ol>
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="bg-slate-100 p-3 rounded-lg">
                                <p className="font-semibold text-slate-700 mb-1">What you'll need:</p>
                                <ul className="list-disc list-inside text-slate-600">
                                    {task.whatYouNeed.map((item, i) => <li key={i}>{item}</li>)}
                                </ul>
                            </div>
                            <div className="bg-slate-100 p-3 rounded-lg">
                                <p className="font-semibold text-slate-700 mb-1">When to do it:</p>
                                <div className="flex items-center text-slate-600">
                                    <CalendarIcon className="w-4 h-4 mr-2" />
                                    <p>{task.whenToDo}</p>
                                </div>
                            </div>
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

                        {task.celebrationNote && (
                            <p className="text-sm text-indigo-600 font-medium pt-2">🎉 {task.celebrationNote}</p>
                        )}
                    </div>
                )}
             </div>
        </div>
    );
};

interface MilestoneAccordionProps {
    milestone: Milestone;
    index: number;
}
const MilestoneAccordion: React.FC<MilestoneAccordionProps> = ({ milestone, index }) => {
    const [isOpen, setIsOpen] = useState(index === 0);

    return (
        <div className="bg-white border border-slate-200 rounded-lg">
            <button
                className="w-full flex justify-between items-center p-4 text-left"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div>
                    <p className="text-sm font-semibold text-indigo-600">MILESTONE {milestone.order}</p>
                    <h3 className="text-lg font-bold text-slate-900">{milestone.title}</h3>
                </div>
                <div className="flex items-center">
                    <span className="text-sm text-slate-500 mr-4">~{milestone.durationWeeks} week{milestone.durationWeeks > 1 ? 's' : ''}</span>
                    <ChevronDownIcon className={`w-6 h-6 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </button>
            {isOpen && (
                <div className="px-4 pb-4 border-t border-slate-200">
                    <div className="prose prose-sm max-w-none text-slate-600 my-4">
                        <p><strong>Why this comes first:</strong> {milestone.whyThisMilestone}</p>
                        <p><strong>You'll know you're done when:</strong> {milestone.completionCriteria}</p>
                    </div>
                    <div className="space-y-2">
                        {milestone.tasks.sort((a,b) => a.order - b.order).map(task => <TaskDetail key={task.order} task={task} />)}
                    </div>
                </div>
            )}
        </div>
    );
};

interface GoalBreakdownPageProps {
    goal: GoalSuggestion;
    userContext: LifeAreaRating[];
    onApprove: (goalWithBreakdown: ActiveGoal) => void;
    onBack: () => void;
}

const GoalBreakdownPage: React.FC<GoalBreakdownPageProps> = ({ goal, userContext, onApprove, onBack }) => {
    const [breakdown, setBreakdown] = useState<GoalBreakdown | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setIsLoading(true);
        generateDetailedBreakdown(goal, userContext)
            .then(b => {
                setBreakdown(b);
            })
            .catch(err => {
                console.error(err);
                setError("I had trouble creating a detailed plan. The AI might be busy. Please try again in a moment.");
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, [goal, userContext]);

    const handleApprove = () => {
        if (!breakdown) return;
        onApprove({ ...goal, breakdown });
    };
    
    if (isLoading) {
        return <AILoadingIndicator message="Building your detailed, step-by-step plan..." />;
    }

    if (error) {
        return (
            <div className="text-center p-8 bg-white border border-red-300 rounded-lg">
                <h3 className="text-xl font-semibold text-red-700">An Error Occurred</h3>
                <p className="mt-2 text-red-600">{error}</p>
                 <button onClick={onBack} className="mt-4 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">Back to My Goals</button>
            </div>
        );
    }

    if (!breakdown) return null;

    return (
        <div className="space-y-8">
            <div>
                <p className="text-base font-semibold text-indigo-600">Your New Goal</p>
                <h2 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">{goal.title}</h2>
            </div>

            <div className="bg-indigo-50 border-l-4 border-indigo-400 p-4 rounded-r-lg">
                <h3 className="font-semibold text-indigo-800">Overall Approach</h3>
                <p className="text-sm text-indigo-700 mt-1">{breakdown.overallApproach}</p>
            </div>

            <div className="space-y-4">
                {breakdown.milestones.sort((a,b) => a.order - b.order).map((milestone, i) => (
                    <MilestoneAccordion key={milestone.order} milestone={milestone} index={i} />
                ))}
            </div>

             <div className="bg-slate-100 p-4 rounded-lg text-center">
                <p className="text-sm text-slate-600"><strong className="text-slate-800">Flexibility Reminder:</strong> {breakdown.flexibilityNote}</p>
            </div>

            <div className="flex items-center justify-between pt-4">
                 <button
                    onClick={onBack}
                    className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-6 py-3 text-base font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                    Back to My Goals
                </button>
                 <button
                    onClick={handleApprove}
                    className="inline-flex items-center justify-center rounded-md border border-transparent bg-green-600 px-8 py-3 text-base font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                    Looks good, let's start!
                </button>
            </div>
        </div>
    );
};

export default GoalBreakdownPage;
