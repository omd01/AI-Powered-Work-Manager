import mongoose, { Document, Schema, Model } from "mongoose"
import bcrypt from "bcryptjs"

interface WorkingHours {
  start: string
  end: string
  enabled: boolean
}

interface TimeBlock {
  id: string
  title: string
  day: string
  startTime: string
  endTime: string
  type: "working" | "blocked"
}

interface Schedule {
  workingHours: {
    monday: WorkingHours
    tuesday: WorkingHours
    wednesday: WorkingHours
    thursday: WorkingHours
    friday: WorkingHours
    saturday: WorkingHours
    sunday: WorkingHours
  }
  timeBlocks: TimeBlock[]
}

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId
  name: string
  email: string
  password: string
  profilePicture?: string
  role: "Admin" | "Lead" | "Member"
  organizationId?: mongoose.Types.ObjectId // @deprecated - Use organizations array instead
  organizations: {
    organizationId: mongoose.Types.ObjectId
    role: "Admin" | "Lead" | "Member"
    joinedAt: Date
  }[]
  currentOrganizationId?: mongoose.Types.ObjectId // The active organization user is currently working in
  skills?: string[]
  schedule?: Schedule
  createdAt: Date
  updatedAt: Date
  comparePassword(candidatePassword: string): Promise<boolean>
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please provide a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // Don't include password in queries by default
    },
    profilePicture: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      enum: ["Admin", "Lead", "Member"],
      default: "Member",
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
    },
    organizations: [
      {
        organizationId: {
          type: Schema.Types.ObjectId,
          ref: "Organization",
          required: true,
        },
        role: {
          type: String,
          enum: ["Admin", "Lead", "Member"],
          required: true,
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    currentOrganizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
    },
    skills: {
      type: [String],
      default: [],
    },
    schedule: {
      type: Schema.Types.Mixed,
      default: {
        workingHours: {
          monday: { start: "09:00", end: "17:00", enabled: true },
          tuesday: { start: "09:00", end: "17:00", enabled: true },
          wednesday: { start: "09:00", end: "17:00", enabled: true },
          thursday: { start: "09:00", end: "17:00", enabled: true },
          friday: { start: "09:00", end: "17:00", enabled: true },
          saturday: { start: "09:00", end: "17:00", enabled: false },
          sunday: { start: "09:00", end: "17:00", enabled: false },
        },
        timeBlocks: [],
      },
    },
  },
  {
    timestamps: true,
  },
)

// Index for faster queries (email index is already created by unique: true)
UserSchema.index({ organizationId: 1 })
UserSchema.index({ currentOrganizationId: 1 })
UserSchema.index({ "organizations.organizationId": 1 })

// Method to compare password
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password)
}

// Hash password before saving
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next()
  }

  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
  next()
})

// Prevent model overwrite upon initial compile
// Force reload the model to ensure schema changes take effect
if (mongoose.models.User) {
  delete mongoose.models.User
}

const User: Model<IUser> = mongoose.model<IUser>("User", UserSchema)

export default User
