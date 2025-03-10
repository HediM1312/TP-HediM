import mongoose, { Schema, Document } from "mongoose";

export interface ITweetHashtag extends Document {
    tweet_id: mongoose.Types.ObjectId;
    hashtag_id: mongoose.Types.ObjectId;
}

const TweetHashtagSchema = new Schema<ITweetHashtag>({
    tweet_id: { type: Schema.Types.ObjectId, ref: "Tweet", required: true },
    hashtag_id: { type: Schema.Types.ObjectId, ref: "Hashtag", required: true },
});

export default mongoose.model<ITweetHashtag>("TweetHashtag", TweetHashtagSchema);
