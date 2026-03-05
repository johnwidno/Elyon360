const db = require('./models');

async function testAssociations() {
    console.log('--- Detailed Association Test ---');
    try {
        const room = await db.Room.findOne();
        if (!room) {
            console.log('No rooms found.');
            process.exit(0);
        }

        const modelsToTest = [
            { name: 'Building', alias: 'building' },
            { name: 'User', alias: 'manager' },
            { name: 'Group', alias: 'groups' },
            { name: 'SundaySchool', alias: 'sundaySchoolClasses' },
            { name: 'Event', alias: 'events' },
            { name: 'Reservation', alias: 'reservations' },
            { name: 'InventoryItem', alias: 'inventoryItems' }
        ];

        for (const m of modelsToTest) {
            try {
                process.stdout.write(`Testing Room -> ${m.name} (${m.alias})... `);
                await db.Room.findOne({
                    where: { id: room.id },
                    include: [{ model: db[m.name], as: m.alias }]
                });
                console.log('OK');
            } catch (err) {
                console.log('FAILED!');
                console.error(`  Error in ${m.name}: ${err.message}\n`);
                if (err.sql) console.error(`  SQL: ${err.sql}\n`);
            }
        }
    } catch (err) {
        console.error('Diagnostic failed:', err);
    }
    process.exit(0);
}

testAssociations();
