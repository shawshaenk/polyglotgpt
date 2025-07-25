import connectDB from "@/config/db";
import Chat from "@/models/chat";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req) {
    try {
        const { userId } = getAuth(req);

        if(!userId) {
            return NextResponse.json({success: false, message: "User not authenticated",
            })
        }

    // ✅ Extract nativeLang and targetLang from request body
        const body = await req.json();
        const { nativeLang, targetLang } = body;

        if (!nativeLang || !targetLang) {
            return NextResponse.json({
                success: false,
                message: "Missing nativeLang or targetLang",
            });
        }

        console.log(nativeLang)
        console.log(targetLang)
        //Prepare chat database and create new chat
        const chatData = {
            userId, 
            messages: [],
            name: "New Chat",
            nativeLang,
            targetLang
        };

        //Connect to the database and create a new chat
        await connectDB();
        await Chat.create(chatData);

        return NextResponse.json({success: true, message: "Chat Created"})

    } catch (error) {
        return NextResponse.json({success: false, error: error.message})
    }
}