import mongoose, { Schema, Document } from "mongoose";

export interface INotification extends Document {
    user_id: mongoose.Types.ObjectId;
    from_user_id: mongoose.Types.ObjectId;
    type: string;
    tweet_id?: mongoose.Types.ObjectId;
    is_read: boolean;
    created_at: Date;
}

const NotificationSchema = new Schema<INotification>({
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    from_user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, required: true },
    tweet_id: { type: Schema.Types.ObjectId, ref: "Tweet" },
    is_read: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now },
});

export default mongoose.model<INotification>("Notification", NotificationSchema);
