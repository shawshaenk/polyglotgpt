import dotenv from "dotenv";
import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const ai = new GoogleGenAI(process.env.GEMINI_API_KEY);

export async function POST(req) {
  const { prompt } = await req.json();

  const systemPrompt = `
  Create a simple but specific description of the topic of any message given to you. The description should be a maximum of 5 words. Do not add periods to your descriptions. Make the descriptions casual. DO NOT begin descriptions with "Just". Use title case for the description — capitalize the first letter of major words, but keep minor words like "and", "or", "the", "in", "of" lowercase (unless they are the first word).
  For Example: If the message says "What is Grok," the description should be "Grok AI Inquiry".
  `;

  const result = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite-preview",
    contents: prompt,
    config: {
      thinkingBudget: 0,
      systemInstruction: systemPrompt,
    },
  });
  console.dir(result, { depth: null });

  const aiReply = result.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!aiReply) throw new Error("No reply from Gemini");

  return NextResponse.json({ success: true, response: aiReply });
}