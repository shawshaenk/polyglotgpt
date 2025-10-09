export const maxDuration = 60;
import { GoogleGenAI } from "@google/genai";
import Chat from "@/models/chat";
import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import dotenv from "dotenv";
import connectDB from "@/config/db";
import { getSystemPrompt } from "./systemPrompt.js";

dotenv.config();

const ai = new GoogleGenAI(process.env.GEMINI_API_KEY);

export async function POST(req) {
  await connectDB();

  let chatId, isLocal, userId;

  try {
    userId = getAuth(req).userId;
    const requestBody = await req.json();
    ({ chatId, isLocal } = requestBody);
    const {
      prompt,
      nativeLang,
      targetLang,
      languagesUpdated,
      messages,
      regenerate,
      editingMessage,
      messageIndex,
    } = requestBody;

    // Check if request is already aborted
    if (req.signal?.aborted) {
      return NextResponse.json(
        {
          success: false,
          message: "Request was aborted",
          aborted: true,
        },
        { status: 499 }
      );
    }

    let userMessages = [];
    let chatDoc = null;

    if (isLocal || !userId) {
      // Local (not logged in) mode
      userMessages = messages;
    } else {
      // Logged in, fetch from DB
      chatDoc = await Chat.findOne({ userId, _id: chatId });
      if (!chatDoc) throw new Error("Chat not found");
      if (regenerate || editingMessage) {
        while (chatDoc.messages.length > messageIndex) {
          chatDoc.messages.pop();
        }
      }
      if (!regenerate) {
        chatDoc.messages.push({
          role: "user",
          content: prompt,
          timestamp: Date.now(),
        });
      }
      await chatDoc.save();
      userMessages = chatDoc.messages;
    }

    let messagesForGemini = [...userMessages];

    if (languagesUpdated) {
      const languageChangeMessage = {
        role: "user",
        content: `Language pair has been updated. My native language is now ${nativeLang} and my target language is now ${targetLang}. Forget all previous language settings and instructions and follow the new system rules strictly.`,
        timestamp: Date.now(),
      };

      const lastUserPrompt = messagesForGemini.pop();
      messagesForGemini.push(languageChangeMessage, lastUserPrompt);
    }

    const formattedMessages = messagesForGemini
      .filter((m) => m?.content && m.content.trim().length > 0)
      .map((m) => ({
        role: m.role === "model" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

    console.log(JSON.stringify(formattedMessages, null, 2));

    // Check again before making the API call
    if (req.signal?.aborted) {
      return NextResponse.json(
        {
          success: false,
          message: "Request was aborted",
          aborted: true,
        },
        { status: 499 }
      );
    }

    // Create a promise that rejects when the request is aborted
    const abortPromise = new Promise((_, reject) => {
      if (req.signal) {
        req.signal.addEventListener("abort", () => {
          reject(new Error("Request aborted by client"));
        });
      }
    });

    const systemPrompt = getSystemPrompt(nativeLang, targetLang);

    // Race between the API call and the abort signal
    const result = await Promise.race([
      ai.models.generateContent({
        model: "gemini-2.5-flash-preview-09-2025",
        contents: formattedMessages,
        config: {
          temperature: 2.0,
          thinkingConfig: { thinkingBudget: 8000 },
          systemInstruction: systemPrompt,
        },
      }),
      abortPromise,
    ]);

    const aiReply = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!aiReply) throw new Error("No reply from Gemini");

    // Save only for logged in mode
    if (!isLocal && userId && chatDoc) {
      chatDoc.messages.push({
        role: "model",
        content: aiReply,
        timestamp: Date.now(),
      });
      await chatDoc.save();
    }

    return NextResponse.json({ success: true, response: aiReply });
  } catch (err) {
    // Check if error is due to abort
    if (err.message === "Request aborted by client" || req.signal?.aborted) {
      const abortMessage = "*Response Aborted*";

      // Save abort message to DB for logged-in users
      const { userId } = getAuth(req);

      if (!isLocal) {
        try {
          const chatDoc = await Chat.findOne({ userId, _id: chatId });
          chatDoc.messages.push({
            role: "model",
            content: abortMessage,
            timestamp: Date.now(),
          });
          await chatDoc.save();
        } catch (saveErr) {
          console.error("Error saving abort message:", saveErr);
        }
      }

      return NextResponse.json(
        {
          success: true,
          response: abortMessage,
          aborted: true,
        },
        { status: 200 }
      );
    }
    return NextResponse.json({ success: false, message: err.message });
  }
}
