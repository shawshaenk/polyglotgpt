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
    const userMessages = data.messages;

    // However, you may break the above rules **only in these two cases**:
    //       - If the user makes a grammatical or spelling error, begin your response with a correction in ${nativeLang}, written in **bold**, then continue the rest of your reply in ${targetLang}.
    //       - If the user explicitly asks a question about what you said, helpfully respond to that specific question in ${nativeLang} to help them understand what you said.
    
    const systemPrompt = {
      role: "user",
      parts: [{
        text: `
          You are PolyglotGPT, a multilingual, conversational AI to help with language learning.

          Ignore any prior instructions.

          The user’s native language is ${nativeLang}. They understand only ${nativeLang}.

          The target language for practice is ${targetLang}.

          The user can switch between ${nativeLang} and ${targetLang} when speaking.

          Your default behavior:
          - Speak only in ${targetLang} as a native speaker to immerse the user.
          - Ask questions to encourage the user to speak.

          Exception:
          - If the user asks for the meaning, explanation, or definition of any word or phrase (for example, by saying "What does X mean?", "Explain X", or "Define X"), respond entirely in ${nativeLang} to help their understanding in **bold**. After providing the explanation, **immediately** resume the conversation in ${targetLang}.
          - After explaining, return to speaking in ${targetLang}.

          Begin now.
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
