const express = require("express");
const bcryptjs = require("bcryptjs");
const User = require("../models/user");
const authRouter = express.Router();
const jwt = require("jsonwebtoken");
const auth = require("../middleware/auth");
const { where } = require("sequelize");

const JWT_TOKEN_KEY = process.env.JWT_TOKEN_KEY;

// Sign Up
authRouter.post("/signup", async (req, res) => {
  try {
    let { name, email, password } = req.body;
    email = email.toLowerCase();

    const existingUser = await User.findOne({ where: { email: email } });
    if (existingUser) {
      return res
        .status(400)
        .json({ msg: "User with same email already exists!" });
    }

    const hashedPassword = await bcryptjs.hash(password, 8);

    let user = new User({
      email,
      password: hashedPassword,
      name,
    });
    user = await user.save();
    res.json(user);
  } catch (e) {
    console.log(e);
    res.status(500).json({ error: e.message });
  }
});

// Sign In
authRouter.post("/signin", async (req, res) => {
  try {
    let { email, password } = req.body;
    email = email.toLowerCase();

    const user = await User.findOne({ where: { email: email } });
    if (!user) {
      return res
        .status(400)
        .json({ msg: "User with this email does not exist!" });
    }

    const isMatch = await bcryptjs.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Incorrect password." });
    }

    const token = jwt.sign({ id: user._id }, JWT_TOKEN_KEY);
    res.json({ token, id: user.dataValues.id, name: user.dataValues.name });
  } catch (e) {
    console.log(e);
    res.status(500).json({ error: e.message });
  }
});

authRouter.post("/tokenIsValid", async (req, res) => {
  try {
    const token = req.header("x-auth-token");
    if (!token) return res.json(false);
    const verified = jwt.verify(token, JWT_TOKEN_KEY);
    if (!verified) return res.json(false);

    const user = await User.findById(verified.id);
    if (!user) return res.json(false);
    res.json(true);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// get user data
authRouter.get("/getToken", auth, async (req, res) => {
  const user = await User.find({ where: { id: req.user } });
  console.log(user);
  res.json({ ...user._doc, token: req.token });
});

module.exports = authRouter;
