
import { GoogleGenAI, Type } from "@google/genai";
import type { 
    LifeAreaRating, 
    GoalSuggestion, 
    Milestone, 
    GoalBreakdown, 
    Task, 
    ActiveGoal, 
    AILogEntry,
    WeekStructure,
    UserProfile
} from '../types';
import { dbService } from './dbService';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const activationReducerSchema = {
    type: Type.OBJECT,
    properties: {
        label: { type: Type.STRING },
        description: { type: Type.STRING }
    },
    required: ["label", "description"]
};

const resourceSchema = {
    type: Type.OBJECT,
    properties: {
        type: { type: Type.STRING, enum: ["link", "app", "template"] },
        label: { type: Type.STRING },
        url: { type: Type.STRING },
        content: { type: Type.STRING }
    },
    required: ["type", "label"]
};

const goalBreakdownSchema = {
  type: Type.OBJECT,
  properties: {
    milestones: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          durationWeeks: { type: Type.NUMBER },
          whyThisMilestone: { type: Type.STRING },
          completionCriteria: { type: Type.STRING },
          order: { type: Type.INTEGER },
          tasks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                description: { type: Type.STRING },
                detailedSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
                estimatedTime: { type: Type.STRING },
                whenToDo: { type: Type.STRING },
                whatYouNeed: { type: Type.ARRAY, items: { type: Type.STRING } },
                successLooksLike: { type: Type.STRING },
                commonObstacles: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      obstacle: { type: Type.STRING },
                      solution: { type: Type.STRING },
                    },
                    required: ["obstacle", "solution"],
                  },
                },
                nextStepConnection: { type: Type.STRING },
                order: { type: Type.INTEGER },
                // New energy-aware metadata
                energy_required: { type: Type.STRING, enum: ["low", "medium", "high"] },
                best_time_of_day: { type: Type.STRING, enum: ["morning", "midday", "evening", "anytime"] },
                cognitive_load: { type: Type.STRING, enum: ["focus-required", "autopilot-ok"] },
                environment: { type: Type.STRING, enum: ["anywhere", "home-only", "quiet-needed", "computer-needed"] },
                activation_reducers: { type: Type.ARRAY, items: activationReducerSchema },
                resources: { type: Type.ARRAY, items: resourceSchema },
                tiny_version: { type: Type.STRING }
              },
              required: [
                "description", "detailedSteps", "estimatedTime", "whenToDo", "whatYouNeed", 
                "successLooksLike", "commonObstacles", "nextStepConnection", "order",
                "energy_required", "best_time_of_day", "cognitive_load", "environment",
                "activation_reducers", "resources", "tiny_version"
              ],
            },
          },
        },
        required: ["title", "durationWeeks", "whyThisMilestone", "completionCriteria", "order", "tasks"],
      },
    },
    overallApproach: { type: Type.STRING },
    flexibilityNote: { type: Type.STRING },
  },
  required: ["milestones", "overallApproach", "flexibilityNote"],
};

const weekAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        natural_pockets: { type: Type.ARRAY, items: { type: Type.STRING } },
        rationale: { type: Type.STRING }
    },
    required: ["natural_pockets", "rationale"]
};

const logToDatabase = async (model: string, operation: string, input: any, response: any, duration: number) => {
  const log: AILogEntry = {
    timestamp: new Date().toISOString(),
    model,
    operation,
    input,
    output: response.text ? JSON.parse(JSON.stringify(response.text)) : 'Binary/Image Content',
    durationMs: duration,
    usageMetadata: response.usageMetadata ? {
        promptTokenCount: response.usageMetadata.promptTokenCount,
        candidatesTokenCount: response.usageMetadata.candidatesTokenCount,
        totalTokenCount: response.usageMetadata.totalTokenCount,
    } : undefined
  };
  await dbService.addLog(log);
};

export const analyzeWeekStructure = async (structure: WeekStructure): Promise<{ natural_pockets: string[], rationale: string }> => {
    const model = "gemini-3-flash-preview";
    const prompt = `Analyze this person's weekly structure and identify 3-4 distinct 'natural pockets' where they could realistically fit small tasks (15-45 mins).
    Structure: ${JSON.stringify(structure)}
    Return JSON. Pockets should be specific (e.g., 'Post-coffee morning focus', 'Late evening wind-down').`;

    const start = performance.now();
    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: { responseMimeType: "application/json", responseSchema: weekAnalysisSchema },
    });
    const duration = performance.now() - start;
    await logToDatabase(model, 'analyzeWeekStructure', prompt, response, duration);
    return JSON.parse(response.text);
};

