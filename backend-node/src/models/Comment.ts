import mongoose, { Schema, Document } from "mongoose";
 
export interface IComment extends Document {
  tweet_id: mongoose.Types.ObjectId;
  user_id: mongoose.Types.ObjectId;
  content: string;
  created_at: Date;
}
 
const CommentSchema = new Schema<IComment>({
  tweet_id: { type: Schema.Types.ObjectId, ref: "Tweet", required: true },
  user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
  content: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
});
 
export default mongoose.model<IComment>("Comment", CommentSchema);