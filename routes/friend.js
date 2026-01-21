const express = require("express");
const { Op } = require('sequelize');

const auth = require("../middleware/auth");

const Friend = require("../models/friend");
const User = require("../models/user");
const Review = require("../models/review");

const STATUS_VALUES = {
    PENDING: "pending",
    ACCEPTED: "accepted",
    BLOCKED: "blocked",
    NONE: "none",
}

const userRouter = express.Router();

userRouter.post("/createFriendRequest", auth, async (req, res) => {
    const { userId, friendId } = req.body;

    try {
        // Check if a friend request already exists
        const existingRequest = await Friend.findOne({
            where: { userId: friendId, friendId: userId }
        });

        if (existingRequest) {
            if (existingRequest.status == STATUS_VALUES.PENDING) {
                return res.status(400).json({ error: "Pending friend request already exists!" });
            } else if (existingRequest.status == STATUS_VALUES.ACCEPTED) {
                return res.status(400).json({ error: "You are already friends with this person!" });
            }
            return res.status(400).json({ error: "This friend request has been blocked." });
        }

        // Make the friend request
        const friendRequest = await Friend.create({
            userId,
            friendId,
            status: STATUS_VALUES.PENDING
        });
        
        res.json(friendRequest);
    } catch (error) {
        res.status(500).json({ error: "Failed to send friend request." });
    }
});

// Accept a friend request
userRouter.post("/acceptFriendRequest", auth, async (req, res) => {
    const { userId, friendId } = req.body;

    try {
        const friendRequest = await Friend.findOne({
            where: { userId: friendId, friendId: userId, status: STATUS_VALUES.PENDING }
        });

        if (!friendRequest) {
            return res.status(404).json({ error: "Friend request not found." });
        }

        friendRequest.status = STATUS_VALUES.ACCEPTED;
        await friendRequest.save();

        res.json(friendRequest);
    } catch (error) {
        res.status(500).json({ error: "Failed to accept friend request." });
    }
});

// Get a friend request between two users
userRouter.get("/getFriendRequest", auth, async (req, res) => {
    const { userId, friendId } = req.query;

    try {
        const friendRequest = await Friend.findOne({
            where: {
                [Op.or]: [
                    { userId: userId, friendId: friendId },
                    { userId: friendId, friendId: userId }
                ]
            }
        });

        if (!friendRequest) {
            return res.status(404).json({ error: "Friend request not found." });
        }

        res.json(friendRequest);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Failed to get friend request." });
    }
});

// Block a friend request
userRouter.post("/cancelFriendRequest", auth, async (req, res) => {
    const { userId, friendId } = req.body;

    try {
        const friendRequest = await Friend.findOne({
            where: {
                [Op.or]: [
                    { userId: userId, friendId: friendId },
                    { userId: friendId, friendId: userId }
                ]
            }
        });

        if (!friendRequest) {
            return res.status(404).json({ error: "Friend request not found." });
        }

        friendRequest.destroy();

        res.json(friendRequest);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Failed to remove friend request." });
    }
});

// Get all park IDs reviewed by user and their friends
userRouter.get("/friendsParks", auth, async (req, res) => {
    const { userId } = req.query;

    try {
        // Get all accepted friendships for this user
        const friendships = await Friend.findAll({
            where: {
                [Op.or]: [
                    { userId: userId, status: STATUS_VALUES.ACCEPTED },
                    { friendId: userId, status: STATUS_VALUES.ACCEPTED }
                ]
            }
        });

        // Extract friend IDs
        const friendIds = friendships.map(friendship => 
            friendship.userId == userId ? friendship.friendId : friendship.userId
        );

        // For now not including the user's own reviews
        // const allUserIds = [parseInt(userId), ...friendIds];

        // Get all reviews from user and friends
        const reviews = await Review.findAll({
            where: {
                userId: {
                    [Op.in]: friendIds
                }
            },
            attributes: ['parkId', 'favorite'],
            distinct: true
        });

        // Extract unique park IDs
        const parkIds = [...new Set(reviews.map(review => review.parkId))];
        const favoriteParkIds = [...new Set(
            reviews
                .filter(review => review.favorite)
                .map(review => review.parkId)
        )];

        res.json({
            reviewedParkIds: parkIds,
            favoriteParkIds: favoriteParkIds,
        });
    } catch (error) {
        console.error('Error fetching friends parks:', error);
        res.status(500).json({ error: "Failed to fetch friends' parks." });
    }
});

// List all friend requests - redundant if this can be pulled on user page
// userRouter.get("/listFriendRequests", auth, async (req, res) => {
//     const { userId } = req.query;

//     try {
//         const friendRequests = await Friend.findAll({
//             where: { friendId: userId },
//             include: [{ model: User, as: "requester", attributes: ["id", "name"] }]
//         });

//         res.json(friendRequests);
//     } catch (error) {
//         res.status(500).json({ error: "Failed to list friend requests." });
//     }
// });

module.exports = userRouter;