export const generateGoalSuggestions = async (userRatings: LifeAreaRating[]): Promise<{ goals: GoalSuggestion[], contextualNote: string }> => {
    const model = "gemini-3-pro-preview";
    const prompt = `You are an expert goal advisor specializing in neurodivergent-friendly planning. 
    ${userRatings.map(r => `${r.lifeArea}: ${r.rating}/5. Challenges: ${r.challenges}`).join('\n')}
    Generate 5-7 personalized goal suggestions. Return JSON according to schema.`;

    const start = performance.now();
    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: {
                type: Type.OBJECT,
                properties: {
                    goals: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                title: { type: Type.STRING },
                                rationale: { type: Type.STRING },
                                lifeAreasImpacted: { type: Type.ARRAY, items: { type: Type.STRING } },
                                timeframeWeeks: { type: Type.INTEGER },
                                difficulty: { type: Type.STRING, enum: ["Gentle start", "Moderate effort", "Ambitious"] },
                                successIndicators: { type: Type.ARRAY, items: { type: Type.STRING } },
                            },
                            required: ["title", "rationale", "lifeAreasImpacted", "timeframeWeeks", "difficulty", "successIndicators"]
                        },
                    },
                    contextualNote: { type: Type.STRING },
                },
                required: ["goals", "contextualNote"],
            } },
        });
        const duration = performance.now() - start;
        await logToDatabase(model, 'generateGoalSuggestions', prompt, response, duration);
        return JSON.parse(response.text);
    } catch (error) {
        throw new Error("Failed to get goal suggestions.");
    }
};

export const generateDetailedBreakdown = async (goal: GoalSuggestion, userContext: LifeAreaRating[], userProfile?: UserProfile): Promise<GoalBreakdown> => {
    const model = "gemini-3-pro-preview";
    const prompt = `Break down this goal into EXTREMELY DETAILED steps for a neurodivergent user: "${goal.title}". 
    Timeframe: ${goal.timeframeWeeks} weeks. 
    User Energy/Context: ${JSON.stringify(userContext)}.
    Natural Pockets Available: ${userProfile?.natural_pockets.join(', ')}.
    
    For each task, specify:
    1. energy_required (low/medium/high)
    2. best_time_of_day
    3. cognitive_load (focus-required/autopilot-ok)
    4. environment
    5. activation_reducers: 2-3 specific ways to make starting easier (e.g. "Open specific tab", "Put on noise cancelling headphones")
    6. resources: links or templates if applicable
    7. tiny_version: a <2 min version of the task
    
    Return JSON adhering to schema. Include random IDs for milestones and tasks.`;
    
    const start = performance.now();
    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: { responseMimeType: "application/json", responseSchema: goalBreakdownSchema },
    });
    const duration = performance.now() - start;
    await logToDatabase(model, 'generateDetailedBreakdown', prompt, response, duration);
    
    const res = JSON.parse(response.text);
    res.milestones.forEach((m: any) => {
        m.id = m.id || Math.random().toString(36).substr(2, 9);
        m.tasks.forEach((t: any) => {
            t.id = t.id || Math.random().toString(36).substr(2, 9);
        });
    });
    return res;
};

export const adjustBreakdownTimeframe = async (breakdown: GoalBreakdown, newWeeks: number): Promise<GoalBreakdown> => {
    const model = "gemini-3-pro-preview";
    const prompt = `Adjust the following goal breakdown for a new timeframe of ${newWeeks} weeks. Original breakdown: ${JSON.stringify(breakdown)}. Recalculate durationWeeks. Keep all tasks, IDs, and metadata exactly the same.`;
    const start = performance.now();
    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: { responseMimeType: "application/json", responseSchema: goalBreakdownSchema },
    });
    const duration = performance.now() - start;
    await logToDatabase(model, 'adjustBreakdownTimeframe', prompt, response, duration);
    return JSON.parse(response.text);
};

export const getTaskHelp = async (goal: ActiveGoal, task: Task, userMessage?: string): Promise<any> => {
    const model = "gemini-3-pro-preview";
    const prompt = `User is struggling with this task: "${task.description}" from goal "${goal.title}". User says: "${userMessage || 'I feel overwhelmed.'}". Provide simpler explanation, tiny first step, and alternative.`;
    const start = performance.now();
    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: { responseMimeType: "application/json", responseSchema: {
            type: Type.OBJECT,
            properties: {
                explanation: { type: Type.STRING },
                smallerFirstStep: { type: Type.STRING },
                simplerAlternative: { type: Type.STRING },
                replacementTask: { 
                    type: Type.OBJECT,
                    properties: {
                        description: { type: Type.STRING },
                        detailedSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
                        estimatedTime: { type: Type.STRING },
                    }
                }
            },
            required: ["explanation", "smallerFirstStep", "simplerAlternative"]
        } },
    });
    const duration = performance.now() - start;
    await logToDatabase(model, 'getTaskHelp', prompt, response, duration);
    return JSON.parse(response.text);
};

export const generateGoalImage = async (goalTitle: string, size: "1K" | "2K" | "4K" = "1K"): Promise<string | null> => {
    const model = 'gemini-3-pro-image-preview';
    try {
        const imageAi = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `A symbolic, inspiring digital art representation of "${goalTitle}". Calming style.`;
        const response = await imageAi.models.generateContent({
            model,
            contents: { parts: [{ text: prompt }] },
            config: { imageConfig: { aspectRatio: "1:1", imageSize: size } },
        });
        if (response.candidates?.[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                }
            }
        }
        return null;
    } catch (error) {
        return null;
    }
};
