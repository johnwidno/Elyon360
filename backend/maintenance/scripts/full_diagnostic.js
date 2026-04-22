const db = require('./models');

async function fullDiagnostic() {
    try {
        console.log("=== COMPLETE DIAGNOSTIC FOR GROUP MEMBERSHIP BUG ===\n");

        // 1. Show table structure
        console.log("1. TABLE STRUCTURE:");
        const [structure] = await db.sequelize.query("DESCRIBE group_members");
        structure.forEach(col => {
            console.log(`   ${col.Field}: ${col.Type} ${col.Key ? `(${col.Key})` : ''}`);
        });
        console.log();

        // 2. Show ALL indexes in detail
        console.log("2. ALL INDEXES:");
        const [indexes] = await db.sequelize.query("SHOW INDEX FROM group_members");
        const groupedIndexes = {};
        indexes.forEach(idx => {
            if (!groupedIndexes[idx.Key_name]) {
                groupedIndexes[idx.Key_name] = {
                    unique: idx.Non_unique === 0,
                    columns: []
                };
            }
            groupedIndexes[idx.Key_name].columns.push(idx.Column_name);
        });

        Object.entries(groupedIndexes).forEach(([name, info]) => {
            console.log(`   ${name}: [${info.columns.join(', ')}] - ${info.unique ? 'UNIQUE' : 'NON-UNIQUE'}`);
        });
        console.log();

        // 3. Show current memberships
        console.log("3. CURRENT MEMBERSHIPS:");
        const memberships = await db.GroupMember.findAll({
            include: [
                { model: db.User, as: 'user', attributes: ['firstName', 'lastName'] },
                { model: db.Group, as: 'group', attributes: ['name'] }
            ],
            limit: 10
        });
        memberships.forEach(m => {
            const userName = m.user ? `${m.user.firstName} ${m.user.lastName}` : 'Unknown';
            const groupName = m.group ? m.group.name : 'Unknown';
            console.log(`   User ${userName} (ID: ${m.userId}) → Group ${groupName} (ID: ${m.groupId})`);
        });
        console.log();

        // 4. Get test data
        console.log("4. PREPARING TEST DATA:");
        const testUser = await db.User.findOne();
        const testGroups = await db.Group.findAll({ limit: 2 });

        if (!testUser || testGroups.length < 2) {
            console.log("   ⚠️  Need at least 1 user and 2 groups to test");
            process.exit(0);
        }

        console.log(`   User: ${testUser.firstName} ${testUser.lastName} (ID: ${testUser.id})`);
        testGroups.forEach(g => console.log(`   Group: ${g.name} (ID: ${g.id})`));
        console.log();

        // 5. Clean test data
        console.log("5. CLEANING TEST USER FROM ALL GROUPS:");
        const deleted = await db.GroupMember.destroy({ where: { userId: testUser.id } });
        console.log(`   Removed ${deleted} memberships\n`);

        // 6. TEST 1: Add to first group
        console.log(`6. TEST 1: Add user to "${testGroups[0].name}"`);
        try {
            await db.GroupMember.create({
                groupId: testGroups[0].id,
                userId: testUser.id,
                role: 'membre'
            });
            console.log("   ✅ SUCCESS\n");
        } catch (err) {
            console.log(`   ❌ FAILED: ${err.message}\n`);
            process.exit(1);
        }

        // 7. TEST 2: Add to second group (CRITICAL TEST)
        console.log(`7. TEST 2: Add SAME user to "${testGroups[1].name}" (SHOULD SUCCEED)`);
        try {
            // First, manually check if record exists
            const check = await db.GroupMember.findOne({
                where: { groupId: testGroups[1].id, userId: testUser.id }
            });
            console.log(`   Pre-check: Record exists? ${check ? 'YES' : 'NO'}`);

            // Now try to create
            await db.GroupMember.create({
                groupId: testGroups[1].id,
                userId: testUser.id,
                role: 'membre'
            });
            console.log("   ✅ SUCCESS - User can be in multiple groups!\n");
        } catch (err) {
            console.log(`   ❌ FAILED: ${err.message}`);
            console.log(`   Error type: ${err.name}`);
            if (err.parent) {
                console.log(`   SQL Error: ${err.parent.sqlMessage}`);
                console.log(`   SQL Code: ${err.parent.code}`);
            }
            console.log("\n   🔍 THIS IS THE BUG - User cannot join multiple groups!");
            console.log("   The database has a constraint preventing this.\n");

            // Show which constraint is blocking
            const [badConstraints] = await db.sequelize.query(
                "SELECT * FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_NAME = 'group_members' AND CONSTRAINT_NAME != 'PRIMARY'"
            );
            console.log("   Active constraints:");
            badConstraints.forEach(c => {
                console.log(`      - ${c.CONSTRAINT_NAME}: ${c.COLUMN_NAME}`);
            });

            process.exit(1);
        }

        // 8. Cleanup
        console.log("8. CLEANUP:");
        await db.GroupMember.destroy({ where: { userId: testUser.id } });
        console.log("   ✓ Test data removed\n");

        console.log("=== DIAGNOSTIC COMPLETE ===");
        console.log("✅ System is working correctly!");
        console.log("Users CAN join multiple groups.");

        process.exit(0);
    } catch (err) {
        console.error("\n❌ FATAL ERROR:", err);
        process.exit(1);
    }
}

// Add associations manually since we're outside the normal app flow
db.GroupMember.belongsTo(db.User, { foreignKey: 'userId', as: 'user' });
db.GroupMember.belongsTo(db.Group, { foreignKey: 'groupId', as: 'group' });

fullDiagnostic();
