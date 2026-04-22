const db = require('./models');

async function seedEssentials() {
    try {
        const church = await db.Church.findOne({ where: { subdomain: 'admin-system' } });
        if (!church) {
            console.error("Church 'admin-system' not found. Please run seed_db.js first.");
            process.exit(1);
        }

        const churchId = church.id;
        console.log(`Seeding essentials for church: ${church.name} (ID: ${churchId})`);

        // 1. Currencies
        await db.Currency.bulkCreate([
            { churchId, code: 'HTG', symbol: 'G' },
            { churchId, code: 'USD', symbol: '$' },
            { churchId, code: 'EUR', symbol: '€' }
        ], { ignoreDuplicates: true });
        console.log("✅ Currencies seeded.");

        // 2. Donation Types
        await db.DonationType.bulkCreate([
            { churchId, name: 'OFFRANDE', isMandatory: true },
            { churchId, name: 'DIME', isMandatory: true },
            { churchId, name: 'PROMESSE', isMandatory: true },
            { churchId, name: 'DON_SPECIAL', isMandatory: true }
        ], { ignoreDuplicates: true });
        console.log("✅ Donation Types seeded.");

        // 3. Payment Methods
        await db.PaymentMethod.bulkCreate([
            { churchId, name: 'CASH' },
            { churchId, name: 'VIREMENT' },
            { churchId, name: 'CHEQUE' },
            { churchId, name: 'CARTE DE CREDIT' }
        ], { ignoreDuplicates: true });
        console.log("✅ Payment Methods seeded.");

        // 4. Member Categories
        await db.MemberCategory.bulkCreate([
            'Baptisé', 'Non baptisé', 'Adhérent', 'Candidat au baptême',
            'Affilié', 'Enfant', 'Transféré', 'Autre'
        ].map(name => ({ churchId, name })), { ignoreDuplicates: true });
        console.log("✅ Member Categories seeded.");

        // 5. System Roles
        await db.Role.bulkCreate([
            { churchId, name: 'super_admin', label: 'Super Administrateur', permissions: ['all'] },
            { churchId, name: 'super_admin_secretaire', label: 'Super Administrateur Secrétaire', permissions: ['view_all'] },
            { churchId, name: 'superaduser', label: 'Super Administrateur Utilisateur', permissions: ['view_all'] }
        ], { ignoreDuplicates: true });
        console.log("✅ Super Admin Roles seeded.");

        console.log("Full system essentials seeded successfully.");
        process.exit(0);
    } catch (error) {
        console.error("Error seeding essentials:", error);
        process.exit(1);
    }
}

seedEssentials();
