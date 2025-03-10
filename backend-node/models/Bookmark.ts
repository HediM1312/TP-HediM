import mongoose, { Schema, Document } from "mongoose";

export interface IBookmark extends Document {
    user_id: mongoose.Types.ObjectId;
    tweet_id: mongoose.Types.ObjectId;
    created_at: Date;
}

const BookmarkSchema = new Schema<IBookmark>({
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    tweet_id: { type: Schema.Types.ObjectId, ref: "Tweet", required: true },
    created_at: { type: Date, default: Date.now },
});

export default mongoose.model<IBookmark>("Bookmark", BookmarkSchema);
