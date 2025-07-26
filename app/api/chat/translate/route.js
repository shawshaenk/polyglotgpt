import dotenv from "dotenv";
import { NextResponse } from 'next/server';
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const ai = new GoogleGenAI(process.env.GEMINI_API_KEY);

export async function POST(req) {
    const { translatedTextCopy, nativeLang } = await req.json();

    const result = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: `Translate the following text into **${nativeLang}**: "${translatedTextCopy}". DO NOT TRANSLATE TO ENGLISH UNLESS ${nativeLang} IS ENGLISH.
                      Ignore any parts already in ${nativeLang}—only translate the content in a language that's not ${nativeLang}.
                      Respond with the full text, substituting translated parts accordingly, without any additional explanation, formatting, or changes.
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