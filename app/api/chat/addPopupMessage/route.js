import Chat from "@/models/chat";
import { getAuth } from "@clerk/nextjs/server";
import dotenv from "dotenv";
import connectDB from "@/config/db";

dotenv.config();

export async function POST(req) {
    await connectDB();
    let userId = getAuth(req).userId;
    let chatId, userPrompt, fullAssistantMessage;
    const requestBody = await req.json();
    ({ chatId, userPrompt, fullAssistantMessage } = requestBody);
    const chatDoc = await Chat.findOne({ userId, _id: chatId });
    
    chatDoc.messages.push(userPrompt);
    chatDoc.messages.push(fullAssistantMessage);
    await chatDoc.save();
    return Response.json({ success: true });
}