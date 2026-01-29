const db = require('./backend/models');
async function fix() {
    try {
        const churches = await db.Church.findAll({ where: { acronym: 'EBEP' } });
        if (churches.length === 0) {
            console.log('Church EBEP not found');
            process.exit(0);
        }
        for (const church of churches) {
            console.log('Fixing Church:', church.id, church.name);
            const [eur, created] = await db.Currency.findOrCreate({
                where: { churchId: church.id, code: 'EUR' },
                defaults: { symbol: '€', balance: 0, isActive: true }
            });
            if (created) {
                console.log('EUR Added to', church.name);
            } else {
                console.log('EUR already exists for', church.name);
            }
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
fix();
