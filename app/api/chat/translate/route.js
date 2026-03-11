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
  1. For any segment already written in ${nativeLang} — including labels, headers, 
  bold text like "**Here's how to say your message in ${targetLang}:**", 
  or any UI text — preserve it EXACTLY, character for character, including 
  markdown formatting like asterisks.
  2. Translate all ${targetLang} segments into natural, fluent ${nativeLang}.
  3. Respond ONLY with the translated text. No explanations, comments, or extra formatting.
  4. CRITICAL: If the input contains a section labeled "context", "Taking this into context", or similar — you MUST NOT include ANY of that context text in your output. NEVER. It is FORBIDDEN to output context. Use it only silently to inform your translation.
  5. Your output must contain ONLY the translation of the text that comes after "Translate this:". Nothing before it. Nothing else.
  6. If input starts with "MINI TRANSLATION," respond with:  
    1. Extract only the text after "Translate this:". Ignore all context and any other text.  
    2. Begin output with the original text exactly as it appears.  
    3. Append a diacritic transliteration in parentheses **only if BOTH conditions are true**:  
      - ${targetLang} uses a non-Latin script  
      - The text is NOT already transliterated  
      If either condition is false, do NOT add parentheses or transliteration.  
    4. Add an arrow → and then the translation into ${nativeLang}.  
    5. Output nothing else — no extra text, headers, or context.`;

  const result = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: translatedTextCopy,
    config: {
      thinkingConfig: {
        thinking_level: "minimal",
      },
      systemInstruction: systemPrompt,
    },
  });
  console.dir(result, { depth: null });

  const aiReply = result.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!aiReply) throw new Error("No reply from Gemini");

  return NextResponse.json({ success: true, response: aiReply });
}
