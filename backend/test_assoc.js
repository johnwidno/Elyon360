const db = require('./models');
async function run() {
    try {
        const post = await db.CommunityPost.findOne({
            include: [
                { model: db.User, as: 'author', attributes: ['id'] },
                { model: db.ContactSubtype, as: 'targetSubtype', attributes: ['name'] }
            ]
        });
        console.log("Success! Found post:", post?.id);
    } catch (err) {
        console.error("FAILED association check:");
        console.error(err);
    }
    process.exit();
}
run();
