/**
 * Migration: Fix member_requests table
 * Run once with: node migrations/fix_member_requests.js
 * This script safely migrates the member_requests table
 * to the new schema without data loss.
 */

require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        logging: console.log,
    }
);

async function migrate() {
    const queryInterface = sequelize.getQueryInterface();

    try {
        await sequelize.authenticate();
        console.log('✅ Connected to database.');

        // Get existing columns
        const tableExists = await sequelize.query(
            `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'member_requests')`,
            { type: Sequelize.QueryTypes.SELECT }
        );

        if (!tableExists[0].exists) {
            console.log('⚠️  Table member_requests does not exist – nothing to migrate.');
            return;
        }

        const columns = await sequelize.query(
            `SELECT column_name FROM information_schema.columns WHERE table_name='member_requests'`,
            { type: Sequelize.QueryTypes.SELECT }
        );
        const existingColumns = columns.map(c => c.column_name);
        console.log('📋 Existing columns:', existingColumns);

        // 1. Change status from ENUM to VARCHAR if needed
        const statusType = await sequelize.query(
            `SELECT data_type FROM information_schema.columns 
             WHERE table_name='member_requests' AND column_name='status'`,
            { type: Sequelize.QueryTypes.SELECT }
        );
        if (statusType.length > 0 && statusType[0].data_type === 'USER-DEFINED') {
            console.log('🔧 Converting status column from ENUM to VARCHAR...');
            await sequelize.query(`
                ALTER TABLE member_requests 
                ALTER COLUMN status TYPE VARCHAR(50) 
                USING status::VARCHAR(50);
            `);
            await sequelize.query(`
                ALTER TABLE member_requests 
                ALTER COLUMN status SET DEFAULT 'non vue';
            `);
            console.log('✅ Status column converted.');
        }

        // 2. Drop the old ENUM type if it exists (cleanup)
        await sequelize.query(`
            DO $$ BEGIN
                DROP TYPE IF EXISTS "public"."enum_member_requests_status";
            EXCEPTION WHEN OTHERS THEN NULL;
            END $$;
        `).catch(() => { });

        // 3. Add missing columns with defaults (safe)
        const newColumns = {
            title: `ALTER TABLE member_requests ADD COLUMN IF NOT EXISTS "title" VARCHAR(255) DEFAULT ''`,
            "requestType": `ALTER TABLE member_requests ADD COLUMN IF NOT EXISTS "requestType" VARCHAR(100) DEFAULT ''`,
            description: `ALTER TABLE member_requests ADD COLUMN IF NOT EXISTS "description" TEXT DEFAULT ''`,
            "internalNote": `ALTER TABLE member_requests ADD COLUMN IF NOT EXISTS "internalNote" TEXT`,
            "assignedToId": `ALTER TABLE member_requests ADD COLUMN IF NOT EXISTS "assignedToId" INTEGER`,
            "statusUpdateDate": `ALTER TABLE member_requests ADD COLUMN IF NOT EXISTS "statusUpdateDate" TIMESTAMP WITH TIME ZONE DEFAULT NOW()`,
        };

        for (const [col, sql] of Object.entries(newColumns)) {
            if (!existingColumns.includes(col)) {
                console.log(`➕ Adding column: ${col}`);
                await sequelize.query(sql);
            } else {
                console.log(`   Column already exists: ${col}`);
            }
        }

        // 4. Make sure churchId is nullable
        await sequelize.query(`
            ALTER TABLE member_requests ALTER COLUMN "churchId" DROP NOT NULL;
        `).catch(() => { });

        // 5. Make sure userId is nullable
        await sequelize.query(`
            ALTER TABLE member_requests ALTER COLUMN "userId" DROP NOT NULL;
        `).catch(() => { });

        console.log('\n✅ Migration completed successfully!');
        console.log('   You can now restart the server with: node server.js');

    } catch (err) {
        console.error('❌ Migration failed:', err.message);
        console.error(err);
        process.exit(1);
    } finally {
        await sequelize.close();
    }
}

migrate();
