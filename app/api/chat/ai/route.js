export const maxDuration = 60;
import { GoogleGenAI } from "@google/genai";
import Chat from "@/models/chat";
import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import dotenv from "dotenv";
import connectDB from '@/config/db';

dotenv.config();

const ai = new GoogleGenAI(process.env.GEMINI_API_KEY);

export async function POST(req) {
  await connectDB();

  try {
    const { userId } = getAuth(req);
    const { chatId, prompt, nativeLang, targetLang } = await req.json();

    if (!userId) {
      return NextResponse.json({ success: false, message: "User not Authenticated" });
    }

    const data = await Chat.findOne({ userId, _id: chatId });
    data.messages.push({ role: "user", content: prompt, timestamp: Date.now() });

    // Filter out any previous system prompt
    const userMessages = data.messages.filter(
      msg => !(msg.role === "user" && msg.content.includes("You are PolyglotGPT"))
    );

    // Dynamically generate updated system prompt
    const systemPrompt = {
      role: "user",
      parts: [{
        text: `
          You are PolyglotGPT, a multilingual conversationalist designed for language learning. 
          Ignore any earlier context about the user’s languages. 
          From now on:
          - The user’s native language is ${nativeLang}. Assume they only know that language, not English.
          - The target language (for practice) is ${targetLang}.

          Your task:
          1. Role‑play as a native speaker of ${targetLang}.
          2. Converse entirely in ${targetLang}, asking follow-up questions and encouraging dialogue.
          3. NEVER provide translations of your own messages into ${nativeLang}.

          You should NOT:
          - Use ${nativeLang} at all.
          - Give praise or confirm correctness unless the user makes a mistake or asks for help.

          However, you may break the above rules **only in these two cases**:
          - If the user makes a grammatical or spelling error, begin your response with a brief correction in ${nativeLang}, written in **bold**, then continue the rest of your reply in ${targetLang}.
          - If the user explicitly asks a question about what you said, helpfully respond to that specific question in ${nativeLang} to help them understand what you said.

          Begin the conversation now. Stay natural and engaging.
        `.trim()
      }]
    };

    // Construct message history with updated system prompt at the top
    const formattedMessages = [
      systemPrompt,
      ...userMessages.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }],
      }))
    ];

    //gemini-2.5-flash-lite-preview-06-17
    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite-preview-06-17",
      contents: formattedMessages,
      config: {
        thinkingConfig: {
          thinkingBudget: 0, // Disables thinking
        },
      }
    });
    console.dir(result, { depth: null });

    // <-- extract the text here
    const aiReply = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!aiReply) throw new Error("No reply from Gemini");

    data.messages.push({
      role: "model",
      content: aiReply,
      timestamp: Date.now(),
    });
    await data.save();

    return NextResponse.json({ success: true, response: aiReply });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message });
  }
}
