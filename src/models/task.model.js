import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    status: {
      type: String,
      enum: ["todo", "in-progress", "done"],
      default: "todo",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
    },
    dueDate: Date,
    completedAt: Date,

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

// 🔥 Business Logic
taskSchema.pre("save", function (next) {
  if (this.status === "done") {
    this.completedAt = new Date();
  } else {
    this.completedAt = null;
  }
  next();
});

export default mongoose.model("Task", taskSchema);