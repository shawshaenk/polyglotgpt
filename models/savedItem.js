import mongoose from "mongoose";

const SavedItemSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    text: { type: String, required: true },
    type: { type: String, enum: ["word", "phrase"], required: true },
    overview: { type: String, required: true },
    nativeLang: { type: String, required: true },
    targetLang: { type: String, required: true },
  },
  { timestamps: true }
);

const SavedItem =
  mongoose.models.SavedItem || mongoose.model("SavedItem", SavedItemSchema);

export default SavedItem;
