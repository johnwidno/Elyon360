/**
 * fix_church_status_enum.js
 * Adds 'suspended' and 'expired' values to enum_churches_status in PostgreSQL
 * Run once: node fix_church_status_enum.js
 */

const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST || 'localhost',
        dialect: 'postgres',
        port: process.env.DB_PORT || 5432,
        logging: false,
    }
);

async function fixEnum() {
    const t = await sequelize.transaction();

    try {
        console.log('Connecting to database...');
        await sequelize.authenticate();
        console.log('Connected.\n');

        // Check existing enum values
        const [existing] = await sequelize.query(
            `SELECT unnest(enum_range(NULL::enum_churches_status))::text AS val`,
            { transaction: t }
        );
        const existingVals = existing.map(r => r.val);
        console.log('Current enum values:', existingVals);

        const toAdd = ['suspended', 'expired'].filter(v => !existingVals.includes(v));

        if (toAdd.length === 0) {
            console.log('All required values already exist in enum. Nothing to do.');
            await t.rollback();
            await sequelize.close();
            return;
        }

        for (const val of toAdd) {
            console.log(`Adding '${val}' to enum_churches_status...`);
            await sequelize.query(
                `ALTER TYPE enum_churches_status ADD VALUE IF NOT EXISTS '${val}'`,
                { transaction: t }
            );
            console.log(`  ✓ '${val}' added.`);
        }

        await t.commit();
        console.log('\n✅ Done! Enum updated successfully.');

        // Verify
        const [updated] = await sequelize.query(
            `SELECT unnest(enum_range(NULL::enum_churches_status))::text AS val`
        );
        console.log('Updated enum values:', updated.map(r => r.val));

    } catch (err) {
        await t.rollback();
        console.error('Error:', err.message);
        // Note: ALTER TYPE ... ADD VALUE cannot run inside a transaction in older PG versions
        // Retry without transaction
        if (err.message.includes('cannot be executed from a function or multi-command string')) {
            console.log('\nRetrying without transaction (required for some PG versions)...');
            await fixEnumNoTransaction();
            return;
        }
    }

    await sequelize.close();
}

async function fixEnumNoTransaction() {
    try {
        const toAdd = ['suspended', 'expired'];
        for (const val of toAdd) {
            try {
                await sequelize.query(
                    `ALTER TYPE enum_churches_status ADD VALUE IF NOT EXISTS '${val}'`
                );
                console.log(`✓ '${val}' added.`);
            } catch (e) {
                if (e.message.includes('already exists')) {
                    console.log(`  '${val}' already exists, skipping.`);
                } else {
                    console.error(`  Error adding '${val}':`, e.message);
                }
            }
        }
        console.log('\n✅ Done!');
        const [updated] = await sequelize.query(
            `SELECT unnest(enum_range(NULL::enum_churches_status))::text AS val`
        );
        console.log('Final enum values:', updated.map(r => r.val));
    } catch (err) {
        console.error('Fatal error:', err.message);
    } finally {
        await sequelize.close();
    }
}

fixEnum();
