const express = require("express");
const mongoose = require("mongoose");

const bodyParser = require("body-parser");

const app = express();
const cors = require("cors");
require("dotenv").config();

app.use(cors());
app.use(express.static("public"));

app.use(bodyParser.urlencoded({ extended: "false" }));
app.use(bodyParser.json());

// connect to database
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// User schema
let userSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
  },
  exercises: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exercise",
    },
  ],
});

const User = mongoose.model("User", userSchema);

// Exercice Schema
let exerciseSchema = new mongoose.Schema({
  description: String,
  duration: Number,
  date: Date,
});

const Exercise = mongoose.model("Exercise", exerciseSchema);

// utils functions
function formatDate(inputDate) {
  const date = new Date(inputDate);

  const options = {
    weekday: "short",
    month: "short",
    day: "2-digit",
    year: "numeric",
  };

  return date.toLocaleDateString("en-US", options);
}

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.post("/api/users", async (req, res) => {
  const username = req.body.username;
  try {
    const user = new User({ username });
    const savedUser = await user.save();
    res.json(savedUser);
  } catch (err) {
    res.json({ error: err.message });
  }
});

app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find({});
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/users/:_id/exercises", async (req, res) => {
  const id = req.params._id;
  const { description, duration, date } = req.body;
  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const newDate = date ? new Date(date) : new Date();
    const exerciseObj = {
      description,
      duration: parseInt(duration),
      date: formatDate(newDate).replace(/,/g, ""),
    };
    const exercise = new Exercise(exerciseObj);
    await exercise.save();
    user.exercises.push(exercise);
    await user.save();
    const response = {
      username: user.username,
      ...exerciseObj,
      _id: id,
    };
    res.json(response);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
