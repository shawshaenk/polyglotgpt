import dotenv from "dotenv";
import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const ai = new GoogleGenAI(process.env.GEMINI_API_KEY);

export async function POST(req) {
  const { translatedTextCopy, nativeLang, targetLang } = await req.json();

  const systemPrompt = `
  You are an EXTREMELY PRECISE text processing system. Your SOLE purpose is to translate the provided text from ${targetLang} to ${nativeLang}.

  ABSOLUTE, NON-NEGOTIABLE RULES:
  1. For any segment that is already written in ${nativeLang}, keep it EXACTLY as it appears. Do NOT alter it.
  2. Translate all ${targetLang} segments into natural, fluent ${nativeLang}.
  3. Respond ONLY with the translated text. No explanations, comments, or extra formatting.
  4. CRITICAL: If the input contains a section labeled "context", "Taking this into context", or similar — you MUST NOT include ANY of that context text in your output. NEVER. It is FORBIDDEN to output context. Use it only silently to inform your translation.
  5. Your output must contain ONLY the translation of the text that comes after "Translate this:". Nothing before it. Nothing else.`;

  const result = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: translatedTextCopy,
    config: {
      temperature: 0.1,
      thinkingConfig: {
        thinkingBudget: 50,
      },
      systemInstruction: systemPrompt,
    },
  });
  console.dir(result, { depth: null });

  const aiReply = result.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!aiReply) throw new Error("No reply from Gemini");

  return NextResponse.json({ success: true, response: aiReply });
}
