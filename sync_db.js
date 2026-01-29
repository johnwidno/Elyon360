const fs = require('fs');
const path = require('path');

// Manually load .env
const envPath = path.join(__dirname, 'backend', '.env');
if (fs.existsSync(envPath)) {
    const env = fs.readFileSync(envPath, 'utf8');
    env.split(/\r?\n/).forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            const value = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
            process.env[key] = value;
        }
    });
}

const db = require('./backend/models');

async function sync() {
    try {
        console.log("Syncing database...");
        await db.sequelize.sync({ alter: true });
        console.log("Database synced successfully!");
        process.exit(0);
    } catch (err) {
        console.error("SYNC ERROR:", err);
        process.exit(1);
    }
}

sync();
