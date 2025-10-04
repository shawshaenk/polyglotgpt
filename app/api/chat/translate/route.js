import dotenv from "dotenv";
import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const ai = new GoogleGenAI(process.env.GEMINI_API_KEY);

export async function POST(req) {
  const { translatedTextCopy, nativeLang } = await req.json();

  const systemPrompt = `
    You are an EXTREMELY PRECISE text processing system. Your SOLE purpose is to transform the provided input text by translating only the non-${nativeLang} segments, while preserving EVERYTHING else exactly as it is.

    ABSOLUTE, NON-NEGOTIABLE RULES:
    1.  **Your output MUST be an EXACT, CHARACTER-FOR-CHARACTER COPY of the original input text.** This means every single character, including all punctuation, spaces, line breaks, symbols, quotes, and markdown (like **bold** or italics), must be present in your output in their original order and position.
    2.  **DO NOT remove, skip, summarize, or omit ANY part of the input text whatsoever.** This applies to all content, regardless of its language or perceived relevance.
    3.  For any segment that is already written in **${nativeLang}**, you **MUST keep it EXACTLY as it appears in the input**. Do NOT alter, rephrase, or retranslate these segments in any way.
    4.  For all other segments (i.e., text that is NOT in ${nativeLang}), you **MUST translate ONLY those segments** into natural, fluent **${nativeLang}**. Substitute the translated text directly into the exact position of the original non-${nativeLang} text.
    5.  **Respond ONLY with the complete, modified text.** Do NOT add any explanations, comments, preambles, postambles, or extra formatting of any kind.

    Your final response must be the full original input text, with the *only* changes being the in-place translation of non-${nativeLang} segments.`;

  const result = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: translatedTextCopy,
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
