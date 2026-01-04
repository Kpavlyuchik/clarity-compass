
import { GoogleGenAI, Type } from "@google/genai";
import type { LifeAreaRating, GoalSuggestion, Milestone } from '../types';

if (!process.env.API_KEY) {
    console.warn("API_KEY environment variable not set. Using a placeholder. AI features will not work.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "NO_API_KEY" });

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


export const generateGoalSuggestions = async (userRatings: LifeAreaRating[]): Promise<{ goals: GoalSuggestion[], contextualNote: string }> => {
    const prompt = `You are an expert goal advisor specializing in neurodivergent-friendly planning. You help people who struggle with executive function, planning, and overwhelm.

    USER'S CURRENT LIFE SITUATION:

    ${userRatings.map(r => `
    ${r.lifeArea}: ${r.rating}/5
    What's working: ${r.whatsWorking || 'Not specified'}
    Challenges: ${r.challenges || 'Not specified'}  
    Better would be: ${r.betterLooksLike || 'Not specified'}
    Notes: ${r.additionalNotes || 'None'}
    `).join('\n')}

    YOUR TASK:

    Generate 5-7 personalized goal suggestions that would meaningfully improve this person's life. Focus on areas they rated lowest (1-2), but include 1-2 goals for neutral areas (3) if relevant. For each goal provide: title, rationale, life areas impacted, realistic timeframe in weeks, difficulty assessment, and 3-4 specific, observable success indicators.
    
    CRITICAL GUIDELINES:
    - Start where they are: For low-rated areas, suggest foundational goals.
    - Be specific: Goals must be clear and measurable.
    - Consider neurodivergence: Account for executive dysfunction, sensory sensitivities, and energy variability.
    - No toxic positivity: Be realistic and compassionate.
    - Address root causes.

    Return the response in JSON format that adheres to the provided schema.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-pro-preview",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: goalSuggestionSchema,
            },
        });
        const jsonString = response.text;
        return JSON.parse(jsonString);
    } catch (error) {
        console.error("Error generating goal suggestions:", error);
        throw new Error("Failed to get goal suggestions from AI.");
    }
};


export const generateDetailedBreakdown = async (goal: GoalSuggestion, userContext: LifeAreaRating[]): Promise<{ milestones: Milestone[], overallApproach: string, flexibilityNote: string }> => {
    const prompt = `You are a neurodivergent-friendly goal planning expert. Your specialty is breaking down goals into EXTREMELY DETAILED, step-by-step instructions that leave nothing to guesswork.

    GOAL TO BREAK DOWN:
    "${goal.title}"

    USER'S TIMEFRAME: ${goal.timeframeWeeks} weeks

    USER'S CONTEXT:
    ${JSON.stringify(userContext, null, 2)}

    YOUR TASK:

    Create a comprehensive, detailed breakdown with 4-6 milestones. Each milestone should have 3-6 specific tasks. 

    CRITICAL REQUIREMENTS FOR EACH TASK:
    1.  **description**: A brief, clear title for the task.
    2.  **detailedSteps**: An array of exact, granular action steps. Not "research gyms" but "1. Open Google Maps, 2. search 'gyms near me', 3. make a list of 3 options with their hours and prices".
    3.  **estimatedTime**: Realistic time estimate (e.g., "5 minutes", "30 minutes").
    4.  **whenToDo**: Suggested timing (e.g., "Morning before work", "Weekend when you have energy").
    5.  **whatYouNeed**: A list of materials, apps, or info needed.
    6.  **successLooksLike**: Concrete, observable completion criteria.
    7.  **commonObstacles**: An array of objects, each with a potential "obstacle" and a practical "solution".
    8.  **nextStepConnection**: How this task leads to the next one.
    9.  **order**: The numerical order of the task within the milestone.
    10. **celebrationNote**: An optional encouraging message upon completion.

    MILESTONE STRUCTURE:
    - Each milestone must have a title, duration estimate, rationale (whyThisMilestone), and completion criteria.

    IMPORTANT CONSIDERATIONS:
    - Executive function support: Break tasks into the smallest possible actions.
    - Decision fatigue: Minimize choices within tasks.
    - Time blindness: Always include time estimates.
    - Energy management: Suggest timing based on typical energy patterns.
    - Flexibility: Include alternatives for low-energy days.
    
    Return the response in JSON format that adheres to the provided schema.`;
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-pro-preview",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: goalBreakdownSchema,
            },
        });
        const jsonString = response.text;
        return JSON.parse(jsonString);
    } catch (error) {
        console.error("Error generating detailed breakdown:", error);
        throw new Error("Failed to get a detailed breakdown from AI.");
    }
};
