import connectDB from "@/config/db";
import SavedItem from "@/models/savedItem";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return NextResponse.json({
        success: false,
        message: "User not Authenticated",
      });
    }

    await connectDB();
    const data = await SavedItem.find({ userId }).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message });
  }
}
