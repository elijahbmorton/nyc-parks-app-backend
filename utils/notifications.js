const admin = require("./firebase");
const User = require("../models/user");

async function sendPushNotification({ token, title, body, data = {} }) {
    if (!token) return;
    try {
        await admin.messaging().send({
            token,
            notification: { title, body },
            data,
            apns: {
                payload: {
                    aps: { sound: "default" },
                },
            },
        });
    } catch (e) {
        console.error("Failed to send push notification:", e.message);
        // Clear invalid tokens
        if (
            e.code === "messaging/invalid-registration-token" ||
            e.code === "messaging/registration-token-not-registered"
        ) {
            await User.update(
                { deviceToken: null },
                { where: { deviceToken: token } }
            );
            console.log("Cleared invalid device token");
        }
    }
}

async function sendPushToMultiple({ tokens, title, body, data = {} }) {
    if (!tokens || tokens.length === 0) return;
    // Filter out nulls/empties
    const validTokens = tokens.filter((t) => t);
    for (const token of validTokens) {
        await sendPushNotification({ token, title, body, data });
    }
}

module.exports = { sendPushNotification, sendPushToMultiple };
