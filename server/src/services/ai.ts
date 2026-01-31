
import { GoogleGenAI } from '@google/genai';
import { suggestCategory as suggestCategoryLocal } from './auto-categorize';

interface SuggestParams {
    appName: string;
    url?: string;
    context?: string;
    userId: string;
}

export abstract class AIService {
    private static gemini = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

    static async suggestCategory(params: SuggestParams) {
        const { appName, url, context, userId } = params;
        console.log(`[AI] Suggesting for: ${appName} | Gemini: ${!!this.gemini}`);

        const prompt = `Classify the following application/website usage into one of these 4 categories: 'productive', 'distracting', 'neutral', 'uncategorized'.

        App Name: ${appName}
        URL: ${url || 'N/A'}
        Context: ${context || 'N/A'}

        Productive: Work, coding, learning, design, utilities.
        Distracting: Social media, games, mindless entertainment.
        Neutral: System tools, generic browsers (if content unknown), file management.

        Return ONLY the category name in lowercase. NO markdown, NO formatting.`;

        // 1. Try Gemini (New SDK)
        if (this.gemini) {
            // Models to try with new SDK
            const model = 'gemini-3-flash-preview'

            try {
                const response = await this.gemini.models.generateContent({
                    model: model,
                    contents: prompt,
                });

                const text = response.text?.trim().toLowerCase().replace(/[`'"\n]/g, '');
                console.log(`[AI] Gemini (${model}) Response: "${text}"`);

                    if (text && ['productive', 'distracting', 'neutral', 'uncategorized'].includes(text)) {
                        return { success: true, category: text, source: 'gemini', confidence: 0.9 };
                    } else if (text?.includes('productive')) return { success: true, category: 'productive', source: 'gemini', confidence: 0.8 };
                    else if (text?.includes('distracting')) return { success: true, category: 'distracting', source: 'gemini', confidence: 0.8 };
                    else if (text?.includes('neutral')) return { success: true, category: 'neutral', source: 'gemini', confidence: 0.8 };

                    console.warn(`[AI] Gemini (${model}) Invalid: "${text}"`);
                } catch {}
        }

        // 2. Fallback to Local Heuristics
        const result = suggestCategoryLocal(appName, url, userId);
        return {
            success: true,
            category: result.suggestedCategory,
            source: 'local',
            confidence: result.confidence
        };
    }
}
