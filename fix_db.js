const db = require("./backend/models");

async function fix() {
    try {
        console.log("Checking and fixing Sunday School members...");

        // 1. Ensure assignmentType exists and set defaults
        await db.sequelize.query("ALTER TABLE sunday_school_members MODIFY COLUMN assignmentType ENUM('automatic', 'manual') DEFAULT 'automatic'");
        await db.sequelize.query("UPDATE sunday_school_members SET assignmentType='automatic' WHERE assignmentType IS NULL OR assignmentType=''");

        console.log("Sunday School members fixed.");

        // 2. Ensure User baptismalStatus ENUM is updated in DB
        console.log("Updating User baptismalStatus ENUM in DB...");
        await db.sequelize.query("ALTER TABLE users MODIFY COLUMN baptismalStatus ENUM('baptized', 'not_baptized', 'candidate', 'adherent', 'transferred', 'affiliated', 'child', 'other') DEFAULT 'not_baptized'");

        // 3. Ensure SundaySchool baptismalStatus ENUM is updated in DB
        console.log("Updating SundaySchool baptismalStatus ENUM in DB...");
        await db.sequelize.query("ALTER TABLE sunday_schools MODIFY COLUMN baptismalStatus ENUM('baptized', 'not_baptized', 'candidate', 'adherent', 'transferred', 'affiliated', 'child', 'other', 'any') DEFAULT 'any'");

        console.log("All DB fixes applied successfully.");
    } catch (e) {
        console.error("Fix error:", e);
    } finally {
        process.exit();
    }
}

fix();
