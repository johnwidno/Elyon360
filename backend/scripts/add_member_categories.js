const db = require('../models');

/**
 * Migration script to add default MemberCategory entries for existing churches
 * that don't have any member categories yet.
 */

async function addDefaultMemberCategories() {
    try {
        console.log('Starting MemberCategory migration...');

        // Get all churches
        const churches = await db.Church.findAll();
        console.log(`Found ${churches.length} churches`);

        const defaultMemberCategories = [
            'Baptisé', 'Non baptisé', 'Adhérent', 'Candidat au baptême',
            'Affilié', 'Enfant', 'Transféré', 'Autre'
        ];

        for (const church of churches) {
            // Check if this church already has member categories
            const existingCount = await db.MemberCategory.count({
                where: { churchId: church.id }
            });

            if (existingCount === 0) {
                console.log(`Adding default categories for church: ${church.name} (ID: ${church.id})`);

                await db.MemberCategory.bulkCreate(defaultMemberCategories.map(name => ({
                    churchId: church.id,
                    name
                })));

                console.log(`✓ Added ${defaultMemberCategories.length} categories for ${church.name}`);
            } else {
                console.log(`✓ Church ${church.name} already has ${existingCount} categories, skipping`);
            }
        }

        console.log('\n✅ Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration error:', error);
        process.exit(1);
    }
}

// Run the migration
addDefaultMemberCategories();
