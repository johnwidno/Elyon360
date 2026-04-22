const db = require("./models");

const cleanup = async () => {
    try {
        console.log("Connecting to database...");
        // Ensure models are synced/loaded (just accessing db is enough usually)

        console.log("Cleaning up Category History (Truncating table)...");
        await db.CategoryHistory.destroy({
            where: {},
            truncate: true // Truncate is faster and resets auto-increment often
        });

        console.log("Category History cleared successfully.");
        process.exit(0);
    } catch (err) {
        console.error("Error cleaning up history:", err);
        process.exit(1);
    }
};

cleanup();
