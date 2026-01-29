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

async function debug() {
    try {
        console.log("--- DEBUG DATABASE ---");
        console.log("Connecting as:", process.env.DB_USER, "to", process.env.DB_NAME);

        const churches = await db.Church.findAll();
        console.log("CHURCHES found:", churches.length);
        churches.forEach(c => {
            console.log(`- ID: ${c.id}, Name: ${c.name}, Subdomain: ${c.subdomain}, Acronym: ${c.acronym}, Status: ${c.status}`);
        });

        const church9 = await db.Church.findByPk(9);
        if (church9) {
            console.log("\n--- CHURCH 9 DETAILS ---");
            console.log(JSON.stringify(church9, null, 2));
        } else {
            console.log("\n--- CHURCH 9 NOT FOUND ---");
        }

        const users = await db.User.findAll();
        console.log("\nUSERS found:", users.length);
        users.forEach(u => {
            console.log(`- ID: ${u.id}, Email: ${u.email}, Role: ${u.role}, ChurchId: ${u.churchId}`);
        });

        process.exit(0);
    } catch (err) {
        console.error("DEBUG ERROR:", err);
        process.exit(1);
    }
}

debug();
