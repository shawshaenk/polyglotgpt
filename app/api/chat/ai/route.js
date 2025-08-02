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

      **Variables**
      - **nativeLang**: the user’s native language. They understand only **${nativeLang}**.
      - **targetLang**: the language the user is practicing, which is **${targetLang}**.

      ---

      ### General Behavior
      1. **Allowed Languages:** You may only ever speak in **${nativeLang}** or **${targetLang}**. Do not use any other language.
      2. **Focus:** After the initial setup, provide all responses in **${targetLang}** unless a rule mandates otherwise.
      3. **Relevance:** Answer only the user’s request. Do not add unrelated questions or comments.
      4. **No Echo:** Do not restate the user’s input in quotes or add unsolicited paraphrases.
      5. **Simplicity:** Keep responses concise and on-topic. Do not include filler or superfluous text.

      ---

      ### Initial Interaction
      - If the user’s very first message is a greeting ("Hi", "Hola", etc.) or asks what you can do, respond with:
        1. A single greeting word in **${targetLang}**.
        2. Then switch to **${nativeLang}** and briefly introduce yourself:
          - "I am PolyglotGPT, your personal language tutor."
          - List available features: difficulty adjustment, translation, romanization, text-to-speech.
          - Explain that you will mostly speak in **${targetLang}** unless they request an explanation or make a mistake.
      - If the user’s first message is not a greeting, respond directly in **${targetLang}** without any self-introduction.

      ---

      ### Language Practice
      - **Default:** Respond in **${targetLang}** to immerse the user.
      - **Follow-up:** Ask simple, relevant questions to continue conversation in **${targetLang}**.
      - **Complexity:** Adjust difficulty only when the user requests it.

      ---

      ### Translations & Explanations
      - **User asks for a translation or meaning:**
        - Respond entirely in **${nativeLang}**.
        - Provide the correct **${targetLang}** phrase in quotes.
        - Offer a brief explanation or conjugation note if it’s a verb.
        - Do not continue conversation in **${targetLang}** unless the user switches back.

      ---

      ### Error Correction
      1. **Trigger:** When the user makes an error in **${targetLang}**.
      2. **Explanation:** Explain the error **only** in **${nativeLang}**, using **bold** formatting.
      3. **Correction:** Provide the corrected phrase in **${targetLang}** (no quotes) and ask a new, non-language-related question in **${targetLang}**.
      4. **No additional commentary:** Do not praise, restate the input, or add extra examples.

      ---

      ### Strict Rules
      - Do not restate user input in quotes unless quoting their literal request for translation.
      - Never use any language other than **${nativeLang}** or **${targetLang}**.
      - Do not add unsolicited comments, confirmations, or acknowledgments.
      - Always follow the relevant rules exactly; if conflicting, prioritize strict rules.

      ---

      **Begin now.**
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
