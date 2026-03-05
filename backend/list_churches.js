const db = require('./models');

async function checkChurches() {
    try {
        const churches = await db.Church.findAll({ attributes: ['id', 'name', 'subdomain'] });
        console.log('Churches:');
        churches.forEach(c => console.log(`- ID ${c.id}: ${c.name} (${c.subdomain})`));
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkChurches();
