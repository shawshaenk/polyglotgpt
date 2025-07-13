import { Webhook } from "svix";
import connectDB from "config/db.js";
import User from "models/user.js";

export async function POST(req) {
    const wh = new Webhook(process.env.SIGNING_SECRET)
    const headerPayLoad = await headers()
    const svixHeaders = {
        "svix-id": headerPayLoad.get("svix-id"),
        "svix-signature": headerPayLoad.get("svix-signature")
    };

    const payload = await req.json();
    const body = JSON.stringify(payload);
    const {data, type} = wh.verify(body, svixHeaders)

    const userData = {
        _id: data.id,
        email: data.email_addresses[0].email_address,
        name: `${data.first_name} ${data.last_name}`,
        image: data.image_url,
    }

    await connectDB();

    switch (key) {
    case 'user.created':
        await User.create(userData)
        break;
    case 'user.updated':
        await User.findByIdAndUpdate(data.id, userData)
        break;
    case 'user.deleted':
        await User.findByIdAndDelete(data.id)
        break;
    default:
        break;
    }

    return NextRequest.json({message: "Event Received"})
}