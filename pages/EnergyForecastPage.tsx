
import React, { useState } from 'react';
import type { EnergyForecast } from '../types';

const EnergyForecastPage: React.FC<{ onComplete: (forecast: EnergyForecast) => void }> = ({ onComplete }) => {
    const [forecast, setForecast] = useState<Partial<EnergyForecast>>({
        monday: 'ok',
        midweek: 'steady',
        friday: 'depends',
        weekend: 'relaxed'
    });

    const handleFinish = () => {
        onComplete({
            ...forecast as EnergyForecast,
            weekStartedAt: new Date().toISOString()
        });
    };

    return (
        <div className="max-w-xl mx-auto space-y-8 animate-in fade-in">
            <div className="text-center">
                <div className="text-5xl mb-4">🔋</div>
                <h2 className="text-3xl font-bold text-slate-900">Weekly Energy Forecast</h2>
                <p className="text-slate-600 mt-2">How's your battery looking for the next few days?</p>
            </div>

            <div className="space-y-6">
                {[
                    { key: 'monday', label: 'Monday Kickoff', options: [{id:'rough', l:'Rough start'}, {id:'ok', l:'Doing okay'}, {id:'good', l:'High energy'}] },
                    { key: 'midweek', label: 'Midweek Hump', options: [{id:'depleted', l:'Running low'}, {id:'steady', l:'Steady state'}, {id:'peak', l:'Peak focus'}] },
                    { key: 'friday', label: 'Friday Landing', options: [{id:'tired', l:'Always tired'}, {id:'depends', l:'Depends'}, {id:'relief', l:'Relief energy'}] },
                    { key: 'weekend', label: 'Weekend Mode', options: [{id:'recovery', l:'Recovery needed'}, {id:'relaxed', l:'Relaxed flow'}, {id:'best', l:'Best days'}] },
                ].map(day => (
                    <div key={day.key} className="space-y-3">
                        <p className="font-bold text-slate-700">{day.label}</p>
                        <div className="grid grid-cols-3 gap-2">
                            {day.options.map(opt => (
                                <button 
                                    key={opt.id}
                                    onClick={() => setForecast({...forecast, [day.key]: opt.id})}
                                    className={`p-3 rounded-xl border-2 text-xs font-bold transition-all ${forecast[day.key as keyof EnergyForecast] === opt.id ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-500'}`}
                                >
                                    {opt.l}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}

                <button onClick={handleFinish} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg mt-4">
                    Set my schedule for the week
                </button>
            </div>
        </div>
    );
};

export default EnergyForecastPage;
