const { sequelize } = require('./models');

async function verify() {
    try {
        const [results] = await sequelize.query('DESCRIBE groups');
        const fields = results.map(r => r.Field);
        console.log('Fields in groups table:', fields.join(', '));
        if (fields.includes('logo') && fields.includes('charter')) {
            console.log('VERIFICATION SUCCESSFUL: logo and charter exist.');
        } else {
            console.log('VERIFICATION FAILED: missing columns.');
        }
    } catch (err) {
        console.error(err);
    }
    process.exit(0);
}

verify();
