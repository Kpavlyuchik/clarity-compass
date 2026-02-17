
import { GoogleGenAI, Type } from "@google/genai";
// Added missing ActiveGoal import
import type { LifeAreaRating, GoalSuggestion, Milestone, GoalBreakdown, Task, ActiveGoal } from '../types';

// Correct initialization as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const goalSuggestionSchema = {
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
                celebrationNote: { type: Type.STRING },
                order: { type: Type.INTEGER },
              },
              required: ["description", "detailedSteps", "estimatedTime", "whenToDo", "whatYouNeed", "successLooksLike", "commonObstacles", "nextStepConnection", "order"],
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

const taskHelpSchema = {
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
};

export const generateGoalSuggestions = async (userRatings: LifeAreaRating[]): Promise<{ goals: GoalSuggestion[], contextualNote: string }> => {
    const prompt = `You are an expert goal advisor specializing in neurodivergent-friendly planning. 
    ${userRatings.map(r => `${r.lifeArea}: ${r.rating}/5. Challenges: ${r.challenges}`).join('\n')}
    Generate 5-7 personalized goal suggestions. Return JSON according to schema.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-pro-preview",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: goalSuggestionSchema,
            },
        });
        // Use response.text property directly as per guidelines
        return JSON.parse(response.text);
    } catch (error) {
        console.error("Error generating goal suggestions:", error);
        throw new Error("Failed to get goal suggestions from AI.");
    }
};

export const generateDetailedBreakdown = async (goal: GoalSuggestion, userContext: LifeAreaRating[]): Promise<GoalBreakdown> => {
    const prompt = `Break down this goal into EXTREMELY DETAILED steps for a neurodivergent user: "${goal.title}". Timeframe: ${goal.timeframeWeeks} weeks. Context: ${JSON.stringify(userContext)}.
    Return JSON adhering to schema. Include IDs (random strings) for each milestone and task.`;
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-pro-preview",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: goalBreakdownSchema,
            },
        });
        const res = JSON.parse(response.text);
        // Ensure IDs exist
        res.milestones.forEach((m: any) => {
            m.id = m.id || Math.random().toString(36).substr(2, 9);
            m.tasks.forEach((t: any) => {
                t.id = t.id || Math.random().toString(36).substr(2, 9);
            });
        });
        return res;
    } catch (error) {
        console.error("Error generating detailed breakdown:", error);
        throw new Error("Failed to get a detailed breakdown from AI.");
    }
};

export const adjustBreakdownTimeframe = async (breakdown: GoalBreakdown, newWeeks: number): Promise<GoalBreakdown> => {
    const prompt = `Adjust the following goal breakdown for a new timeframe of ${newWeeks} weeks. 
    Original breakdown: ${JSON.stringify(breakdown)}
    Recalculate the durationWeeks for each milestone proportionally so they sum to ${newWeeks}. 
    Keep all tasks and IDs exactly the same. Return the full JSON.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-pro-preview",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: goalBreakdownSchema,
            },
        });
        return JSON.parse(response.text);
    } catch (error) {
        console.error("Error adjusting timeframe:", error);
        return breakdown; // Fallback to original
    }
};

// Fix for missing ActiveGoal import (already added at top)
export const getTaskHelp = async (goal: ActiveGoal, task: Task, userMessage?: string): Promise<any> => {
    const prompt = `User is struggling with this task: "${task.description}" from goal "${goal.title}".
    User says: "${userMessage || 'I feel overwhelmed by this.'}"
    
    Provide:
    1. A simpler, clearer explanation.
    2. A "tiny" first step that takes less than 2 minutes.
    3. A simpler alternative task.
    
    Return JSON according to taskHelpSchema.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-pro-preview",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: taskHelpSchema,
            },
        });
        return JSON.parse(response.text);
    } catch (error) {
        console.error("Error getting task help:", error);
        throw error;
    }
};

// Updated to follow gemini-3-pro-image-preview guidelines for API key selection
export const generateGoalImage = async (goalTitle: string, size: "1K" | "2K" | "4K" = "1K"): Promise<string | null> => {
    try {
        // Mandatory key selection check for Gemini 3 Pro Image
        if (typeof window !== 'undefined' && (window as any).aistudio) {
            const hasKey = await (window as any).aistudio.hasSelectedApiKey();
            if (!hasKey) {
                await (window as any).aistudio.openSelectKey();
            }
        }

        // Initialize a fresh instance right before making an API call to ensure latest key is used
        const imageAi = new GoogleGenAI({ apiKey: process.env.API_KEY });

        const prompt = `A symbolic, inspiring digital art representation of "${goalTitle}". Calming style.`;
        const response = await imageAi.models.generateContent({
            model: 'gemini-3-pro-image-preview',
            contents: { parts: [{ text: prompt }] },
            config: {
                imageConfig: { aspectRatio: "1:1", imageSize: size }
            },
        });

        // Iterate through candidates and parts to find the image inlineData as per guidelines
        if (response.candidates?.[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                }
            }
        }
        return null;
    } catch (error) {
        console.error("Error generating image:", error);
        // If the request fails with this specific message, prompt for key selection again
        if (error instanceof Error && error.message.includes("Requested entity was not found.")) {
             if (typeof window !== 'undefined' && (window as any).aistudio) {
                 await (window as any).aistudio.openSelectKey();
             }
        }
        return null;
    }
};
