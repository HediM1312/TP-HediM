import mongoose, { Schema, Document } from "mongoose";

export interface IHashtag extends Document {
    tag: string;
}

const HashtagSchema = new Schema<IHashtag>({
    tag: { type: String, required: true, unique: true },
});

export default mongoose.model<IHashtag>("Hashtag", HashtagSchema);
