import Chat from "@/models/chat";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import connectDB from "@/config/db";

const ABORT_MESSAGE = "*You cancelled this response.*";

/**
 * Replaces the last message in the chat with "*You cancelled this response.*" if it's a
 * model message that isn't already the abort message. Used when the client
 * aborts a response so the server DB doesn't leave a completed reply that
 * would reappear on the next fetch.
 */
export async function POST(req) {
  try {
    const { userId } = getAuth(req);
    const { chatId } = await req.json();
    await connectDB();
    const chatDoc = await Chat.findOne({ userId, _id: chatId });

    const messages = chatDoc.messages;
    if (messages.length === 0) {
      return NextResponse.json({ success: true });
    }

    const last = messages[messages.length - 1];
    if (last.role === "model" && last.content !== ABORT_MESSAGE) {
      messages[messages.length - 1] = {
        role: "model",
        content: ABORT_MESSAGE,
        timestamp: Date.now(),
      };
      await chatDoc.save();
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false });
  }
}
