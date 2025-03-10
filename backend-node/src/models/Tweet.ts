import mongoose, { Schema, Document } from "mongoose";
 
export interface ITweet extends Document {
  user_id: mongoose.Types.ObjectId;
  content: string;
  media_url?: string;
  created_at: Date;
}
 
const TweetSchema = new Schema<ITweet>({
  user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
  content: { type: String, required: true },
  media_url: { type: String },
  created_at: { type: Date, default: Date.now },
});
 
export default mongoose.model<ITweet>("Tweet", TweetSchema);