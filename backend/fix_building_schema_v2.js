const db = require('./models');

async function migrate_v2() {
    try {
        await db.sequelize.authenticate();
        console.log('Connection has been established successfully.');

        const queryInterface = db.sequelize.getQueryInterface();

        const columnsToAdd = [
            { name: 'description', type: db.Sequelize.TEXT },
            { name: 'district', type: db.Sequelize.STRING },
            { name: 'country', type: db.Sequelize.STRING },
            { name: 'latitude', type: db.Sequelize.FLOAT },
            { name: 'longitude', type: db.Sequelize.FLOAT },
            { name: 'surfaceArea', type: db.Sequelize.FLOAT },
            { name: 'floors', type: db.Sequelize.INTEGER },
            { name: 'totalRooms', type: db.Sequelize.INTEGER },
            { name: 'capacity', type: db.Sequelize.INTEGER },
            { name: 'constructionYear', type: db.Sequelize.INTEGER },
            // ENUMS - Using STRING for safer migration if enum type creation fails, 
            // but let's try to be precise if possible, or fallback to string which fits.
            { name: 'condition', type: db.Sequelize.STRING },
            { name: 'status', type: db.Sequelize.STRING, defaultValue: 'Actif' },
            { name: 'usage', type: db.Sequelize.STRING },
            { name: 'managerType', type: db.Sequelize.STRING },
            { name: 'managerName', type: db.Sequelize.STRING },
            { name: 'managerPhone', type: db.Sequelize.STRING },
            { name: 'managerEmail', type: db.Sequelize.STRING }
        ];

        for (const col of columnsToAdd) {
            try {
                // Prepare attributes
                const attributes = { type: col.type };
                if (col.defaultValue !== undefined) attributes.defaultValue = col.defaultValue;
                attributes.allowNull = true; // Default for these upgrades

                await queryInterface.addColumn('buildings', col.name, attributes);
                console.log(`Column '${col.name}' added to 'buildings' table.`);
            } catch (error) {
                // Ignore specific "Duplicate column name" error code usually 1060 in MySQL
                if (error.original && error.original.code === 'ER_DUP_FIELDNAME') {
                    console.log(`Column '${col.name}' already exists. Skipping.`);
                } else {
                    console.log(`Error adding column '${col.name}' (might exist):`, error.message);
                }
            }
        }

        console.log("Migration V2 completed.");
    } catch (error) {
        console.error('Unable to connect to the database or run migration:', error);
    } finally {
        await db.sequelize.close();
    }
}

migrate_v2();
