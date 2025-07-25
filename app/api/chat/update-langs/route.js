import connectDB from "@/config/db";
import Chat from "@/models/chat";
import { NextResponse } from "next/server";

export async function PATCH(req) {
    await connectDB();
    const { chatId, nativeLang, targetLang } = await req.json();
    await Chat.findByIdAndUpdate(chatId, { nativeLang, targetLang });
    return NextResponse.json({ success: true });
}