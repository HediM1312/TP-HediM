import mongoose, { Schema, Document } from "mongoose";

export interface IMention extends Document {
    tweet_id: mongoose.Types.ObjectId;
    mentioned_user_id: mongoose.Types.ObjectId;
}

const MentionSchema = new Schema<IMention>({
    tweet_id: { type: Schema.Types.ObjectId, ref: "Tweet", required: true },
    mentioned_user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
});

export default mongoose.model<IMention>("Mention", MentionSchema);
