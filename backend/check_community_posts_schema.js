const db = require('./models');

async function checkSchema() {
    try {
        const [results] = await db.sequelize.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'community_posts'
            ORDER BY ordinal_position;
        `);
        console.log('--- CommunityPost Schema ---');
        results.forEach(col => {
            console.log(`${col.column_name}: ${col.data_type} (Nullable: ${col.is_nullable})`);
        });

        const [enumCheck] = await db.sequelize.query(`
            SELECT t.typname, e.enumlabel
            FROM pg_type t 
            JOIN pg_enum e ON t.oid = e.enumtypid
            WHERE t.typname = 'enum_community_posts_type';
        `);
        console.log('--- ENUM labels ---');
        console.log(enumCheck);
    } catch (err) {
        console.error('Schema check failed:', err);
    } finally {
        process.exit();
    }
}

checkSchema();
