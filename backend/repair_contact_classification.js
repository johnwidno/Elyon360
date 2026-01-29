const db = require('./models');

async function repairContactClassification() {
    try {
        await db.sequelize.sync({ alter: true });
        const churches = await db.Church.findAll();
        console.log(`Found ${churches.length} churches to update.`);

        for (const church of churches) {
            console.log(`Processing church: ${church.name} (ID: ${church.id})`);

            // 1. Create Default Contact Types
            const [typeMember, createdM] = await db.ContactType.findOrCreate({
                where: { churchId: church.id, name: 'Membre' },
                defaults: { isSystem: true }
            });

            const [typeOrg, createdO] = await db.ContactType.findOrCreate({
                where: { churchId: church.id, name: 'Organisation' },
                defaults: { isSystem: true }
            });

            // 2. Create Default Subtypes for Organisation
            const subtypes = [
                'Ong', 'Eglise', 'Eglise partenaire', 'Fournisseur', 'Université', 'Ecole', 'Hôpital', 'Autre'
            ];

            for (const s of subtypes) {
                await db.ContactSubtype.findOrCreate({
                    where: { churchId: church.id, contactTypeId: typeOrg.id, name: s }
                });
            }

            // 3. Create Default Subtypes for Membre
            const memberSubtypes = [
                'Baptisé', 'Adhérent', 'Affilié', 'Candidat au baptême', 'Autre'
            ];

            for (const s of memberSubtypes) {
                await db.ContactSubtype.findOrCreate({
                    where: { churchId: church.id, contactTypeId: typeMember.id, name: s }
                });
            }

            // Optional: Delete old ones to enforce "uniquement"
            await db.ContactSubtype.destroy({
                where: {
                    churchId: church.id,
                    contactTypeId: typeMember.id,
                    name: { [db.Sequelize.Op.notIn]: memberSubtypes }
                }
            });

            // 4. Create the self-representing Organization if it doesn't exist
            const egliseSubtype = await db.ContactSubtype.findOne({
                where: { churchId: church.id, name: 'Eglise' }
            });

            const [selfOrg, createdSelf] = await db.Organization.findOrCreate({
                where: { churchId: church.id, isSystem: true },
                defaults: {
                    name: church.name,
                    email: church.contactEmail,
                    phone: church.contactPhone,
                    address: church.address,
                    subtypeId: egliseSubtype ? egliseSubtype.id : null,
                    description: "Votre organisation (Auto-générée)"
                }
            });

            if (createdSelf) {
                console.log(`  - Created self-organization for ${church.name}`);
            } else {
                // If it already exists, update the name/contact info just in case
                await selfOrg.update({
                    name: church.name,
                    email: church.contactEmail,
                    phone: church.contactPhone,
                    address: church.address,
                    subtypeId: egliseSubtype ? egliseSubtype.id : null
                });
                console.log(`  - Updated self-organization for ${church.name}`);
            }
        }

        console.log("Repair completed successfully.");
        process.exit(0);
    } catch (error) {
        console.error("Repair failed:", error);
        process.exit(1);
    }
}

repairContactClassification();
