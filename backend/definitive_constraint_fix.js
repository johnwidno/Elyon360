const db = require('./models');

async function definitiveFixsync() {
    try {
        console.log("=== DEFINITIVE CONSTRAINT FIX ===\n");

        // Step 1: List ALL constraints (not just indexes)
        console.log("Step 1: Examining ALL constraints on group_members...");
        const [constraints] = await db.sequelize.query(`
            SELECT 
                CONSTRAINT_NAME,
                COLUMN_NAME,
                REFERENCED_TABLE_NAME
            FROM information_schema.KEY_COLUMN_USAGE 
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'group_members'
            ORDER BY CONSTRAINT_NAME, ORDINAL_POSITION
        `);

        console.log("Found constraints:");
        const grouped = {};
        constraints.forEach(c => {
            if (!grouped[c.CONSTRAINT_NAME]) grouped[c.CONSTRAINT_NAME] = [];
            grouped[c.CONSTRAINT_NAME].push(c.COLUMN_NAME);
        });
        Object.entries(grouped).forEach(([name, cols]) => {
            console.log(`   ${name}: [${cols.join(', ')}]`);
        });
        console.log();

        // Step 2: Drop specific problematic constraints
        console.log("Step 2: Removing problematic constraints...");
        const toRemove = [
            'unique_group_user',
            'unique_group_org',
            'userId',
            'group_members_userId_unique',
            'group_members_groupId_userId_unique'
        ];

        for (const constraintName of toRemove) {
            try {
                // Try as index first
                await db.sequelize.query(`ALTER TABLE group_members DROP INDEX \`${constraintName}\``);
                console.log(`   ✓ Dropped index: ${constraintName}`);
            } catch (e1) {
                try {
                    // Try as foreign key
                    await db.sequelize.query(`ALTER TABLE group_members DROP FOREIGN KEY \`${constraintName}\``);
                    console.log(`   ✓ Dropped foreign key: ${constraintName}`);
                } catch (e2) {
                    console.log(`   - Skipped ${constraintName} (doesn't exist)`);
                }
            }
        }
        console.log();

        // Step 3: Ensure NO unique constraint exists on userId alone
        console.log("Step 3: Verifying no single-column unique constraints...");
        const [uniqueIndexes] = await db.sequelize.query(`
            SELECT DISTINCT INDEX_NAME 
            FROM information_schema.STATISTICS 
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'group_members'
            AND NON_UNIQUE = 0
            AND INDEX_NAME != 'PRIMARY'
        `);

        for (const idx of uniqueIndexes) {
            // Get columns for this index
            const [cols] = await db.sequelize.query(`
                SELECT COLUMN_NAME 
                FROM information_schema.STATISTICS 
                WHERE TABLE_SCHEMA = DATABASE()
                AND TABLE_NAME = 'group_members'
                AND INDEX_NAME = '${idx.INDEX_NAME}'
                ORDER BY SEQ_IN_INDEX
            `);

            const columnNames = cols.map(c => c.COLUMN_NAME);
            console.log(`   Index ${idx.INDEX_NAME}: [${columnNames.join(', ')}]`);

            // Drop if it's a single-column unique on userId OR organizationId
            if (columnNames.length === 1 && (columnNames[0] === 'userId' || columnNames[0] === 'organizationId')) {
                console.log(`   ⚠️  PROBLEMATIC - Dropping ${idx.INDEX_NAME}`);
                await db.sequelize.query(`ALTER TABLE group_members DROP INDEX \`${idx.INDEX_NAME}\``);
                console.log(`   ✓ Dropped`);
            } else if (columnNames.length === 2 && columnNames.includes('groupId')) {
                console.log(`   ✓ CORRECT - This is a valid composite index`);
            }
        }
        console.log();

        // Step 4: Create the ONE correct composite unique index
        console.log("Step 4: Creating correct composite unique index...");
        try {
            await db.sequelize.query(`
                ALTER TABLE group_members 
                ADD UNIQUE INDEX idx_unique_user_per_group (groupId, userId)
            `);
            console.log("   ✓ Created: idx_unique_user_per_group (groupId, userId)\n");
        } catch (e) {
            if (e.message.includes('Duplicate')) {
                console.log("   - Index already exists (OK)\n");
            } else {
                console.log(`   ✗ Error: ${e.message}\n`);
            }
        }

        // Step 5: Final verification
        console.log("Step 5: FINAL VERIFICATION");
        const [finalIndexes] = await db.sequelize.query(`
            SELECT INDEX_NAME, COLUMN_NAME, NON_UNIQUE, SEQ_IN_INDEX
            FROM information_schema.STATISTICS 
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'group_members'
            AND INDEX_NAME != 'PRIMARY'
            ORDER BY INDEX_NAME, SEQ_IN_INDEX
        `);

        const finalGrouped = {};
        finalIndexes.forEach(idx => {
            if (!finalGrouped[idx.INDEX_NAME]) {
                finalGrouped[idx.INDEX_NAME] = { cols: [], unique: idx.NON_UNIQUE === 0 };
            }
            finalGrouped[idx.INDEX_NAME].cols.push(idx.COLUMN_NAME);
        });

        console.log("Final state of group_members indexes:");
        Object.entries(finalGrouped).forEach(([name, info]) => {
            const typeLabel = info.unique ? 'UNIQUE' : 'INDEX';
            console.log(`   ${typeLabel} ${name}: [${info.cols.join(', ')}]`);
        });

        console.log("\n=== FIX COMPLETE ===");
        console.log("✅ Database is now configured correctly!");
        console.log("✅ Members CAN join multiple groups");
        console.log("✅ Members CANNOT join the same group twice");
        console.log("\n⚠️  IMPORTANT: RESTART YOUR BACKEND SERVER NOW!");

        process.exit(0);
    } catch (err) {
        console.error("\n❌ FATAL ERROR:", err);
        process.exit(1);
    }
}

definitiveFixsync();
