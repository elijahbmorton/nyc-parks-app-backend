const express = require("express");
const bcryptjs = require("bcryptjs");
const User = require("../models/user");
const authRouter = express.Router();
const jwt = require("jsonwebtoken");
const auth = require("../middleware/auth");
const { Op } = require("sequelize");
const Review = require("../models/review");
const Friend = require("../models/friend");
const Report = require("../models/report");

const JWT_TOKEN_KEY = process.env.JWT_TOKEN_KEY;

// Sign Up
authRouter.post("/signup", async (req, res) => {
  try {
    let { name, email, password, agreedToTerms } = req.body;

    if (!agreedToTerms) {
      return res.status(400).json({ msg: "You must agree to the Terms of Service." });
    }

    email = email.toLowerCase();

    const existingUser = await User.findOne({ where: { email: email } });
    if (existingUser) {
      return res
        .status(400)
        .json({ msg: "User with same username already exists!" });
    }

    const hashedPassword = await bcryptjs.hash(password, 8);

    let user = new User({
      email,
      password: hashedPassword,
      name,
      agreedToTerms: true,
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

    const token = jwt.sign({ id: user.id }, JWT_TOKEN_KEY);
    res.json({ ...user.dataValues, token });
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

    const user = await User.findByPk(verified.id);
    if (!user) return res.json(false);
    res.json(true);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// get user data
authRouter.get("/getToken", auth, async (req, res) => {
  const user = await User.findByPk(req.user);
  if (!user) return res.status(404).json({ msg: "User not found" });
  res.json({ ...user.dataValues, token: req.token });
});

// Delete account
authRouter.delete("/deleteAccount", auth, async (req, res) => {
  try {
    const userId = req.user;

    // Delete in order of foreign key dependencies
    await Report.destroy({ where: { reporterId: userId } });
    await Review.destroy({ where: { userId: userId } });
    await Friend.destroy({
      where: {
        [Op.or]: [
          { userId: userId },
          { friendId: userId },
        ]
      }
    });
    await User.destroy({ where: { id: userId } });

    res.json({ message: "Account deleted successfully." });
  } catch (e) {
    console.error("Error deleting account:", e);
    res.status(500).json({ error: "Failed to delete account." });
  }
});

module.exports = authRouter;
