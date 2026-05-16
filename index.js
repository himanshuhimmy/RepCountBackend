import "./Config.js";
import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

import {
  usersModel,
  musclesModel,
  exercisesModel,
  routineModel,
  setModel,
} from "./Schema.js";

const app = express();
const JWT_SECRET = "repcount_secret_key_change_this_in_production";

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Auth middleware ───────────────────────────────────────────────────────────

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }
  try {
    req.user = jwt.verify(authHeader.split(" ")[1], JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

// ─── Auth routes ───────────────────────────────────────────────────────────────

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const user = await usersModel.findOne({ username });
  if (!user) return res.status(401).json({ message: "Invalid username or password" });

  // Support bcrypt hashes for new accounts and plain text for legacy accounts
  const isMatch = user.password.startsWith("$2")
    ? await bcrypt.compare(password, user.password)
    : password === user.password;

  if (!isMatch) return res.status(401).json({ message: "Invalid username or password" });

  const token = jwt.sign(
    { _id: user._id, username: user.username, name: user.name },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({
    token,
    user: { _id: user._id, username: user.username, name: user.name },
  });
});

app.post("/addUser", async (req, res) => {
  const { name, username, password } = req.body;

  const existing = await usersModel.findOne({ username });
  if (existing) return res.status(409).json({ message: "Username already taken" });

  const hashed = await bcrypt.hash(password, 10);
  const user = new usersModel({ name, username, password: hashed });
  await user.save();
  res.status(201).json({ message: "Account created" });
});

// ─── Muscles ──────────────────────────────────────────────────────────────────

app.get("/getMuscles", verifyToken, async (req, res) => {
  const data = await musclesModel.find();
  res.send(data);
});

// ─── Exercises ────────────────────────────────────────────────────────────────

app.get("/getAllExercise", verifyToken, async (req, res) => {
  const data = await exercisesModel.find().populate("muscleId");
  res.send(data);
});

app.post("/userExercise", verifyToken, async (req, res) => {
  const data = new exercisesModel(req.body);
  const result = await data.save();
  res.send(result);
});

// ─── Routines ─────────────────────────────────────────────────────────────────

app.get("/defaultRoutine", verifyToken, async (req, res) => {
  const data = await routineModel.find({ default: true }).populate({
    path: "exerciseId",
    populate: { path: "muscleId" },
  });
  res.send(data);
});

app.get("/userRoutine/:id", verifyToken, async (req, res) => {
  const data = await routineModel.find({ userId: req.params.id }).populate({
    path: "exerciseId",
    populate: { path: "muscleId" },
  });
  res.send(data);
});

app.get("/activeRoutine/:id", verifyToken, async (req, res) => {
  const data = await routineModel.find({ _id: req.params.id }).populate({
    path: "exerciseId",
    populate: { path: "muscleId" },
  });
  res.send(data);
});

app.post("/addUserRoutine", verifyToken, async (req, res) => {
  const data = new routineModel(req.body);
  const result = await data.save();
  res.send(result);
});

app.put("/editRoutine/:id", verifyToken, async (req, res) => {
  const data = await routineModel.updateOne({ _id: req.params.id }, { $set: req.body });
  res.send(data);
});

app.delete("/deleteRoutine/:id", verifyToken, async (req, res) => {
  const data = await routineModel.deleteOne({ _id: req.params.id });
  res.send(data);
});

// ─── Sets ─────────────────────────────────────────────────────────────────────

app.get("/getSets/:id", verifyToken, async (req, res) => {
  const data = await setModel
    .find({ userId: req.params.id })
    .populate("userId")
    .populate({
      path: "routineId",
      populate: { path: "exerciseId", populate: { path: "muscleId" } },
    })
    .populate({
      path: "exercises.exerciseId",
      populate: { path: "muscleId" },
    });
  res.send(data);
});

app.post("/addSet", verifyToken, async (req, res) => {
  const data = new setModel(req.body);
  const result = await data.save();
  res.send(result);
});

app.put("/updateSet/:id", verifyToken, async (req, res) => {
  const data = await setModel.updateOne({ _id: req.params.id }, { $set: req.body });
  res.send(data);
});

// ─── Start ────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
