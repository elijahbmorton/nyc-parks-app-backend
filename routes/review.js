const express = require("express");
const User = require("../models/user");
const reviewsRouter = express.Router();
const auth = require("../middleware/auth");
const optionalAuth = require("../middleware/optionalAuth");
const Review = require("../models/review");
const { Op, literal } = require('sequelize');
const Friend = require("../models/friend");
const { containsObjectionableContent } = require("../utils/contentFilter");

// Add or update a review
reviewsRouter.post("/addReview", auth, async (req, res) => {
    try {
        const userId = req.user;
        let { review } = req.body;
        review = JSON.parse(review);

        if (!review.parkId) {
            return res
                .status(400)
                .json({ msg: "Park ID not provided!" });
        }

        // Content filter
        if (containsObjectionableContent(review.comments)) {
            return res.status(400).json({
                msg: "Your review contains language that violates our community guidelines. Please revise and try again."
            });
        }

        const existingReview = await Review.findOne({ where: { parkId: review.parkId, userId: userId } });
        if (existingReview) {
            await Review.destroy({ where: { parkId: review.parkId, userId: userId } });
        }

        review = new Review({
            parkId: review.parkId,
            comments: review.comments,
            rating: review.rating,
            favorite: review.favorite,
            userId: userId,
        });
        await review.save();

        res.json(review);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Get reviews for a park (public - optionalAuth for friend status)
reviewsRouter.get("/reviewsFromPark", optionalAuth, async (req, res) => {
    try {
        let { parkId } = req.query;
        const userId = req.user; // From optionalAuth; may be undefined for guests

        const where = {};
        if (parkId) where.parkId = parkId;

        // Build attributes - only include friend subquery if authenticated
        const attributes = {};
        if (userId) {
            const safeUserId = parseInt(userId, 10);
            if (isNaN(safeUserId)) {
                return res.status(400).json({ error: "Invalid user" });
            }
            attributes.include = [
                [
                    literal(`
                      EXISTS (
                        SELECT 1
                        FROM friends f
                        WHERE f.status = 'accepted'
                            AND (
                                (f.userId = ${safeUserId} AND f.friendId = \`User\`.id)
                                OR (f.userId = \`User\`.id AND f.friendId = ${safeUserId})
                            )
                      )
                    `),
                    "friendsWithActiveUser",
                ],
            ];
        }

        const reviews = await Review.findAll({
          where,
          include: [
            {
              model: User,
              attributes: ["id", "name", "profileImage", "createdAt"],
              required: true,
            },
          ],
          attributes,
          order: [["createdAt", "DESC"]],
        });

        // If authenticated, filter out reviews from blocked users
        if (userId) {
            const blockedRelationships = await Friend.findAll({
                where: {
                    status: 'blocked',
                    [Op.or]: [
                        { userId: userId },
                        { friendId: userId },
                    ]
                }
            });
            const blockedUserIds = blockedRelationships.map(f =>
                f.userId === userId ? f.friendId : f.userId
            );

            if (blockedUserIds.length > 0) {
                const filteredReviews = reviews.filter(r => !blockedUserIds.includes(r.userId));
                return res.json(filteredReviews);
            }
        }

        res.json(reviews);
    } catch (e) {
        console.error("Error fetching reviews:", e);
        res.status(500).json({ error: e.message });
    }
});

module.exports = reviewsRouter;
