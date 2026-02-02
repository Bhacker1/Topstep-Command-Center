import { GoogleGenAI, Type } from "@google/genai";
import { JournalEntry, AIAnalysisResult } from "../types";
import { INITIAL_BALANCE, PROFIT_GOAL } from "../constants";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

export const generateCoachAnalysis = async (
  entries: JournalEntry[],
  currentStats: any
): Promise<AIAnalysisResult> => {
  const client = getClient();
  if (!client) {
    throw new Error("API Key not configured");
  }

  const systemInstruction = `
    You are a professional Trading Performance Analyst and Money Coach for a $50,000 Topstep funded account. 
    Your goal is to help the user reach $20,000 profit ($${PROFIT_GOAL}) safely.
    
    Tone: Calm, professional fintech analysis mixed with a specific "Hesh Vibe" requested by the user (Chill, confident, honest).
    
    The user provides their trading journal. You must analyze the data and return a JSON object.
    
    Rules:
    1. Be numbers-driven.
    2. If performance is bad, be brutally honest but constructive.
    3. If performance is good, be hyped but grounded.
    4. "Mustang Progress" is a metaphor for their journey to the goal (e.g., "In the garage", "Cruising", "Redlining").
  `;

  const prompt = `
    Current Account Stats:
    - Balance: $${currentStats.currentBalance}
    - Cumulative P/L: $${currentStats.cumulativePnL}
    - Progress to Goal: ${currentStats.profitGoalProgress.toFixed(1)}%
    - Recent Win Rate: ${currentStats.winRate.toFixed(1)}%
    
    Recent Entries (Last 10):
    ${JSON.stringify(entries.slice(-10))}

    Generate a JSON response with the following fields:
    - vibeReport: Object containing 'stokeMeter' (emoji + text), 'mustangProgress' (text), 'momentumRating' (1-10), 'hypeLine' (short sentence), 'realityCheck' (short sentence).
    - coachInsights: A paragraph analyzing patterns, risk, and timeline.
    - nextFocus: 3-5 words on what to focus on tomorrow.
  `;

  try {
    const response = await client.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                vibeReport: {
                    type: Type.OBJECT,
                    properties: {
                        stokeMeter: { type: Type.STRING },
                        mustangProgress: { type: Type.STRING },
                        momentumRating: { type: Type.STRING },
                        hypeLine: { type: Type.STRING },
                        realityCheck: { type: Type.STRING },
                    }
                },
                coachInsights: { type: Type.STRING },
                nextFocus: { type: Type.STRING }
            }
        }
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as AIAnalysisResult;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};
