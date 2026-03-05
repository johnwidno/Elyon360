const db = require('./models');

async function testCreatePost() {
    try {
        const user = await db.User.findOne({ where: { email: 'super@elyonsys.com' } });
        if (!user) {
            console.log('Super admin not found');
            return;
        }
        console.log('Testing post creation for user:', user.email, 'churchId:', user.churchId);

        const post = await db.CommunityPost.create({
            churchId: user.churchId,
            authorId: user.id,
            title: 'Test Post',
            content: 'Test Content',
            type: 'general'
        });
        console.log('Post created successfully:', post.id);
    } catch (err) {
        console.error('FAILED TO CREATE POST:', err);
        if (err.parent) console.error('PARENT ERROR:', err.parent.message);
    } finally {
        process.exit();
    }
}

testCreatePost();
