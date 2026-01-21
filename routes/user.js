const express = require("express");

const auth = require("../middleware/auth");

const Review = require("../models/review");
const User = require("../models/user");
const Friend = require("../models/friend");

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

module.exports = userRouter;