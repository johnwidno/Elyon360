const db = require('./models');

async function migrate() {
    try {
        console.log("Starting migration: Fixing moncashTransactionId values...");

        // 1. Get all transactions that have a gatewayReference
        const transactions = await db.SubscriptionTransaction.findAll({
            where: {
                gatewayReference: { [db.Sequelize.Op.ne]: null }
            }
        });

        console.log(`Found ${transactions.length} transactions with gateway references.`);

        for (const tx of transactions) {
            if (tx.churchId) {
                // Update the church with the transaction's gatewayReference
                await db.Church.update(
                    { moncashTransactionId: tx.gatewayReference },
                    { where: { id: tx.churchId, moncashTransactionId: null } }
                );
                console.log(`Updated Church ID ${tx.churchId} with TransID: ${tx.gatewayReference}`);
            }
        }

        // 2. If for some reason transactions were logged with null but moncashOrderId matches
        // (Just in case, though usually they are created together)

        console.log("Migration complete.");
        process.exit(0);
    } catch (error) {
        console.error("MIGRATION FAILED:", error);
        process.exit(1);
    }
}

migrate();
