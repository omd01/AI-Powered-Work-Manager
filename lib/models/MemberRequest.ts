import mongoose, { Document, Schema, Model } from "mongoose"

export interface IMemberRequest extends Document {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  organizationId: mongoose.Types.ObjectId
  status: "pending" | "approved" | "rejected"
  inviteCode: string
  requestedAt: Date
  processedAt?: Date
  processedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const MemberRequestSchema = new Schema<IMemberRequest>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "Organization is required"],
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    inviteCode: {
      type: String,
      required: [true, "Invite code is required"],
      uppercase: true,
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    processedAt: {
      type: Date,
      default: null,
    },
    processedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  },
)

// Indexes for faster queries
MemberRequestSchema.index({ userId: 1, organizationId: 1 })
MemberRequestSchema.index({ organizationId: 1, status: 1 })
MemberRequestSchema.index({ status: 1 })

// Prevent duplicate pending requests
MemberRequestSchema.index(
  { userId: 1, organizationId: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "pending" },
  },
)

// Prevent model overwrite upon initial compile
const MemberRequest: Model<IMemberRequest> =
  mongoose.models.MemberRequest || mongoose.model<IMemberRequest>("MemberRequest", MemberRequestSchema)

export default MemberRequest
