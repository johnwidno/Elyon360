const db = require('./models');
const { generateMemberCode } = require('./utils/userUtils');

const migrate = async () => {
    try {
        console.log("Starting Member Code migration (Robust Mode)...");

        // Fetch all users
        const users = await db.User.findAll();

        // Fetch all churches and index them by id
        const churchesList = await db.Church.findAll();
        const churches = {};
        churchesList.forEach(c => {
            churches[c.id] = c;
        });

        console.log(`Processing ${users.length} users...`);

        for (const user of users) {
            if (!user.memberCode) {
                const church = churches[user.churchId];
                if (!church) {
                    console.warn(`User ${user.id} (${user.email}) has no church association (churchId: ${user.churchId}). Skipping.`);
                    continue;
                }

                const code = generateMemberCode(user, church);
                if (code) {
                    await user.update({ memberCode: code });
                    console.log(`Generated code ${code} for user ${user.id}: ${user.firstName} ${user.lastName}`);
                }
            } else {
                console.log(`User ${user.id} already has code: ${user.memberCode}`);
            }
        }

        console.log("Migration complete.");
        process.exit(0);
    } catch (err) {
        console.error("Migration error:", err);
        process.exit(1);
    }
};

migrate();
