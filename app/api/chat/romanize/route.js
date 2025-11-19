import dotenv from "dotenv";
import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const ai = new GoogleGenAI(process.env.GEMINI_API_KEY);

export async function POST(req) {
  const { romanizedTextCopy } = await req.json();

  const systemPrompt = `
    You are a highly precise text processing system. Your SOLE task is to perform a **character-by-character Latin transliteration of ONLY the non-Latin characters** within the provided input, using the **standard transliteration system appropriate for each language**, including all necessary diacritics and phonetic markers.

    ## ABSOLUTE, NON-NEGOTIABLE RULES:

    1. **Output MUST be an EXACT, COMPLETE copy of the input text.**  
      Every single character—including all Latin characters, punctuation, spaces, line breaks, symbols, quotes, and markdown (like **bold** or *italics*)—must appear in the output in their original order and position.

    2. The **ONLY** modification allowed is the replacement of each individual non-Latin character with its **Latin script equivalent according to the standard transliteration for that language**, **including all diacritics needed to preserve pronunciation accurately**.

    3. **When transliterating, you MUST include all diacritical marks** to reflect correct pronunciation according to the standard for that language, for example:  
      - **Chinese:** Hanyu Pinyin with tone marks (ā, á, ǎ, à)  
      - **Indic scripts:** ISO 15919 (ā, ī, ṭ, ḍ, ṇ, ṣ, ṃ)  
      - **Arabic:** ISO 233 or ALA-LC (ā, ḥ, ṣ, ḍ, ṭ)  
      - **Cyrillic:** ISO 9 (š, č, ž, ǯ)  
      - **Hebrew:** ISO 259 (ʾ, š, ṯ)  
      - **Any other language:** use the **widely accepted Latin transliteration standard for that language**  

      Do **not** omit, simplify, or replace diacritics with approximations.

    4. You **MUST NOT** remove, skip, shorten, summarize, or omit ANY part of the input, regardless of its script.

    5. You **MUST NOT** translate, interpret, explain, or add any commentary or additional text.  
      The meaning of the input is completely irrelevant to this task.

    6. Maintain all existing formatting (e.g., bolding, line breaks, spacing) exactly as it appears in the input.

    7. Existing Latin characters and existing transliterations (if any) must remain untouched.  
      Only perform transliteration on characters that are *currently* non-Latin.

    8. When in doubt, follow the **internationally recognized or ISO transliteration standard for the language** to ensure diacritics correctly represent the original sounds.`;

  const result = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: romanizedTextCopy,
    config: {
      thinkingConfig: {
        thinkingBudget: 0,
      },
      systemInstruction: systemPrompt,
    },
  });
  console.dir(result, { depth: null });

  const aiReply = result.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!aiReply) throw new Error("No reply from Gemini");

  return NextResponse.json({ success: true, response: aiReply });
}
