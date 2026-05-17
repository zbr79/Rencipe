
import mongoose, { Document, Schema } from "mongoose";

export type CommentEntryType = "recipe" | "meal";

export interface ICommentReply {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  displayName: string;
  text: string;
  upvotedBy: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IComment extends Document {
  entryType: CommentEntryType;
  entryId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  displayName: string;
  text: string;
  upvotedBy: mongoose.Types.ObjectId[];
  replies: ICommentReply[];
  createdAt: Date;
  updatedAt: Date;
}

const CommentReplySchema = new Schema<ICommentReply>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    displayName: { type: String, required: true, trim: true },
    text: { type: String, required: true, trim: true, maxlength: 1200 },
    upvotedBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

const CommentSchema = new Schema<IComment>(
  {
    entryType: { type: String, enum: ["recipe", "meal"], required: true, index: true },
    entryId: { type: Schema.Types.ObjectId, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    displayName: { type: String, required: true, trim: true },
    text: { type: String, required: true, trim: true, maxlength: 1200 },
    upvotedBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
    replies: { type: [CommentReplySchema], default: [] },
  },
  { timestamps: true }
);

CommentSchema.index({ entryType: 1, entryId: 1, createdAt: -1 });

export default mongoose.model<IComment>("Comment", CommentSchema);