import mongoose, { Document, Schema, Model } from "mongoose"

export interface IOrganization extends Document {
  _id: mongoose.Types.ObjectId
  name: string
  handle: string
  adminId: mongoose.Types.ObjectId
  inviteCode: string
  members: {
    userId: mongoose.Types.ObjectId
    role: "Admin" | "Lead" | "Member"
    status: "active" | "pending"
    joinedAt: Date
  }[]
  createdAt: Date
  updatedAt: Date
}

const OrganizationSchema = new Schema<IOrganization>(
  {
    name: {
      type: String,
      required: [true, "Organization name is required"],
      trim: true,
      minlength: [2, "Organization name must be at least 2 characters"],
      maxlength: [100, "Organization name cannot exceed 100 characters"],
    },
    handle: {
      type: String,
      required: [true, "Organization handle is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9-]+$/, "Handle can only contain lowercase letters, numbers, and hyphens"],
    },
    adminId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Admin is required"],
    },
    inviteCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    members: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        role: {
          type: String,
          enum: ["Admin", "Lead", "Member"],
          required: true,
        },
        status: {
          type: String,
          enum: ["active", "pending"],
          default: "active",
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  },
)

// Indexes for faster queries (handle and inviteCode indexes are already created by unique: true)
OrganizationSchema.index({ adminId: 1 })

// Generate a random invite code
OrganizationSchema.methods.generateInviteCode = function (): string {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let code = ""
  for (let i = 0; i < 8; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return code
}

// Prevent model overwrite upon initial compile
const Organization: Model<IOrganization> =
  mongoose.models.Organization || mongoose.model<IOrganization>("Organization", OrganizationSchema)

export default Organization
