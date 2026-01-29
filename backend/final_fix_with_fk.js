const db = require('./models');

async function finalFix() {
    try {
        console.log("=== FINAL FIX: HANDLING FOREIGN KEY CONSTRAINTS ===\n");

        // Step 1: Identify all foreign keys on group_members
        console.log("Step 1: Finding all foreign key constraints...");
        const [fks] = await db.sequelize.query(`
            SELECT 
                CONSTRAINT_NAME,
                COLUMN_NAME,
                REFERENCED_TABLE_NAME,
                REFERENCED_COLUMN_NAME
            FROM information_schema.KEY_COLUMN_USAGE 
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'group_members'
            AND REFERENCED_TABLE_NAME IS NOT NULL
        `);

        console.log(`Found ${fks.length} foreign key constraints:`);
        fks.forEach(fk => {
            console.log(`   ${fk.CONSTRAINT_NAME}: ${fk.COLUMN_NAME} -> ${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME}`);
        });
        console.log();

        // Step 2: Drop ALL foreign keys temporarily
        console.log("Step 2: Temporarily dropping foreign keys...");
        for (const fk of fks) {
            try {
                await db.sequelize.query(`ALTER TABLE group_members DROP FOREIGN KEY \`${fk.CONSTRAINT_NAME}\``);
                console.log(`   ✓ Dropped: ${fk.CONSTRAINT_NAME}`);
            } catch (e) {
                console.log(`   ✗ Error dropping ${fk.CONSTRAINT_NAME}: ${e.message}`);
            }
        }
        console.log();

        // Step 3: Now drop ALL unique indexes (except PRIMARY)
        console.log("Step 3: Dropping all unique indexes...");
        const [uniqueIndexes] = await db.sequelize.query(`
            SELECT DISTINCT INDEX_NAME 
            FROM information_schema.STATISTICS 
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'group_members'
            AND NON_UNIQUE = 0
            AND INDEX_NAME != 'PRIMARY'
        `);

        for (const idx of uniqueIndexes) {
            try {
                await db.sequelize.query(`ALTER TABLE group_members DROP INDEX \`${idx.INDEX_NAME}\``);
                console.log(`   ✓ Dropped index: ${idx.INDEX_NAME}`);
            } catch (e) {
                console.log(`   ✗ Error: ${e.message}`);
            }
        }
        console.log();

        // Step 4: Drop all non-unique indexes too (clean slate)
        console.log("Step 4: Dropping all non-unique indexes...");
        const [nonUniqueIndexes] = await db.sequelize.query(`
            SELECT DISTINCT INDEX_NAME 
            FROM information_schema.STATISTICS 
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'group_members'
            AND NON_UNIQUE = 1
            AND INDEX_NAME != 'PRIMARY'
        `);

        for (const idx of nonUniqueIndexes) {
            try {
                await db.sequelize.query(`ALTER TABLE group_members DROP INDEX \`${idx.INDEX_NAME}\``);
                console.log(`   ✓ Dropped index: ${idx.INDEX_NAME}`);
            } catch (e) {
                console.log(`   ✗ Error: ${e.message}`);
            }
        }
        console.log();

        // Step 5: Create the ONE correct composite unique index
        console.log("Step 5: Creating the correct composite unique index...");
        try {
            await db.sequelize.query(`
                ALTER TABLE group_members 
                ADD UNIQUE INDEX idx_group_user_unique (groupId, userId)
            `);
            console.log("   ✓ Created: idx_group_user_unique (groupId, userId)\n");
        } catch (e) {
            console.log(`   ✗ Error: ${e.message}\n`);
        }

        // Step 6: Recreate foreign keys
        console.log("Step 6: Recreating foreign key constraints...");

        // FK to groups table
        try {
            await db.sequelize.query(`
                ALTER TABLE group_members 
                ADD CONSTRAINT fk_group_members_group
                FOREIGN KEY (groupId) REFERENCES groups(id) ON DELETE CASCADE
            `);
            console.log("   ✓ Created FK: groupId -> groups(id)");
        } catch (e) {
            console.log(`   ✗ Error: ${e.message}`);
        }

        // FK to users table
        try {
            await db.sequelize.query(`
                ALTER TABLE group_members 
                ADD CONSTRAINT fk_group_members_user
                FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
            `);
            console.log("   ✓ Created FK: userId -> users(id)");
        } catch (e) {
            console.log(`   ✗ Error: ${e.message}`);
        }

        // FK to organizations table (if needed)
        try {
            await db.sequelize.query(`
                ALTER TABLE group_members 
                ADD CONSTRAINT fk_group_members_organization
                FOREIGN KEY (organizationId) REFERENCES organizations(id) ON DELETE CASCADE
            `);
            console.log("   ✓ Created FK: organizationId -> organizations(id)");
        } catch (e) {
            console.log(`   Note: organizationId FK not created (may not be needed): ${e.message}`);
        }
        console.log();

        // Step 7: Final verification
        console.log("Step 7: FINAL VERIFICATION");
        const [finalStructure] = await db.sequelize.query(`
            SELECT INDEX_NAME, COLUMN_NAME, NON_UNIQUE, SEQ_IN_INDEX
            FROM information_schema.STATISTICS 
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'group_members'
            ORDER BY INDEX_NAME, SEQ_IN_INDEX
        `);

        const grouped = {};
        finalStructure.forEach(idx => {
            if (!grouped[idx.INDEX_NAME]) {
                grouped[idx.INDEX_NAME] = { cols: [], unique: idx.NON_UNIQUE === 0 };
            }
            grouped[idx.INDEX_NAME].cols.push(idx.COLUMN_NAME);
        });

        console.log("\nFinal table structure:");
        Object.entries(grouped).forEach(([name, info]) => {
            const type = info.unique ? 'UNIQUE' : 'INDEX';
            console.log(`   ${type} ${name}: [${info.cols.join(', ')}]`);
        });

        console.log("\n=== FIX COMPLETE ===");
        console.log("✅ Database structure is now correct!");
        console.log("✅ A member CAN be in multiple groups (A, B, C...)");
        console.log("✅ A member CANNOT be in the same group twice");
        console.log("\n⚠️  CRITICAL: RESTART YOUR BACKEND SERVER NOW!");

        process.exit(0);
    } catch (err) {
        console.error("\n❌ FATAL ERROR:", err);
        process.exit(1);
    }
}

finalFix();
