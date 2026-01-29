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
const Op = db.Sequelize.Op;

async function test(subdomain) {
    try {
        console.log(`\n--- TESTING QUERY FOR: ${subdomain} ---`);
        const church = await db.Church.findOne({
            where: {
                [Op.or]: [
                    { subdomain: subdomain },
                    { customDomain: subdomain },
                    { acronym: subdomain.toUpperCase() },
                    { acronym: subdomain.toLowerCase() }
                ]
            }
        });

        if (church) {
            console.log(`FOUND: ${church.name} (Subdomain: ${church.subdomain}, Acronym: ${church.acronym})`);
        } else {
            console.log("NOT FOUND");
        }
    } catch (err) {
        console.error("TEST ERROR:", err);
    }
}

async function run() {
    await test("EDD");
    await test("edd");
    await test("edb");
    await test("EDB");
    process.exit(0);
}

run();
