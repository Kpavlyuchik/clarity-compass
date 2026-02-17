
import React, { useState } from 'react';
import { analyzeWeekStructure } from '../services/geminiService';
import AILoadingIndicator from '../components/AILoadingIndicator';
import type { WeekStructure } from '../types';

const WeekMappingPage: React.FC<{ onComplete: (pockets: string[], structure: WeekStructure) => void }> = ({ onComplete }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [structure, setStructure] = useState<WeekStructure>({
        wakeTime: '',
        workHours: '',
        commute: '',
        energyPeak: 'midday',
        weekendType: 'unstructured',
        afterWorkRoutine: '',
        windDownTime: ''
    });
    const [pockets, setPockets] = useState<string[]>([]);
    const [rationale, setRationale] = useState('');

    const handleAnalyze = async () => {
        setIsLoading(true);
        try {
            const result = await analyzeWeekStructure(structure);
            setPockets(result.natural_pockets);
            setRationale(result.rationale);
        } catch (e) { console.error(e); }
        setIsLoading(false);
    };

    if (isLoading) return <AILoadingIndicator message="Analyzing your week to find natural energy pockets..." />;

    if (pockets.length > 0) {
        return (
            <div className="space-y-8 animate-in slide-in-from-right-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900">Found your pockets! ✨</h2>
                    <p className="text-slate-600 mt-2">{rationale}</p>
                </div>
                <div className="grid gap-4">
                    {pockets.map((pocket, idx) => (
                        <div key={idx} className="bg-white p-5 rounded-xl border-2 border-indigo-100 flex items-center gap-4">
                            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 flex items-center justify-center rounded-lg font-bold">
                                {idx + 1}
                            </div>
                            <span className="font-bold text-slate-800">{pocket}</span>
                        </div>
                    ))}
                </div>
                <button onClick={() => onComplete(pockets, structure)} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg transition-all">
                    These look right, continue
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in">
            <div>
                <h2 className="text-3xl font-bold text-slate-900">Map Your Week</h2>
                <p className="text-slate-600 mt-2">Let's find the natural rhythm of your days. No right or wrong answers, just your reality.</p>
            </div>

            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">When do you wake up?</label>
                        <input type="text" placeholder="e.g. 7:30 AM" className="w-full p-3 border-2 border-slate-200 rounded-lg focus:border-indigo-500 outline-none" onChange={e => setStructure({...structure, wakeTime: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Standard work/study hours?</label>
                        <input type="text" placeholder="e.g. 9-5" className="w-full p-3 border-2 border-slate-200 rounded-lg focus:border-indigo-500 outline-none" onChange={e => setStructure({...structure, workHours: e.target.value})} />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">When do you feel most 'on' or energetic?</label>
                    <div className="grid grid-cols-3 gap-2">
                        {['morning', 'midday', 'evening'].map(t => (
                            <button key={t} onClick={() => setStructure({...structure, energyPeak: t as any})} className={`p-3 rounded-lg border-2 font-bold capitalize ${structure.energyPeak === t ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-500'}`}>{t}</button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">What's the first thing you do after work/commitments?</label>
                    <input type="text" placeholder="e.g. Pet the cat, make coffee, scroll phone" className="w-full p-3 border-2 border-slate-200 rounded-lg focus:border-indigo-500 outline-none" onChange={e => setStructure({...structure, afterWorkRoutine: e.target.value})} />
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">How are your weekends usually?</label>
                    <div className="grid grid-cols-2 gap-2">
                        {['structured', 'unstructured'].map(t => (
                            <button key={t} onClick={() => setStructure({...structure, weekendType: t as any})} className={`p-3 rounded-lg border-2 font-bold capitalize ${structure.weekendType === t ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-500'}`}>{t}</button>
                        ))}
                    </div>
                </div>

                <button onClick={handleAnalyze} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg transition-all">
                    Find my natural pockets
                </button>
            </div>
        </div>
    );
};

export default WeekMappingPage;
