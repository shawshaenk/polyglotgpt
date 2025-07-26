import dotenv from "dotenv";
import { NextResponse } from 'next/server';
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const ai = new GoogleGenAI(process.env.GEMINI_API_KEY);

export async function POST(req) {
    const { romanizedTextCopy } = await req.json();

    const result = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: `Transliterate the following text into the Latin script: "${romanizedTextCopy}".
                    - If the entire text is already in the Latin script, return it unchanged.
                    - If the text contains a mix of Latin and non-Latin characters, replace only the non-Latin characters with their Latin script equivalents in-place, preserving the original sentence structure.
                    - Do not modify or remove existing Latin characters, including punctuation, casing, or diacritics.
                    Respond with the fully transliterated version only — no extra output, no formatting, and no explanation.
                    `,
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