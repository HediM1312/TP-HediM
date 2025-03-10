import mongoose, { Schema, Document } from "mongoose";
 
export interface IUser extends Document {
  username: string;
  email: string;
  password_hash: string;
  profile_picture_url?: string;
  banner_picture_url?: string;
  bio?: string;
  created_at: Date;
}
 
const UserSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  profile_picture_url: { type: String },
  banner_picture_url: { type: String },
  bio: { type: String },
  created_at: { type: Date, default: Date.now },
});
 
export default mongoose.model<IUser>("User", UserSchema);