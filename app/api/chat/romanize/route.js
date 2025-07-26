import dotenv from "dotenv";
import { NextResponse } from 'next/server';
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const ai = new GoogleGenAI(process.env.GEMINI_API_KEY);

export async function POST(req) {
    const { romanizedTextCopy } = await req.json();

    const systemPrompt = `
    You are a highly precise text processing system. Your SOLE task is to perform a character-by-character Latin transliteration of ONLY the non-Latin characters within the provided input.

    ABSOLUTE, NON-NEGOTIABLE RULES:
    1.  **Output MUST be an EXACT, COMPLETE copy of the input text.** This means every single character, including all Latin characters, non-Latin characters, punctuation, spaces, line breaks, symbols, quotes, and markdown (like **bold** or italics), must be present in the output in their original order and position.
    2.  The **ONLY** modification allowed is the replacement of each individual non-Latin character with its standard Latin script equivalent.
    3.  When transliterating, preserve all phonetic details, including accents and diacritics (e.g., á, ü, ñ, ī). Do not strip or simplify them.
    4.  You **MUST NOT** remove, skip, shorten, summarize, or omit ANY part of the input, regardless of its script (Latin or non-Latin).
    5.  You **MUST NOT** translate, interpret, explain, or add any commentary or additional text. The meaning of the input is completely irrelevant to this task.
    6.  Maintain all existing formatting (e.g., bolding, line breaks, spacing) exactly as it appears in the input.
    7.  Existing Latin characters and existing transliterations (if any) must remain untouched. Only perform transliteration on characters that are *currently* non-Latin.

    Your final response must be the full original input text, with the *only* change being that all non-Latin characters have been replaced by their Latin equivalents.`

    const result = await ai.models.generateContent({
          model: "gemini-2.5-flash-lite",
          contents: romanizedTextCopy,
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