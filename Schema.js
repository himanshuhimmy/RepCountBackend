import mongoose from "mongoose";

let userSchema = new mongoose.Schema(
  {
    name: String,
    username: String,
    password: String,
  },
  { collection: `Users` },
);

let musclesSchema = new mongoose.Schema(
  {
    muscle: String,
  },
  { collection: `Muscle-Group` },
);

let exercisesSchema = new mongoose.Schema(
  {
    name: String,
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: `Users`,
      required: true,
    },
    muscleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: `Muscle-Group`,
      required: true,
    },
    isCustom: { type: Boolean, default: false },
  },
  { collection: `Exercises` },
);

let routineSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: `Users`,
      required: true,
    },
    default: Boolean,
    photo: String,
    group: String,
    customName: { type: String, default: "" },
    exerciseId: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: `Exercises`,
        required: true,
        muscleId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Muscle-Group",
          required: true,
        },
      },
    ],
  },
  { collection: `Routine` },
);

const setSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },

    routineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Routine",
      required: true,
    },

    date: {
      type: Date,
      default: Date.now,
    },

    exercises: [
      {
        exerciseId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Exercises",
          required: true,
        },

        Sets: [
          {
            set: {
              type: String,
            },
            reps: Number,
            weight: Number,
            intensity: Number,
            minutes: Number,
          },
        ],
      },
    ],
  },
  { collection: "Sets" },
);

export const usersModel = mongoose.model("Users", userSchema);
export const musclesModel = mongoose.model("Muscle-Group", musclesSchema);
export const exercisesModel = mongoose.model("Exercises", exercisesSchema);
export const routineModel = mongoose.model("Routine", routineSchema);
export const setModel = mongoose.model("Sets", setSchema);
