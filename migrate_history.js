const db = require("./backend/models");

async function check() {
    try {
        await db.sequelize.query("ALTER TABLE category_histories MODIFY COLUMN subtypeId INTEGER NULL");
        await db.sequelize.query("ALTER TABLE category_histories ADD COLUMN IF NOT EXISTS baptismalStatus VARCHAR(50) NULL");
        console.log("Database updated: subtypeId is now nullable and baptismalStatus column added to category_histories.");
    } catch (e) {
        console.error("Migration error:", e);
    } finally {
        process.exit();
    }
}

check();
