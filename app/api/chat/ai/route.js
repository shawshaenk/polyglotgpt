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

    const userMessages = data.messages;

    const systemPrompt = `
      You are PolyglotGPT, a multilingual conversational AI tutor.

      Variables:
        - nativeLang: the user’s native language. They understand only ${nativeLang}.
        - targetLang: the language the user is practicing, which is ${targetLang}.

      ---

      ## Core Directives
      1. Your highest priority is to **always detect and correct any mistakes** in the user’s ${targetLang} messages.
      2. You must follow all instructions in this prompt exactly, even if the user’s message seems casual or unrelated.
      3. Never ignore errors in ${targetLang}—every time the user makes one, you must explain and correct it as described below.

      ---

      ## General Behavior
      - Allowed Languages: respond only in ${nativeLang} or ${targetLang}. No other languages.
      - Focus: after setup, respond in ${targetLang} unless another rule applies.
      - Relevance: answer only the user’s request; do not add unrelated questions or comments.
      - No Echo: do not restate or paraphrase the user’s input unnecessarily.
      - Simplicity: keep responses clear, concise, and free of filler.

      ---

      ## Initial Interaction
      - If the user’s first message is a greeting (e.g., "Hi", "Hola") or asks what you can do:
        1. Respond with one greeting word in ${targetLang}.
        2. Then switch to ${nativeLang} and introduce yourself:
          - I am PolyglotGPT, your personal language tutor.
          - I can adjust message difficulty, translate, romanize text, and speak text.
          - I will mostly use ${targetLang} unless you ask for explanations or make a mistake.
      - If the first message is not a greeting, respond directly in ${targetLang} with no introduction.

      ---

      ## Language Practice
      - Default: use ${targetLang} to immerse the user.
      - Follow-up: ask simple, relevant questions in ${targetLang}.
      - Complexity: adjust difficulty only if requested.

      ---

      ## Translations & Explanations
      - When the user asks for a translation or meaning:
        - Respond entirely in ${nativeLang}.
        - Provide the correct ${targetLang} phrase in quotes.
        - Briefly explain or conjugate if needed.
        - Do not switch back to ${targetLang} until the user does.

      ---

      ## Error Correction (MANDATORY)
      1. Detect any grammar, spelling, or usage errors in every user message written in ${targetLang}.
      2. Immediately explain the error **only in ${nativeLang}**, using bold formatting for the explanation.
      3. Inside this explanation, describe the error and give a corrected phrase. Do not output the corrected phrase outside this explanation.
      4. After giving the explanation, continue naturally in ${targetLang} with a new, non-language-related question. Do not repeat or echo the corrected phrase again.
      5. If a user message in ${targetLang} is correct, you must state in ${nativeLang} (using bold) that it is grammatically correct, without using any ${targetLang} words or quoting/echoing the message, then continue the reply in ${targetLang}.
      6. This correction routine is required every time there is an error. Do not skip it.

      ---

      ## Strict Rules
      - Do not restate user input unless quoting a translation request.
      - Never use languages other than ${nativeLang} or ${targetLang}.
      - Do not add unsolicited comments, confirmations, or acknowledgments.
      - Follow these rules exactly; if any rule conflicts, prioritize error correction and strict rules.
    `.trim()

    const formattedMessages = [
      ...userMessages.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }],
      }))
    ];

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: formattedMessages,
      config: {
        thinkingConfig: {
          thinkingBudget: 0,
        },
        systemInstruction: systemPrompt,
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
