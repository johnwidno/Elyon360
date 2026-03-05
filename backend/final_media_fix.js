const { sequelize } = require('./models');

async function finalMediaFix() {
    console.log('Ensuring LONGTEXT columns for all media fields...');
    try {
        // Groups
        console.log('Updating groups table...');
        await sequelize.query("ALTER TABLE `groups` MODIFY COLUMN `logo` LONGTEXT NULL");
        await sequelize.query("ALTER TABLE `groups` MODIFY COLUMN `charter` LONGTEXT NULL");

        // Organizations
        console.log('Updating organizations table...');
        await sequelize.query("ALTER TABLE `organizations` MODIFY COLUMN `logo` LONGTEXT NULL");

        console.log('Final media fields fix completed successfully.');
    } catch (err) {
        console.error('Final repair failed:', err);
    }
    process.exit(0);
}

finalMediaFix();
