require('dotenv').config();
const db = require('./models');

const syncPostModel = async () => {
    try {
        await db.CommunityPost.sync({ alter: true });
        console.log("CommunityPost table synced successfully!");
        process.exit(0);
    } catch (err) {
        console.error("Error syncing model:", err);
        process.exit(1);
    }
};

syncPostModel();
