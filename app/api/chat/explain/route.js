import dotenv from "dotenv";
import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const ai = new GoogleGenAI(process.env.GEMINI_API_KEY);

export async function POST(req) {
  const { explanationTextCopy, nativeLang, targetLang } = await req.json();

  const systemPrompt = `
    You are an EXTREMELY PRECISE text processing system. Your SOLE purpose is to explain the provided input text that's in ${targetLang} in ${nativeLang}

    Your response should be in this format:
    **[Exact given ${targetLang} text] ([transliteration WITH DIACRITICS if ${targetLang} is not in Latin alphabet]) → [${nativeLang} translation]**

    **Word-by-word breakdown:**
    - [Word 1 in targetLang script] ([transliteration if targetLang doesn't use Latin script]) → [meaning in nativeLang]
    - [Word 2 in targetLang script] ([transliteration if targetLang doesn't use Latin script]) → [meaning in nativeLang]
    [Continue for all words]

    [Brief grammar/usage/cultural explanation in nativeLang, max 3 sentences]`;

  const result = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: explanationTextCopy,
    config: {
      thinkingConfig: {
        thinking_level: "low",
      },
      systemInstruction: systemPrompt,
    },
  });
  console.dir(result, { depth: null });

  const aiReply = result.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!aiReply) throw new Error("No reply from Gemini");

  return NextResponse.json({ success: true, response: aiReply });
}
