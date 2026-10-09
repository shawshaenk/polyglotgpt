import connectDB from "@/config/db";
import SavedItem from "@/models/savedItem";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { userId } = getAuth(req);
    const { id } = await req.json();

    if (!userId) {
      return NextResponse.json({
        success: false,
        message: "User not Authenticated",
      });
    }

    await connectDB();
    await SavedItem.deleteOne({ _id: id, userId });

    return NextResponse.json({ success: true, message: "Saved Item Deleted" });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message });
  }
}
