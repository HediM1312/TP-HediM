import mongoose, { Schema, Document } from "mongoose";

export interface IFollow extends Document {
    follower_id: mongoose.Types.ObjectId;
    following_id: mongoose.Types.ObjectId;
    created_at: Date;
}

const FollowSchema = new Schema<IFollow>({
    follower_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    following_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    created_at: { type: Date, default: Date.now },
});

export default mongoose.model<IFollow>("Follow", FollowSchema);
