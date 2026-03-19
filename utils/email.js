const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");

const ses = new SESClient({ region: process.env.AWS_REGION || "us-east-1" });
const DEVELOPER_EMAIL = "elijah.morton.me@gmail.com";
const FROM_EMAIL = "noreply@elimorton.com";

async function notifyDeveloper({ subject, body }) {
    try {
        await ses.send(new SendEmailCommand({
            Source: FROM_EMAIL,
            Destination: { ToAddresses: [DEVELOPER_EMAIL] },
            Message: {
                Subject: { Data: subject },
                Body: { Text: { Data: body } },
            },
        }));
    } catch (e) {
        console.error("Failed to send notification email:", e);
        // Non-blocking: don't throw, just log
    }
}

module.exports = { notifyDeveloper };
