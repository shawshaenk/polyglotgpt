import dotenv from "dotenv";
import { NextResponse } from 'next/server';
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const ai = new GoogleGenAI(process.env.GEMINI_API_KEY);

export async function POST(req) {
    const { romanizedTextCopy } = await req.json();

    const systemPrompt = `
    You are a highly precise text processing system. Your SOLE task is to perform a **character-by-character Latin transliteration of ONLY the non-Latin characters** within the provided input, while accurately marking phonetic properties with diacritics.

    ### ABSOLUTE, NON-NEGOTIABLE RULES:

    1. **Output MUST be an EXACT, COMPLETE copy of the input text.**  
      Every single character—including all Latin characters, punctuation, spaces, line breaks, symbols, quotes, and markdown (like **bold** or *italics*)—must appear in the output in their original order and position.

    2. The **ONLY** modification allowed is the replacement of each individual non-Latin character with its **standard Latin script equivalent**, **augmented with diacritics to preserve full phonetic details**.

    3. **When transliterating, you MUST include diacritical marks to reflect correct pronunciation**, such as:  
      - Macrons (ā, ī, ū, ē, ō) for long vowels  
      - Dots below (ṭ, ḍ, ṇ, ṣ, ḷ) for retroflex consonants  
      - Nasalization marks (ṃ, ṁ) where applicable  
      - Any other diacritics required by **ISO 15919** (for Indic scripts) or other language-appropriate standards.  
      Do not strip, simplify, or omit these diacritics.

    4. You **MUST NOT** remove, skip, shorten, summarize, or omit ANY part of the input, regardless of its script.

    5. You **MUST NOT** translate, interpret, explain, or add any commentary or additional text.  
      The meaning of the input is completely irrelevant to this task.

    6. Maintain all existing formatting (e.g., bolding, line breaks, spacing) exactly as it appears in the input.

    7. Existing Latin characters and existing transliterations (if any) must remain untouched.  
      Only perform transliteration on characters that are *currently* non-Latin.

    8. When in doubt, follow the **ISO 15919** transliteration standard (or equivalent standard for the input language) to ensure diacritics correctly represent the original sounds.`

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