const { sequelize } = require('./models');

async function fixMediaTypes() {
    console.log('Altering Groups table media types to LONGTEXT...');
    try {
        await sequelize.query("ALTER TABLE `groups` MODIFY COLUMN `logo` LONGTEXT NULL");
        console.log('Logo column altered to LONGTEXT.');
        await sequelize.query("ALTER TABLE `groups` MODIFY COLUMN `charter` LONGTEXT NULL");
        console.log('Charter column altered to LONGTEXT.');
        console.log('Media types fix completed.');
    } catch (err) {
        console.error('Failed to alter media types:', err);
    }
    process.exit(0);
}

fixMediaTypes();
