const db = require('./models');

async function migrate() {
    try {
        await db.sequelize.authenticate();
        console.log('Connection has been established successfully.');

        const queryInterface = db.sequelize.getQueryInterface();

        // Check if column exists, if not add it
        try {
            await queryInterface.addColumn('buildings', 'code', {
                type: db.Sequelize.STRING,
                allowNull: true
            });
            console.log("Column 'code' added to 'buildings' table.");
        } catch (error) {
            console.log("Column 'code' might already exist or error adding it:", error.message);
        }

        try {
            await queryInterface.addColumn('buildings', 'type', {
                type: db.Sequelize.STRING,
                allowNull: true
            });
            console.log("Column 'type' added to 'buildings' table.");
        } catch (error) {
            console.log("Column 'type' might already exist or error adding it:", error.message);
        }

        try {
            await queryInterface.addColumn('buildings', 'address', {
                type: db.Sequelize.STRING,
                allowNull: true
            });
            console.log("Column 'address' added to 'buildings' table.");
        } catch (error) {
            console.log("Column 'address' might already exist or error adding it:", error.message);
        }

        try {
            await queryInterface.addColumn('buildings', 'city', {
                type: db.Sequelize.STRING,
                allowNull: true
            });
            console.log("Column 'city' added to 'buildings' table.");
        } catch (error) {
            console.log("Column 'city' might already exist or error adding it:", error.message);
        }

        console.log("Migration completed.");
    } catch (error) {
        console.error('Unable to connect to the database or run migration:', error);
    } finally {
        await db.sequelize.close();
    }
}

migrate();
