import dotenv from "dotenv";
import { NextResponse } from 'next/server';
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const ai = new GoogleGenAI(process.env.GEMINI_API_KEY);

export async function POST(req) {
    const { translatedText, nativeLang } = await req.json();

    const result = await ai.models.generateContent({
          model: "gemini-2.5-flash-lite-preview-06-17",
          contents: `Translate this to ${nativeLang}: ${translatedText}. Only give the translation, nothing else.`,
          config: {
            thinkingConfig: {
              thinkingBudget: 0,
            },
          }
        });
    console.dir(result, { depth: null });

    const aiReply = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!aiReply) throw new Error("No reply from Gemini");

    return NextResponse.json({ success: true, response: aiReply });
}