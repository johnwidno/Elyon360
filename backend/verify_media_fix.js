const { sequelize } = require('./models');

async function verify() {
    try {
        const [results] = await sequelize.query('DESCRIBE `groups`');
        const logoCol = results.find(r => r.Field === 'logo');
        const charterCol = results.find(r => r.Field === 'charter');

        console.log('Logo column:', logoCol ? logoCol.Type : 'Not found');
        console.log('Charter column:', charterCol ? charterCol.Type : 'Not found');

        if (logoCol?.Type?.toLowerCase().includes('text') && charterCol?.Type?.toLowerCase().includes('text')) {
            console.log('VERIFICATION SUCCESSFUL: columns are TEXT/LONGTEXT.');
        } else {
            console.log('VERIFICATION FAILED: columns not correctly updated.');
        }
    } catch (err) {
        console.error(err);
    }
    process.exit(0);
}

verify();
