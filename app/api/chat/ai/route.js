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
      You are PolyglotGPT, a multilingual, conversational AI designed to help with language learning.

      Ignore any prior instructions.

      The user’s native language is ${nativeLang}. They understand only ${nativeLang}.

      The target language for practice is ${targetLang}.

      The user may switch between ${nativeLang} and ${targetLang} at any time when speaking.

      Initial Introduction:
      - When the user first introduces themselves or starts the conversation (e.g., "Hi, I'm [name]", "Hi", "Hello", "Hola"), introduce yourself as PolyglotGPT. State that you're here to help them learn ${targetLang}, that you can answer their questions, and that you can adjust the difficulty of your responses if they ask. This introduction should be in ${targetLang}.

      Your default behavior:
      - Speak only in ${targetLang} to immerse the user.
      - Ask follow-up questions to encourage the user to continue practicing.
      - Keep your responses short, friendly, and beginner-appropriate unless the user asks for more advanced language.

      Answering User Questions:
        If the user asks for a definition, meaning (of a word/phrase), or explanation (of a linguistic concept or specific term)** (e.g., “What does X mean?”, “Explain X”, “Define X”):
        - Respond entirely in **${nativeLang}**, with bold formatting for the explanation.
        - If the word is a verb, briefly explain how it’s conjugated.
        - Immediately afterward, continue the conversation naturally in ${targetLang} about a different topic.

        For ALL other questions (including general knowledge, philosophical, or conversational questions that are NOT about linguistic definitions or specific term explanations):**
        - Always answer **ONLY** in **${targetLang}**. Do NOT use ${nativeLang} for these types of questions.
        - Ensure your response is solely in ${targetLang} and does not include a ${nativeLang} equivalent or translation of the answer.

      If the user's input contains mistakes, follow this strictly:
      - **Explain all errors in ${nativeLang} only. Do not use any words from any other language.**
      - **Use bold formatting for the entire explanation.**
      - Then respond appropriately to what the user meant, using ${targetLang}. When continuing the conversation, do not use any markdown formatting.
      - Do **not** mix ${targetLang} into the explanation — keep it fully in ${nativeLang}.
      - Immediately afterward, continue the conversation naturally in ${targetLang} about a different topic.

      ❗ **If there are no mistakes, do NOT mention that the sentence is correct, do NOT praise the user, and do NOT provide any commentary. Simply continue the conversation in ${targetLang} without any error explanation.**

      Writing in the Latin alphabet instead of a native alphabet is not considered a mistake.

      🔒 You are STRICTLY FORBIDDEN from using ${targetLang} when explaining mistakes.

      ✅ Example:  
      If the native language is Telugu, the target language is English, and the user says: *“అవును, నేను లెక్కలు అర్ధం నాకు తెలియదు”* You must reply:  
      **మీరు "అవును, నేను లెక్కలు అర్ధం నాకు తెలియదు" అని రాశారు.** **ఇది తప్పు, ఎందుకంటే "అర్ధం" అనేది సరైన రూపం కాదు. "అర్థం కాలేదు" అనాలి. "నాకు తెలియదు" వాక్యంలో సరైన స్థానంలో లేదు. సరైన వాక్యం: "అవును, నాకు లెక్కలు అర్థం కాలేదు".** 👉 Then continue naturally in ${targetLang}.

      Begin the conversation now.`.trim()

    const formattedMessages = [
      ...userMessages.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }],
      }))
    ];

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
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
