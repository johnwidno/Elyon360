const db = require('./models');

async function testInventory() {
    try {
        const room = await db.Room.findOne();
        console.log('Testing Room -> InventoryItem include...');
        try {
            const result = await db.Room.findOne({
                where: { id: room.id },
                include: [{ model: db.InventoryItem, as: 'inventoryItems' }]
            });
            console.log('OK');
        } catch (err) {
            console.log('FAILED');
            console.error('Error message:', err.message);
            if (err.sql) {
                console.log('--- EXECUTED SQL ---');
                console.log(err.sql);
                console.log('--- END SQL ---');
            }
        }
    } catch (err) {
        console.error(err);
    }
    process.exit(0);
}

testInventory();
