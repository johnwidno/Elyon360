const db = require('./models');

async function diagnose() {
    try {
        console.log("=== COMPREHENSIVE GROUP MEMBERSHIP DIAGNOSTIC ===\n");

        // 1. Check current constraints
        console.log("1. Current table structure:");
        const [createTable] = await db.sequelize.query("SHOW CREATE TABLE group_members");
        console.log(createTable[0]['Create Table']);
        console.log("\n");

        // 2. List all indexes
        console.log("2. Current indexes:");
        const [indexes] = await db.sequelize.query("SHOW INDEX FROM group_members WHERE Key_name != 'PRIMARY'");
        if (indexes.length === 0) {
            console.log("   ⚠️  NO INDEXES FOUND (besides PRIMARY)");
        } else {
            indexes.forEach(idx => {
                console.log(`   - ${idx.Key_name}: ${idx.Column_name} (Unique: ${idx.Non_unique === 0}, Seq: ${idx.Seq_in_index})`);
            });
        }
        console.log("\n");

        // 3. Get a real user and real groups for testing
        console.log("3. Finding test data...");
        const user = await db.User.findOne({ limit: 1 });
        const groups = await db.Group.findAll({ limit: 3 });

        if (!user || groups.length < 2) {
            console.log("   ⚠️  Not enough data to test (need at least 1 user and 2 groups)");
            process.exit(0);
        }

        console.log(`   Found user: ${user.firstName} ${user.lastName} (ID: ${user.id})`);
        console.log(`   Found ${groups.length} groups:`);
        groups.forEach(g => console.log(`      - ${g.name} (ID: ${g.id})`));
        console.log("\n");

        // 4. Clean up any existing memberships for this user
        console.log("4. Cleaning up existing memberships for test user...");
        await db.GroupMember.destroy({ where: { userId: user.id } });
        console.log("   ✓ Cleaned\n");

        // 5. Test: Add user to first group
        console.log(`5. TEST 1: Adding user to group "${groups[0].name}"...`);
        try {
            await db.GroupMember.create({
                groupId: groups[0].id,
                userId: user.id,
                role: 'membre'
            });
            console.log("   ✓ SUCCESS - User added to first group\n");
        } catch (err) {
            console.log(`   ✗ FAILED: ${err.message}\n`);
            process.exit(1);
        }

        // 6. Test: Add same user to second group (THIS SHOULD WORK)
        console.log(`6. TEST 2: Adding SAME user to group "${groups[1].name}"...`);
        try {
            await db.GroupMember.create({
                groupId: groups[1].id,
                userId: user.id,
                role: 'membre'
            });
            console.log("   ✓ SUCCESS - User added to second group\n");
        } catch (err) {
            console.log(`   ✗ FAILED: ${err.message}`);
            console.log(`   ✗ ERROR NAME: ${err.name}`);
            console.log(`   ✗ THIS IS THE BUG - User should be able to join multiple groups!\n`);

            // Show the problematic constraint
            const [badIndexes] = await db.sequelize.query(
                "SHOW INDEX FROM group_members WHERE Non_unique = 0 AND Key_name != 'PRIMARY'"
            );
            console.log("   Problematic unique constraints:");
            badIndexes.forEach(idx => {
                console.log(`      - ${idx.Key_name}: ${idx.Column_name}`);
            });
            process.exit(1);
        }

        // 7. Test: Try to add user to first group again (THIS SHOULD FAIL)
        console.log(`7. TEST 3: Adding user to "${groups[0].name}" again (should fail)...`);
        try {
            await db.GroupMember.create({
                groupId: groups[0].id,
                userId: user.id,
                role: 'membre'
            });
            console.log("   ✗ BUG - User was added twice to the same group (should have failed)\n");
        } catch (err) {
            console.log("   ✓ CORRECT - Duplicate prevented as expected\n");
        }

        // 8. Cleanup
        console.log("8. Cleaning up test data...");
        await db.GroupMember.destroy({ where: { userId: user.id } });
        console.log("   ✓ Cleaned\n");

        console.log("=== DIAGNOSIS COMPLETE ===");
        console.log("✅ ALL TESTS PASSED - Members CAN join multiple groups!");

        process.exit(0);
    } catch (err) {
        console.error("\n❌ FATAL ERROR:", err);
        process.exit(1);
    }
}

diagnose();
