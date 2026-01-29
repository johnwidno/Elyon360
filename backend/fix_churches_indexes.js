require('dotenv').config();
const mysql = require('mysql2/promise');

async function fixChurchesIndexes() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        console.log('='.repeat(60));
        console.log('CHURCHES TABLE INDEX ANALYSIS');
        console.log('='.repeat(60));
        console.log('');

        // Get all indexes
        const [indexes] = await connection.query('SHOW INDEXES FROM churches');

        console.log(`Total indexes found: ${indexes.length}`);
        console.log('');

        // Get foreign key constraints
        const [fkConstraints] = await connection.query(`
      SELECT CONSTRAINT_NAME, COLUMN_NAME 
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'churches' 
      AND REFERENCED_TABLE_NAME IS NOT NULL
    `, [process.env.DB_NAME]);

        const fkColumns = new Set(fkConstraints.map(fk => fk.COLUMN_NAME));

        // Group by index name
        const indexGroups = {};
        indexes.forEach(idx => {
            if (!indexGroups[idx.Key_name]) {
                indexGroups[idx.Key_name] = {
                    unique: idx.Non_unique === 0,
                    columns: []
                };
            }
            indexGroups[idx.Key_name].columns.push(idx.Column_name);
        });

        console.log('Current indexes:');
        console.log('-'.repeat(60));
        Object.keys(indexGroups).forEach(name => {
            const group = indexGroups[name];
            const type = name === 'PRIMARY' ? 'PRIMARY KEY' : (group.unique ? 'UNIQUE' : 'INDEX');
            const fkMarker = group.columns.some(col => fkColumns.has(col)) ? ' [FK]' : '';
            console.log(`  ${name}: ${type}${fkMarker}`);
            console.log(`    Columns: ${group.columns.join(', ')}`);
        });

        console.log('');
        console.log('='.repeat(60));
        console.log('CLEANUP STRATEGY');
        console.log('='.repeat(60));
        console.log('');

        // Strategy: Keep only essential indexes
        const essential = ['PRIMARY']; // Will add subdomain and customDomain unique indexes
        const toKeep = ['PRIMARY'];
        const toDrop = [];

        // Find the best unique indexes for subdomain and customDomain
        let foundSubdomain = false;
        let foundCustomDomain = false;

        Object.keys(indexGroups).forEach(name => {
            if (name === 'PRIMARY') return;

            const group = indexGroups[name];
            const isFK = group.columns.some(col => fkColumns.has(col));

            // Keep FK indexes
            if (isFK) {
                toKeep.push(name);
                return;
            }

            // Keep one unique index for subdomain
            if (!foundSubdomain && group.columns.includes('subdomain') && group.unique) {
                toKeep.push(name);
                foundSubdomain = true;
                return;
            }

            // Keep one unique index for customDomain  
            if (!foundCustomDomain && group.columns.includes('customDomain') && group.unique) {
                toKeep.push(name);
                foundCustomDomain = true;
                return;
            }

            // Everything else can be dropped
            toDrop.push(name);
        });

        console.log('Indexes to KEEP:');
        toKeep.forEach(name => console.log(`  ✓ ${name}`));

        console.log('');
        console.log(`Indexes to DROP (${toDrop.length}):`);
        toDrop.forEach(name => console.log(`  ✗ ${name}`));

        if (toDrop.length === 0) {
            console.log('');
            console.log('✅ No indexes to drop. Table is already optimized.');
            const [finalIndexes] = await connection.query('SHOW INDEXES FROM churches');
            console.log(`Final index count: ${finalIndexes.length}`);
            return;
        }

        console.log('');
        console.log('='.repeat(60));
        console.log('EXECUTING CLEANUP...');
        console.log('='.repeat(60));
        console.log('');

        let dropped = 0;
        let failed = 0;

        for (const indexName of toDrop) {
            try {
                await connection.query(`ALTER TABLE churches DROP INDEX \`${indexName}\``);
                console.log(`✓ Dropped: ${indexName}`);
                dropped++;
            } catch (err) {
                console.error(`✗ Failed to drop ${indexName}: ${err.message}`);
                failed++;
            }
        }

        console.log('');
        console.log('='.repeat(60));
        console.log('SUMMARY');
        console.log('='.repeat(60));
        console.log(`Successfully dropped: ${dropped} indexes`);
        console.log(`Failed to drop: ${failed} indexes`);

        // Verify final count
        const [finalIndexes] = await connection.query('SHOW INDEXES FROM churches');
        console.log(`Final index count: ${finalIndexes.length}`);

        if (finalIndexes.length >= 64) {
            console.log('');
            console.log('⚠️  WARNING: Still at or above 64 indexes!');
            console.log('Additional manual intervention may be required.');
        } else {
            console.log('');
            console.log('✅ Success! Index count is now below the limit.');
        }

    } catch (error) {
        console.error('');
        console.error('❌ ERROR:', error.message);
        console.error(error.stack);
    } finally {
        await connection.end();
    }
}

fixChurchesIndexes();
