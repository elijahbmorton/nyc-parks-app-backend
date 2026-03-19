const express = require("express");
const auth = require("../middleware/auth");
const Report = require("../models/report");
const Review = require("../models/review");
const User = require("../models/user");
const { notifyDeveloper } = require("../utils/email");

const reportRouter = express.Router();

// Flag a review
reportRouter.post("/flagReview", auth, async (req, res) => {
    const { reviewId, reason } = req.body;
    const reporterId = req.user;

    try {
        if (!reviewId || !reason) {
            return res.status(400).json({ error: "Review ID and reason are required." });
        }

        // Check review exists
        const review = await Review.findByPk(reviewId, {
            include: [{ model: User, attributes: ['id', 'name'] }]
        });
        if (!review) {
            return res.status(404).json({ error: "Review not found." });
        }

        // Check for duplicate report
        const existing = await Report.findOne({
            where: { reporterId, reviewId }
        });
        if (existing) {
            return res.status(400).json({ error: "You have already reported this review." });
        }

        const report = await Report.create({
            reporterId,
            reviewId,
            reason,
            status: 'pending',
        });

        // Notify developer
        await notifyDeveloper({
            subject: `[NYC Green] Review Reported - #${reviewId}`,
            body: `Reporter ID: ${reporterId}\nReview ID: ${reviewId}\nReview Author: ${review.User?.name} (ID: ${review.userId})\nReason: ${reason}\nReview Content: ${review.comments || '(no comments)'}`,
        });

        res.json({ message: "Report submitted successfully.", report });
    } catch (error) {
        console.error("Error flagging review:", error);
        res.status(500).json({ error: "Failed to submit report." });
    }
});

module.exports = reportRouter;
