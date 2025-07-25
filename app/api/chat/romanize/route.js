import dotenv from "dotenv";
import { NextResponse } from 'next/server';
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const ai = new GoogleGenAI(process.env.GEMINI_API_KEY);

export async function POST(req) {
    const { romanizedTextCopy } = await req.json();

    const result = await ai.models.generateContent({
          model: "gemini-2.5-flash-lite-preview-06-17",
          contents: `Romanize the following text: "${romanizedTextCopy}".
                    If the entire text is already in the Latin alphabet, return it unchanged.
                    If the text contains a mix of Latin and non-Latin characters, return the full text with only the non-Latin characters romanized—substitute them in place within the original sentence.
                    Do not alter or remove existing Latin characters.
                    Respond with only the romanized version of the full text—no explanations, no formatting, and no extra output.
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