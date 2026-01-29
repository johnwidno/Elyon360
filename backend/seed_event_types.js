const db = require('./models');

async function seedEventTypes() {
    try {
        const churches = await db.Church.findAll();

        const defaultEventTypes = [
            'Service', 'Culte', 'Conférence', 'Formation', 'Étude',
            'Service de prière', 'Service de jeune', 'Retraite spirituelle',
            'Activité sociale', 'Visite', 'Excursion', 'Autre'
        ];

        for (const church of churches) {
            console.log(`Seeding types for church: ${church.name}`);

            for (const typeName of defaultEventTypes) {
                await db.EventType.findOrCreate({
                    where: {
                        churchId: church.id,
                        name: typeName
                    },
                    defaults: {
                        churchId: church.id,
                        name: typeName
                    }
                });
            }
        }

        console.log('Seeding completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding event types:', error);
        process.exit(1);
    }
}

seedEventTypes();
