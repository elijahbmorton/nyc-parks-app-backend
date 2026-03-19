const express = require("express");
const { Op } = require('sequelize');

const auth = require("../middleware/auth");

const Review = require("../models/review");
const User = require("../models/user");
const Friend = require("../models/friend");
const { notifyDeveloper } = require("../utils/email");

const userRouter = express.Router();

// TODO: split out a seperate function for the current active user
// So that you're not getting other peoples' blocked friend requests for example
// And validate that it's current active user
userRouter.get("/userInfo", auth, async (req, res) => {
    let user = await User.findOne({ 
        attributes: ['id', 'name', 'profileImage', 'createdAt'],
        include: [
            { model: Review }, 
            {
                model: Friend,
                as: 'friendOf',
                required: false,
                include: [{ model: User, as: 'user', attributes: ['id', 'name', 'profileImage', 'createdAt'] }],
            },
            {
                model: Friend,
                as: 'userOf',
                required: false,
                include: [{ model: User, as: 'friend', attributes: ['id', 'name', 'profileImage', 'createdAt'] }],
            },
        ],
        where: { id: req.query.userId },
    });
    user = user.toJSON();

    // Aggregate the two friend joins
    let friends = [];
    for (let friend of [...user.friendOf, ...user.userOf]) {
        const parsedFriend = {
            ...(friend?.friend || friend.user),
            friendshipCreatedAt: friend.createdAt,
            friendRequestStatus: friend.status,
            userId: friend.userId,
            friendId: friend.friendId,
        }
        friends.push(parsedFriend);
    }
    user.friends = friends;

    delete user.friendOf;
    delete user.userOf;
    
    res.json(user);
});

userRouter.post("/updateProfileImage", auth, async (req, res) => {
    const { userId, profileImage } = req.body;

    // JSON parse profileImageOptions
    let jsonProfileImageOptions;
    try {
        jsonProfileImageOptions = JSON.parse(profileImage);
    } catch (e) {
        res.status(500).json({ message: "Unable to update profile image, invalid option selected." });
        return;
    }

    // Find user
    const user = await User.findOne({ 
        attributes: ['id', 'name', 'profileImage', 'createdAt'],
        where: { id: userId },
    });
    user.profileImage = jsonProfileImageOptions;
    user.save();

    res.json({ message: "Successfully updated profile image" });
});

// Block a user
userRouter.post("/blockUser", auth, async (req, res) => {
    const { blockedUserId } = req.body;
    const userId = req.user;

    try {
        if (!blockedUserId) {
            return res.status(400).json({ error: "Blocked user ID is required." });
        }

        // Find existing friend record in either direction
        let friendRecord = await Friend.findOne({
            where: {
                [Op.or]: [
                    { userId: userId, friendId: blockedUserId },
                    { userId: blockedUserId, friendId: userId },
                ]
            }
        });

        if (friendRecord) {
            friendRecord.status = 'blocked';
            friendRecord.userId = userId;
            friendRecord.friendId = blockedUserId;
            await friendRecord.save();
        } else {
            friendRecord = await Friend.create({
                userId: userId,
                friendId: blockedUserId,
                status: 'blocked',
            });
        }

        // Notify developer
        const blockedUser = await User.findByPk(blockedUserId, { attributes: ['name'] });
        const blockerUser = await User.findByPk(userId, { attributes: ['name'] });
        await notifyDeveloper({
            subject: `[NYC Green] User Blocked - ${blockedUser?.name}`,
            body: `Blocker: ${blockerUser?.name} (ID: ${userId})\nBlocked: ${blockedUser?.name} (ID: ${blockedUserId})\n\nPlease review this user's content within 24 hours.`,
        });

        res.json({ message: "User blocked successfully." });
    } catch (error) {
        console.error("Error blocking user:", error);
        res.status(500).json({ error: "Failed to block user." });
    }
});

module.exports = userRouter;