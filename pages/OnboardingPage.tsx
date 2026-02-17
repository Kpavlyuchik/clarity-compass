
import React, { useState, useMemo } from 'react';
import { LIFE_AREAS, RATING_EMOJIS, RATING_LABELS } from '../constants';
import type { LifeArea } from '../constants';
import type { LifeAreaRating } from '../types';
import { 
  ChevronDownIcon, 
  HeartIcon, 
  BrainIcon, 
  BriefcaseIcon, 
  WalletIcon, 
  UsersIcon, 
  SproutIcon, 
  PaletteIcon, 
  HomeIconLifeArea 
} from '../components/Icons';

const ICON_MAP: Record<LifeArea, React.FC<{className?: string}>> = {
  "Physical Health": HeartIcon,
  "Mental Health": BrainIcon,
  "Work & Career": BriefcaseIcon,
  "Finances": WalletIcon,
  "Relationships & Social": UsersIcon,
  "Personal Growth": SproutIcon,
  "Hobbies & Recreation": PaletteIcon,
  "Environment & Home": HomeIconLifeArea,
};

const LIFE_AREA_PLACEHOLDERS: Record<LifeArea, { working: string, challenges: string, better: string }> = {
  "Physical Health": {
    working: "e.g., I enjoy my daily walks or I'm sleeping 7 hours.",
    challenges: "e.g., I'm too tired after work to exercise.",
    better: "e.g., Having consistent energy throughout the day."
  },
  "Mental Health": {
    working: "e.g., I use my meditation app twice a week.",
    challenges: "e.g., Getting overwhelmed by large crowds or loud noises.",
    better: "e.g., Feeling calm even when my schedule changes."
  },
  "Work & Career": {
    working: "e.g., I really like the people on my immediate team.",
    challenges: "e.g., Struggling to stay focused during long meetings.",
    better: "e.g., Having a clear list of priorities every morning."
  },
  "Finances": {
    working: "e.g., I have an automatic savings transfer set up.",
    challenges: "e.g., Impulse spending when I'm stressed or tired.",
    better: "e.g., Knowing exactly where my money is going each month."
  },
  "Relationships & Social": {
    working: "e.g., Weekly game nights with my best friend.",
    challenges: "e.g., Forgetting to reply to texts or feeling socially drained.",
    better: "e.g., Having 1-2 deep, meaningful connections."
  },
  "Personal Growth": {
    working: "e.g., I've been reading 10 pages of my book every night.",
    challenges: "e.g., Starting new hobbies but never finishing them.",
    better: "e.g., Building a consistent habit that I actually enjoy."
  },
  "Hobbies & Recreation": {
    working: "e.g., Playing guitar for 15 minutes on the weekends.",
    challenges: "e.g., Not having enough dedicated space for my art supplies.",
    better: "e.g., Scheduling 'unstructured' time to follow my interests."
  },
  "Environment & Home": {
    working: "e.g., My desk is organized and I feel productive there.",
    challenges: "e.g., Clutter in the hallway makes me feel anxious.",
    better: "e.g., A home that feels like a sensory sanctuary."
  }
};

interface LifeAreaCardProps {
  area: LifeArea;
  rating: number | null;
  onUpdate: (field: keyof LifeAreaRating, value: any) => void;
  isExpanded: boolean;
  onToggle: () => void;
}

