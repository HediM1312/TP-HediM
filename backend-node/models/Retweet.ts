import mongoose, { Schema, Document } from "mongoose";

export interface IRetweet extends Document {
    user_id: mongoose.Types.ObjectId;
    tweet_id: mongoose.Types.ObjectId;
    comment?: string;
    created_at: Date;
}

const RetweetSchema = new Schema<IRetweet>({
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    tweet_id: { type: Schema.Types.ObjectId, ref: "Tweet", required: true },
    comment: { type: String },
    created_at: { type: Date, default: Date.now },
});

export default mongoose.model<IRetweet>("Retweet", RetweetSchema);
