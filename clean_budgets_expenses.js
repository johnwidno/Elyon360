require('dotenv').config({ path: './backend/.env' });
const mysql = require('mysql2/promise');

async function cleanBudgetsAndExpenses() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        console.log('\n=== NETTOYAGE DES BUDGETS ET DÉPENSES ===\n');

        // Supprimer toutes les dépenses
        const [expensesResult] = await connection.query('DELETE FROM expenses');
        console.log(`✓ ${expensesResult.affectedRows} dépenses supprimées`);

        // Supprimer tous les budgets
        const [budgetsResult] = await connection.query('DELETE FROM budgets');
        console.log(`✓ ${budgetsResult.affectedRows} budgets supprimés`);

        console.log('\n✅ Nettoyage terminé avec succès!\n');
        console.log('Note: Les donations sont préservées.');

        await connection.end();
        process.exit(0);
    } catch (err) {
        console.error('❌ Erreur:', err.message);
        await connection.end();
        process.exit(1);
    }
}

cleanBudgetsAndExpenses();
