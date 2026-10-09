import dotenv from "dotenv";
import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const ai = new GoogleGenAI(process.env.GEMINI_API_KEY);

export async function POST(req) {
  const { messages, nativeLang, targetLang } = await req.json();

  const transcript = (messages || [])
    .filter((m) => m?.content && m.content.trim().length > 0)
    .map((m) => `${m.role === "model" ? "AI partner" : "Learner"}: ${m.content}`)
    .join("\n");

  const systemPrompt = `
    You are helping a learner practice writing in ${targetLang}. You will be shown the conversation so far between the learner ("Learner" turns) and their AI conversation partner ("AI partner" turns).

    ## Your job
    Write exactly ONE message that the LEARNER could send next, entirely in ${targetLang}, to naturally continue the conversation.

    ## Rules
    - Write ONLY in ${targetLang}. Never switch to ${nativeLang}.
    - Maximum 20 words. Keep it concise and natural.
    - Respond to whatever the AI partner said last, or naturally move the conversation forward — don't ignore the context.
    - Do NOT repeat, restate, or translate the AI partner's last message.
    - Do NOT include quotation marks, labels ("Learner:", "You:", etc.), or any commentary — output ONLY the message text itself.
    - Sound like a real person practicing the language, not a textbook sentence or a lesson exercise.
    - If the conversation has no prior messages, write a natural opening line in ${targetLang} instead.

    ## Output Format
    Return only the message. No labels, no JSON, no explanation.`;

  const result = await ai.models.generateContent({
    model: "gemini-3.5-flash-lite",
    contents: transcript
      ? `Conversation so far:\n${transcript}\n\nWrite the learner's next message now.`
      : `nativeLang: ${nativeLang}, targetLang: ${targetLang}`,
    config: {
      thinkingConfig: {
        thinking_level: "low",
      },
      systemInstruction: systemPrompt,
      temperature: 1.0,
    },
  });
  console.dir(result, { depth: null });

  const aiReply = result.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!aiReply) throw new Error("No reply from Gemini");

  return NextResponse.json({ success: true, response: aiReply });
}
