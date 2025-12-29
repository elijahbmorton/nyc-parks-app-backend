const express = require("express");
const sequelize = require('sequelize');

const auth = require("../middleware/auth");

const Friend = require("../models/friend");
const User = require("../models/user");

const STATUS_VALUES = {
    PENDING: "pending",
    ACCEPTED: "accepted",
    BLOCKED: "blocked",
}

const userRouter = express.Router();

userRouter.post("/sendFriendRequest", auth, async (req, res) => {
    const { userId, friendId } = req.body;

    try {
        // Check if a friend request already exists
        const existingRequest = await Friend.findOne({
            where: {
                $or: [
                    { userId: userId, friendId: friendId },
                    { userId: friendId, friendId: userId }
                ]
            }
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

// Block a friend request
userRouter.post("/blockFriendRequest", auth, async (req, res) => {
    const { userId, friendId } = req.body;

    try {
        const friendRequest = await Friend.findOne({
            where: { userId: friendId, friendId: userId }
        });

        if (!friendRequest) {
            return res.status(404).json({ error: "Friend request not found." });
        }

        friendRequest.status = "blocked";
        await friendRequest.save();

        res.json(friendRequest);
    } catch (error) {
        res.status(500).json({ error: "Failed to block friend request." });
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