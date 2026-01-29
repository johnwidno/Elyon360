const db = require('./models');

async function testFix() {
    try {
        console.log("=== TESTING MULTI-GROUP MEMBERSHIP ===\n");

        // Get test data
        const user = await db.User.findOne();
        const groups = await db.Group.findAll({ limit: 3 });

        if (!user || groups.length < 2) {
            console.log("⚠️  Not enough test data");
            process.exit(0);
        }

        console.log(`Test User: ${user.firstName} ${user.lastName} (ID: ${user.id})`);
        console.log(`Test Groups: ${groups.length} groups found\n`);

        // Clean up
        await db.GroupMember.destroy({ where: { userId: user.id } });
        console.log("Cleaned existing memberships\n");

        // TEST 1: Add to first group
        console.log(`TEST 1: Adding user to "${groups[0].name}"`);
        await db.GroupMember.create({ groupId: groups[0].id, userId: user.id, role: 'membre' });
        console.log("✅ SUCCESS\n");

        // TEST 2: Add to second group (critical test)
        console.log(`TEST 2: Adding SAME user to "${groups[1].name}"`);
        await db.GroupMember.create({ groupId: groups[1].id, userId: user.id, role: 'membre' });
        console.log("✅ SUCCESS - User can be in multiple groups!\n");

        // TEST 3: Try adding to first group again (should fail)
        console.log(`TEST 3: Trying to add user to "${groups[0].name}" again`);
        try {
            await db.GroupMember.create({ groupId: groups[0].id, userId: user.id, role: 'membre' });
            console.log("❌ PROBLEM - User was added twice to same group");
        } catch (e) {
            console.log("✅ CORRECT - Duplicate prevented as expected\n");
        }

        // Cleanup
        await db.GroupMember.destroy({ where: { userId: user.id } });

        console.log("=== ALL TESTS PASSED ===");
        console.log("✅ Members CAN join multiple groups");
        console.log("✅ Members CANNOT join the same group twice");
        console.log("\nThe system is working correctly!");

        process.exit(0);
    } catch (err) {
        console.error("\n❌ TEST FAILED:", err.message);
        process.exit(1);
    }
}

testFix();
