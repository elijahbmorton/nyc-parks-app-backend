const express = require("express");
const bcryptjs = require("bcryptjs");
const User = require("../models/user");
const reviewsRouter = express.Router();
const jwt = require("jsonwebtoken");
const auth = require("../middleware/auth");
const { where } = require("sequelize");
const Review = require("../models/review");
const { Op, literal } = require('sequelize');
const Friend = require("../models/friend");

// Sign Up
reviewsRouter.post("/addReview", async (req, res) => {
    try {
        // TODO: Validate that the user passed is the logged in user
        let { review, userId } = req.body;
        review = JSON.parse(review);
        console.log(review)

        if (!review.parkId || !userId) {
            return res
                .status(400)
                .json({ msg: "Review or user not provided!" });
        }

        const existingReview = await Review.findOne({ where: { parkId: review.parkId, userId: userId } });
        if (existingReview) {
            // TODO: figure out what to do here
            // For now I'm just gonna delete their existing review and make a new one
            await Review.destroy({ where: { parkId: review.parkId, userId: userId } });
        }

        review = new Review({
            parkId: review.parkId,
            comments: review.comments,
            rating: review.rating,
            favorite: review.favorite,
            userId: userId,
        });
        review.save();

        res.json(review);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

reviewsRouter.get("/reviewsFromPark", auth, async (req, res) => {
    let { parkId, userId } = req.query;

    const where = {};
    if (parkId) where.parkId = parkId;

    const reviews = await Review.findAll({
      where,
      include: [
        {
          model: User,
          attributes: ["id", "name"],
          required: true,
        },
      ],
      attributes: {
        include: [
          [
            literal(`
              EXISTS (
                SELECT 1
                FROM friends f
                WHERE f.status = 'accepted'
                    AND (
                        f.userId = ${userId}
                        AND f.friendId = user.id
                    ) OR (
                        f.userId = user.id
                        AND f.friendId = ${userId}
                    )
              )
            `),
            "friendsWithActiveUser",
          ],
        ],
      },
      order: [["createdAt", "DESC"]],
    });

    res.json(reviews);
});

module.exports = reviewsRouter;
