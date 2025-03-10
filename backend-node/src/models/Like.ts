import mongoose, { Schema, Document } from "mongoose";
 
export interface ILike extends Document {
  user_id: mongoose.Types.ObjectId;
  tweet_id: mongoose.Types.ObjectId;
  created_at: Date;
}
 
const LikeSchema = new Schema<ILike>({
  user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
  tweet_id: { type: Schema.Types.ObjectId, ref: "Tweet", required: true },
  created_at: { type: Date, default: Date.now },
});
 
export default mongoose.model<ILike>("Like", LikeSchema);