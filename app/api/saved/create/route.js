import dotenv from "dotenv";
import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { getAuth } from "@clerk/nextjs/server";
import connectDB from "@/config/db";
import SavedItem from "@/models/savedItem";

dotenv.config();

const ai = new GoogleGenAI(process.env.GEMINI_API_KEY);

export async function POST(req) {
  try {
    const { text, nativeLang, targetLang, overview: providedOverview } = await req.json();

    if (!text || !text.trim()) {
      return NextResponse.json({
        success: false,
        message: "No text provided to save",
      });
    }

    const trimmedText = text.trim();
    const type = trimmedText.split(/\s+/).length === 1 ? "word" : "phrase";

    let overview = providedOverview;

    if (!overview) {
      const systemPrompt = `
      You are an EXTREMELY PRECISE text processing system. Your SOLE purpose is to explain the provided input text that's in ${targetLang} in ${nativeLang}

      Your response should be in this format:
      **[Exact given ${targetLang} text] ([transliteration WITH DIACRITICS if ${targetLang} is not in Latin alphabet]) → [${nativeLang} translation]**

      **Word-by-word breakdown:**
      - [Word 1 in targetLang script] ([transliteration if targetLang doesn't use Latin script]) → [meaning in nativeLang]
      - [Word 2 in targetLang script] ([transliteration if targetLang doesn't use Latin script]) → [meaning in nativeLang]
      [Continue for all words. If the input is a single word, omit this section entirely.]

      [Brief grammar/usage/cultural explanation in nativeLang, max 3 sentences]`;

      const result = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: trimmedText,
        config: {
          thinkingConfig: {
            thinking_level: "low",
          },
          systemInstruction: systemPrompt,
        },
      });

      overview = result.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!overview) throw new Error("No reply from Gemini");
    }

    const { userId } = getAuth(req);

    if (!userId) {
      return NextResponse.json({
        success: true,
        item: {
          _id: `temp-saved-${Date.now()}`,
          text: trimmedText,
          type,
          overview,
          nativeLang,
          targetLang,
          isLocal: true,
        },
      });
    }

    await connectDB();
    const item = await SavedItem.create({
      userId,
      text: trimmedText,
      type,
      overview,
      nativeLang,
      targetLang,
    });

    return NextResponse.json({ success: true, item });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message });
  }
}