const LifeAreaCard: React.FC<LifeAreaCardProps> = ({ area, rating, onUpdate, isExpanded, onToggle }) => {
  const AreaIcon = ICON_MAP[area];
  const placeholders = LIFE_AREA_PLACEHOLDERS[area];

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm transition-all duration-300">
      <button
        className="w-full flex items-center justify-between p-4 text-left"
        onClick={onToggle}
      >
        <div className="flex items-center">
           <div className={`mr-3 p-2 rounded-lg transition-colors ${rating ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400'}`}>
              {AreaIcon && <AreaIcon className="w-6 h-6" />}
           </div>
           <span className="font-semibold text-slate-800">{area}</span>
        </div>
        <div className="flex items-center">
          {rating && <span className="text-sm font-medium text-indigo-600 mr-3">{RATING_LABELS[rating]}</span>}
          <ChevronDownIcon className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
        </div>
      </button>
      {isExpanded && (
        <div className="p-4 border-t border-slate-200">
          <label className="block text-sm font-medium text-slate-700 mb-2">How satisfied are you with this area?</label>
          <div className="flex justify-between items-center mb-6">
            {Object.entries(RATING_EMOJIS).map(([value, emoji]) => (
              <button
                key={value}
                onClick={() => onUpdate('rating', parseInt(value, 10))}
                className={`flex flex-col items-center p-2 rounded-lg transition-all ${rating === parseInt(value, 10) ? 'bg-indigo-100 scale-110' : 'hover:bg-slate-100'}`}
                aria-label={`${RATING_LABELS[parseInt(value,10)]}`}
              >
                <span className="text-3xl">{emoji}</span>
                <span className="text-xs text-slate-500 mt-1">{RATING_LABELS[parseInt(value,10)]}</span>
              </button>
            ))}
          </div>
          
          <div className="space-y-4">
            <div>
              <label htmlFor={`working-${area}`} className="block text-sm font-medium text-slate-700">What's working in this area?</label>
              <textarea
                id={`working-${area}`}
                rows={2}
                className="mt-1 block w-full rounded-md border-2 border-slate-300 bg-white shadow-none focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm placeholder-slate-600 p-5"
                placeholder={placeholders.working}
                onChange={(e) => onUpdate('whatsWorking', e.target.value)}
              />
            </div>
            <div>
              <label htmlFor={`challenges-${area}`} className="block text-sm font-medium text-slate-700">What's challenging or frustrating?</label>
              <textarea
                id={`challenges-${area}`}
                rows={2}
                className="mt-1 block w-full rounded-md border-2 border-slate-300 bg-white shadow-none focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm placeholder-slate-600 p-5"
                placeholder={placeholders.challenges}
                onChange={(e) => onUpdate('challenges', e.target.value)}
              />
            </div>
            <div>
              <label htmlFor={`better-${area}`} className="block text-sm font-medium text-slate-700">What would 'better' look like?</label>
              <textarea
                id={`better-${area}`}
                rows={2}
                className="mt-1 block w-full rounded-md border-2 border-slate-300 bg-white shadow-none focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm placeholder-slate-600 p-5"
                placeholder={placeholders.better}
                onChange={(e) => onUpdate('betterLooksLike', e.target.value)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface OnboardingPageProps {
  onComplete: (ratings: LifeAreaRating[]) => void;
}

const OnboardingPage: React.FC<OnboardingPageProps> = ({ onComplete }) => {
  const [ratings, setRatings] = useState<Record<string, Partial<LifeAreaRating>>>({});
  const [expandedArea, setExpandedArea] = useState<LifeArea | null>(LIFE_AREAS[0] as LifeArea);

  const handleUpdate = (area: string, field: keyof LifeAreaRating, value: any) => {
    setRatings(prev => ({
      ...prev,
      [area]: { ...prev[area], [field]: value, lifeArea: area }
    }));
  };
  
  const handleToggle = (area: LifeArea) => {
    setExpandedArea(prev => prev === area ? null : area);
  };
  
  const ratedAreasCount = useMemo(() => {
      return Object.values(ratings).filter((r: any) => r.rating).length;
  }, [ratings]);

  const canSubmit = ratedAreasCount >= 3;

  const handleSubmit = () => {
    const finalRatings = Object.values(ratings).filter((r: any) => r.rating).map((r: any) => ({
      lifeArea: r.lifeArea!,
      rating: r.rating!,
      whatsWorking: r.whatsWorking || '',
      challenges: r.challenges || '',
      betterLooksLike: r.betterLooksLike || '',
      additionalNotes: r.additionalNotes || ''
    }));
    onComplete(finalRatings);
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Life Area Check-in</h2>
        <p className="mt-2 text-lg text-slate-600">Let's get a snapshot of your life right now. Rate your satisfaction in at least 3 areas to get personalized goal suggestions.</p>
      </div>

      <div className="space-y-4">
        {LIFE_AREAS.map(area => (
          <LifeAreaCard
            key={area}
            area={area as LifeArea}
            rating={ratings[area]?.rating || null}
            onUpdate={(field, value) => handleUpdate(area, field, value)}
            isExpanded={expandedArea === area}
            onToggle={() => handleToggle(area as LifeArea)}
          />
        ))}
      </div>

      <div className="sticky bottom-0 bg-slate-50 py-4 border-t border-slate-200">
          <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-600">
                {ratedAreasCount} of {LIFE_AREAS.length} areas rated.
              </p>
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-slate-400 disabled:cursor-not-allowed"
              >
                {canSubmit ? "Get My Goal Suggestions" : "Rate at least 3 areas"}
              </button>
          </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
