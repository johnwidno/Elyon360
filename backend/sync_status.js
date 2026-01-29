const db = require("./models");

const syncDB = async () => {
    try {
        console.log("Syncing database with new status fields...");
        await db.sequelize.sync({ alter: true });
        console.log("Database synced successfully!");
        process.exit(0);
    } catch (error) {
        console.error("Error syncing database:", error);
        process.exit(1);
    }
};

syncDB();
