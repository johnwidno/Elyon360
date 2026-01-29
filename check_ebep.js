const db = require('./backend/models');
async function check() {
    try {
        const church = await db.Church.findOne({ where: { acronym: 'EBEP' } });
        if (!church) {
            console.log('Church EBEP not found');
            process.exit(0);
        }
        console.log('Church Found:', church.id, church.name);
        const currencies = await db.Currency.findAll({ where: { churchId: church.id } });
        console.log('Currencies:', JSON.stringify(currencies, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
check();
