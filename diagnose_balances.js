const db = require('./backend/models');

async function diagnose() {
    try {
        console.log('\n=== DIAGNOSTIC DES BALANCES ===\n');

        // Trouver toutes les églises
        const churches = await db.Church.findAll({
            attributes: ['id', 'name', 'acronym']
        });

        console.log(`Églises trouvées: ${churches.length}\n`);

        for (const church of churches) {
            console.log(`\n--- ${church.name} (${church.acronym}) ---`);

            // Vérifier les devises
            const currencies = await db.Currency.findAll({
                where: { churchId: church.id },
                attributes: ['code', 'balance', 'isActive']
            });

            console.log(`Devises configurées: ${currencies.length}`);
            currencies.forEach(c => {
                console.log(`  ${c.code}: ${c.balance} (${c.isActive ? 'Actif' : 'Inactif'})`);
            });

            // Vérifier les donations
            const donations = await db.Donation.findAll({
                where: { churchId: church.id },
                attributes: ['currency', 'amount']
            });

            const donationsByCurrency = donations.reduce((acc, d) => {
                acc[d.currency] = (acc[d.currency] || 0) + parseFloat(d.amount);
                return acc;
            }, {});

            console.log(`\nDonations totales:`);
            Object.entries(donationsByCurrency).forEach(([curr, total]) => {
                console.log(`  ${curr}: ${total}`);
            });

            // Vérifier les dépenses
            const expenses = await db.Expense.findAll({
                where: { churchId: church.id },
                attributes: ['currency', 'amount']
            });

            const expensesByCurrency = expenses.reduce((acc, e) => {
                acc[e.currency] = (acc[e.currency] || 0) + parseFloat(e.amount);
                return acc;
            }, {});

            console.log(`\nDépenses totales:`);
            Object.entries(expensesByCurrency).forEach(([curr, total]) => {
                console.log(`  ${curr}: ${total}`);
            });

            console.log(`\nBalance calculée (Donations - Dépenses):`);
            const allCurrencies = new Set([...Object.keys(donationsByCurrency), ...Object.keys(expensesByCurrency)]);
            allCurrencies.forEach(curr => {
                const donations = donationsByCurrency[curr] || 0;
                const expenses = expensesByCurrency[curr] || 0;
                const calculated = donations - expenses;
                const stored = currencies.find(c => c.code === curr)?.balance || 0;
                console.log(`  ${curr}: ${calculated} (DB: ${stored}) ${calculated !== parseFloat(stored) ? '⚠️ DIFFÉRENCE!' : '✓'}`);
            });
        }

        process.exit(0);
    } catch (err) {
        console.error('Erreur:', err);
        process.exit(1);
    }
}

diagnose();
