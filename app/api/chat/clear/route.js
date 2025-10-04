import Chat from "@/models/chat";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { userId } = getAuth(req);
    const { chatId } = await req.json();

    if (!userId) {
      return NextResponse.json({
        success: false,
        message: "User not authenticated",
      });
    }

    //Prepare chat database and create new chat
    const chat = await Chat.findOne({ userId, _id: chatId });
    chat.messages = [];
    await chat.save();

    return NextResponse.json({ success: true, message: "Chat Cleared" });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
