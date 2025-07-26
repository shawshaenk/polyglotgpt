import dotenv from "dotenv";
import { NextResponse } from 'next/server';
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const ai = new GoogleGenAI(process.env.GEMINI_API_KEY);

export async function POST(req) {
    const { translatedTextCopy, nativeLang } = await req.json();

    const systemPrompt = `
    Translate any given text to ${nativeLang}.
    - Leave text already in ${nativeLang} unchanged. You must echo it back in your response.
    - If the input contains multiple languages, translate each non-${nativeLang} part individually.
    - Return the full result with translated content substituted in place.
    - Do not add any formatting, explanation, or commentary.`

    const result = await ai.models.generateContent({
          model: "gemini-2.5-flash-lite",
          contents: translatedTextCopy,
          config: {
            thinkingConfig: {
              thinkingBudget: 0,
            },
            systemInstruction: systemPrompt,
          }
        });
    console.dir(result, { depth: null });

    const aiReply = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!aiReply) throw new Error("No reply from Gemini");

    return NextResponse.json({ success: true, response: aiReply });
}